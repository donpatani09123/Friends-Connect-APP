import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { CallRecord, CallStateType, CallState, UserRole, AccountTier } from '../shared/types';
import { config } from '../config';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

export class CallsService {
  // In-memory source of truth for active calls
  public static activeCalls: Map<string, CallRecord> = new Map();
  // User to active callId index
  public static userCallMap: Map<string, string> = new Map();
  // 30s ringing timeout timers
  public static ringingTimers: Map<string, NodeJS.Timeout> = new Map();
  // 10s disconnect grace period timers
  public static disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  // Rate-limiting tracker: userId -> RateLimitTracker
  private static rateLimits: Map<string, RateLimitTracker> = new Map();
  // Completed call history
  public static callHistory: CallRecord[] = [];

  /**
   * Returns ICE servers (Google STUN + coturn/Metered TURN credentials)
   */
  public static getIceServers() {
    return config.rtcIceServers;
  }

  /**
   * Rate limit validation: max 5 call initiations per 60s per user
   */
  private static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(userId, { count: 1, resetAt: now + 60000 });
      return true;
    }
    if (entry.count >= 5) {
      return false;
    }
    entry.count++;
    return true;
  }

  /**
   * Initiates a 1-on-1 Call with full gatekeeper & rate-limit validation
   */
  public static initiateCall(params: {
    callerId: string;
    calleeId: string;
    type: 'video' | 'audio';
  }): {
    success: boolean;
    call?: CallRecord;
    error?: string;
    code?: 'BUSY' | 'CALLER_BUSY' | 'PREMIUM_REQUIRED' | 'OFFLINE' | 'RATE_LIMITED' | 'BLOCKED' | 'NOT_FOUND';
  } {
    const { callerId, calleeId, type } = params;

    // 1. Rate limiting check
    if (!this.checkRateLimit(callerId)) {
      return {
        success: false,
        error: 'Too many calls initiated. Please wait 1 minute before trying again.',
        code: 'RATE_LIMITED'
      };
    }

    // 2. Caller exists and not blocked
    const caller = DataStore.users.get(callerId);
    if (!caller) {
      return { success: false, error: 'Caller account not found', code: 'NOT_FOUND' };
    }
    if (caller.isBlocked) {
      return { success: false, error: 'Your account is suspended by administration', code: 'BLOCKED' };
    }

    // 3. Callee exists and not blocked
    const callee = DataStore.users.get(calleeId);
    if (!callee) {
      return { success: false, error: 'Recipient account not found', code: 'NOT_FOUND' };
    }
    if (callee.isBlocked) {
      return { success: false, error: 'Recipient account is currently unavailable', code: 'BLOCKED' };
    }

    // 4. Callee online check
    const isCalleeOnline = DataStore.onlineUsers.has(calleeId);
    if (!isCalleeOnline) {
      return {
        success: false,
        error: `${DataStore.profiles.get(calleeId)?.fullName || 'User'} is currently offline`,
        code: 'OFFLINE'
      };
    }

    // 5. Callee not already in a call (emit call:busy)
    if (this.userCallMap.has(calleeId)) {
      return {
        success: false,
        error: `${DataStore.profiles.get(calleeId)?.fullName || 'User'} is currently busy in another call`,
        code: 'BUSY'
      };
    }

    // 6. Caller not already in a call
    if (this.userCallMap.has(callerId)) {
      return {
        success: false,
        error: 'You already have an active call in progress',
        code: 'CALLER_BUSY'
      };
    }

    // 7. Gatekeeper: Celebrity call requires active Premium plan
    if (callee.role === UserRole.CELEBRITY) {
      if (caller.tier !== AccountTier.PREMIUM_VIP) {
        return {
          success: false,
          error: 'An active Vibzz VIP Premium plan is required to place direct video/audio calls with verified creators.',
          code: 'PREMIUM_REQUIRED'
        };
      }
    }

    // 8. Create new call record and set State to 'calling'
    const callId = `call_${uuidv4().substring(0, 12)}`;
    const roomId = `room_${callId}`;
    const callerProfile = DataStore.profiles.get(callerId);
    const calleeProfile = DataStore.profiles.get(calleeId);

    const call: CallRecord = {
      callId,
      callerId,
      callerName: callerProfile?.fullName || caller.phoneNumber,
      callerPhone: caller.phoneNumber,
      callerAvatar: callerProfile?.avatarUrl,
      calleeId,
      calleeName: calleeProfile?.fullName || callee.phoneNumber,
      calleePhone: callee.phoneNumber,
      calleeAvatar: calleeProfile?.avatarUrl,
      type,
      state: 'calling',
      roomId,
      startedAt: new Date().toISOString(),
      duration: 0
    };

    this.activeCalls.set(callId, call);
    this.userCallMap.set(callerId, callId);
    this.userCallMap.set(calleeId, callId);

    console.log(`[Call State Machine] Call ${callId} initiated: ${call.callerName} -> ${call.calleeName} (${type})`);
    return { success: true, call };
  }

  /**
   * Set 30s Ringing Timeout for a call
   */
  public static setRingingTimeout(callId: string, onTimeout: (call: CallRecord) => void) {
    this.clearRingingTimeout(callId);
    const timer = setTimeout(() => {
      const call = this.activeCalls.get(callId);
      if (call && (call.state === 'calling' || call.state === 'ringing')) {
        call.state = 'missed';
        call.endedAt = new Date().toISOString();
        call.endReason = 'timeout_no_answer_30s';
        this.cleanupCall(callId);
        console.log(`[Call State Machine] Call ${callId} timed out after 30s (missed)`);
        onTimeout(call);
      }
    }, config.callRingingTimeoutMs);

    this.ringingTimers.set(callId, timer);
  }

  public static clearRingingTimeout(callId: string) {
    const timer = this.ringingTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.ringingTimers.delete(callId);
    }
  }

  /**
   * Callee accepts the call
   */
  public static acceptCall(callId: string, userId: string): { success: boolean; call?: CallRecord; error?: string } {
    const call = this.activeCalls.get(callId);
    if (!call) return { success: false, error: 'Call session not found' };
    if (call.calleeId !== userId) return { success: false, error: 'Unauthorized to accept this call' };
    if (call.state !== 'calling' && call.state !== 'ringing') {
      return { success: false, error: `Cannot accept call in '${call.state}' state` };
    }

    this.clearRingingTimeout(callId);
    call.state = 'accepted';
    call.acceptedAt = new Date().toISOString();

    console.log(`[Call State Machine] Call ${callId} ACCEPTED by ${call.calleeName}`);
    return { success: true, call };
  }

  /**
   * Mark call as successfully connected via WebRTC
   */
  public static markConnected(callId: string): CallRecord | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;
    call.state = 'connected';
    call.connectedAt = new Date().toISOString();
    console.log(`[Call State Machine] Call ${callId} CONNECTED (WebRTC streaming active)`);
    return call;
  }

  /**
   * Callee declines the call
   */
  public static declineCall(callId: string, userId: string): { success: boolean; call?: CallRecord; error?: string } {
    const call = this.activeCalls.get(callId);
    if (!call) return { success: false, error: 'Call session not found' };
    if (call.calleeId !== userId) return { success: false, error: 'Unauthorized to decline this call' };

    this.clearRingingTimeout(callId);
    call.state = 'declined';
    call.endedAt = new Date().toISOString();
    call.endReason = `${call.calleeName} declined the call`;
    this.cleanupCall(callId);

    console.log(`[Call State Machine] Call ${callId} DECLINED by ${call.calleeName}`);
    return { success: true, call };
  }

  /**
   * Caller cancels the call while ringing
   */
  public static cancelCall(callId: string, userId: string): { success: boolean; call?: CallRecord; error?: string } {
    const call = this.activeCalls.get(callId);
    if (!call) return { success: false, error: 'Call session not found' };
    if (call.callerId !== userId) return { success: false, error: 'Unauthorized to cancel this call' };

    this.clearRingingTimeout(callId);
    call.state = 'cancelled';
    call.endedAt = new Date().toISOString();
    call.endReason = 'Caller cancelled the call';
    this.cleanupCall(callId);

    console.log(`[Call State Machine] Call ${callId} CANCELLED by ${call.callerName}`);
    return { success: true, call };
  }

  /**
   * Either user ends an active or connected call
   */
  public static endCall(callId: string, userId: string, reason?: string): { success: boolean; call?: CallRecord; error?: string } {
    const call = this.activeCalls.get(callId);
    if (!call) return { success: false, error: 'Call session not found' };
    if (call.callerId !== userId && call.calleeId !== userId) {
      return { success: false, error: 'Unauthorized to end this call' };
    }

    this.clearRingingTimeout(callId);
    call.state = 'ended';
    call.endedAt = new Date().toISOString();
    call.endReason = reason || 'Call ended by user';

    // Calculate duration in seconds
    const startPoint = call.connectedAt || call.acceptedAt || call.startedAt;
    const durationSec = Math.max(0, Math.floor((new Date(call.endedAt).getTime() - new Date(startPoint).getTime()) / 1000));
    call.duration = durationSec;

    this.cleanupCall(callId);
    console.log(`[Call State Machine] Call ${callId} ENDED by ${userId}. Duration: ${durationSec}s`);
    return { success: true, call };
  }

  /**
   * Handle socket disconnect during call with 10s grace period for reconnect
   */
  public static handleDisconnectGracePeriod(userId: string, onDisconnectTimeout: (call: CallRecord) => void) {
    const callId = this.userCallMap.get(userId);
    if (!callId) return;

    const call = this.activeCalls.get(callId);
    if (!call || call.state === 'ended' || call.state === 'declined' || call.state === 'cancelled') return;

    console.log(`[Call State Machine] User ${userId} disconnected mid-call ${callId}. Starting 10s grace period...`);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(userId);
      const activeCall = this.activeCalls.get(callId);
      if (activeCall && (activeCall.state === 'calling' || activeCall.state === 'accepted' || activeCall.state === 'connected')) {
        activeCall.state = 'ended';
        activeCall.endedAt = new Date().toISOString();
        activeCall.endReason = `Call ended due to connection loss (user ${userId})`;
        const startPoint = activeCall.connectedAt || activeCall.startedAt;
        activeCall.duration = Math.max(0, Math.floor((new Date().getTime() - new Date(startPoint).getTime()) / 1000));
        this.cleanupCall(callId);
        console.log(`[Call State Machine] Grace period expired for call ${callId}. Terminated.`);
        onDisconnectTimeout(activeCall);
      }
    }, config.disconnectGracePeriodMs);

    this.disconnectTimers.set(userId, timer);
  }

  /**
   * Cancel disconnect timer if user reconnects within 10s
   */
  public static cancelDisconnectGracePeriod(userId: string) {
    const timer = this.disconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(userId);
      console.log(`[Call State Machine] User ${userId} reconnected within grace period. Call resumed.`);
    }
  }

  /**
   * Remove from active index and push into history
   */
  private static cleanupCall(callId: string) {
    const call = this.activeCalls.get(callId);
    if (call) {
      this.userCallMap.delete(call.callerId);
      this.userCallMap.delete(call.calleeId);
      this.callHistory.unshift({ ...call });
      if (this.callHistory.length > 500) this.callHistory.pop();
      this.activeCalls.delete(callId);
    }
  }

  public static getActiveCallForUser(userId: string): CallRecord | null {
    const callId = this.userCallMap.get(userId);
    return callId ? (this.activeCalls.get(callId) || null) : null;
  }

  public static getCall(callId: string): CallRecord | null {
    return this.activeCalls.get(callId) || null;
  }

  public static getHistoryForUser(userId: string): CallRecord[] {
    return this.callHistory.filter(c => c.callerId === userId || c.calleeId === userId);
  }
}
