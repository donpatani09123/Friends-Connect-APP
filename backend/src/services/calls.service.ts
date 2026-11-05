import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { CallSession, CallStatus, CallType, CallMode, UserRole } from '../shared/types';
import { CelebrityService } from './celebrity.service';

export class CallsService {
  /**
   * Initiates a 1-on-1 direct call (Celebrity, Support, or Direct Friend)
   */
  public static initiateCall(callerId: string, receiverId: string, callType: CallType, mode?: CallMode): CallSession {
    const caller = DataStore.users.get(callerId);
    const receiver = DataStore.users.get(receiverId);

    if (!caller || !receiver) {
      throw new Error('Caller or receiver does not exist');
    }

    // Gatekeeper enforcement for celebrity calls
    if (callType === CallType.CELEB_AUDIO || callType === CallType.CELEB_VIDEO || callType === CallType.CELEB_RANDOM_FAN_VIDEO) {
      const access = CelebrityService.verifyCelebrityAccess(callerId, receiverId);
      if (!access.allowed) {
        throw new Error(access.reason);
      }
    }

    const callerProfile = DataStore.profiles.get(callerId);
    const receiverProfile = DataStore.profiles.get(receiverId);
    const roomId = `call_${uuidv4()}`;

    const effectiveMode = mode || (
      callType === CallType.CELEB_VIDEO || callType === CallType.RANDOM_VIDEO || callType === CallType.CELEB_RANDOM_FAN_VIDEO
        ? CallMode.VIDEO
        : CallMode.AUDIO
    );

    const session: CallSession = {
      id: `session-${uuidv4().substring(0, 8)}`,
      callType,
      mode: effectiveMode,
      callerId,
      callerName: callerProfile?.fullName || 'User',
      receiverId,
      receiverName: receiverProfile?.fullName || 'User',
      roomId,
      rtcToken: `rtc_token_${effectiveMode.toLowerCase()}_${uuidv4()}`,
      status: CallStatus.RINGING,
      startedAt: new Date().toISOString()
    };

    DataStore.calls.set(session.id, session);
    return session;
  }

  /**
   * Accepts an incoming call
   */
  public static acceptCall(sessionId: string): CallSession {
    const session = DataStore.calls.get(sessionId);
    if (!session) throw new Error('Call session not found');

    session.status = CallStatus.CONNECTED;
    return session;
  }

  /**
   * Terminates an active call and records duration
   */
  public static endCall(sessionId: string): CallSession {
    const session = DataStore.calls.get(sessionId);
    if (!session) throw new Error('Call session not found');

    session.status = CallStatus.ENDED;
    session.endedAt = new Date().toISOString();
    const duration = Math.floor(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    );
    session.durationSeconds = duration;
    return session;
  }

  /**
   * Retrieves call history for a user
   */
  public static getUserCallHistory(userId: string): CallSession[] {
    return Array.from(DataStore.calls.values())
      .filter(c => c.callerId === userId || c.receiverId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
}
