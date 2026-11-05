import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { MatchFoundPayload, CallMode, UserRole, AccountTier } from '../shared/types';

interface QueuedUser {
  userId: string;
  socketId: string;
  mode: CallMode;
  isCelebrityPool?: boolean;
  joinedAt: number;
}

export class MatchmakingService {
  private static waitingQueueAudio: QueuedUser[] = [];
  private static waitingQueueVideo: QueuedUser[] = [];
  private static activeCelebFanHosts: Map<string, string> = new Map(); // celebUserId -> socketId

  /**
   * Celebrity can register as an active host for random video fan connect
   */
  public static setCelebrityHostActive(celebUserId: string, socketId: string, active: boolean) {
    if (active) {
      this.activeCelebFanHosts.set(celebUserId, socketId);
      console.log(`[Celebrity Video] Celebrity ${celebUserId} is now LIVE for Random Fan Video Connect!`);
    } else {
      this.activeCelebFanHosts.delete(celebUserId);
      console.log(`[Celebrity Video] Celebrity ${celebUserId} stopped Random Fan Connect.`);
    }
  }

  public static enqueueUser(
    userId: string,
    socketId: string,
    mode: CallMode = CallMode.AUDIO,
    isCelebrityPool: boolean = false
  ): { matched: boolean; matchResult?: { userA: QueuedUser; userB: QueuedUser; roomId: string; isCelebMatch?: boolean } } {
    // Prevent duplicate entries across queues
    this.dequeueUser(userId);

    // 1. If user is a VIP requesting Celebrity Fan Connect Pool
    if (isCelebrityPool && mode === CallMode.VIDEO) {
      const caller = DataStore.users.get(userId);
      if (caller?.tier === AccountTier.PREMIUM_VIP && this.activeCelebFanHosts.size > 0) {
        // Pick first available online celebrity host
        const [celebUserId, celebSocketId] = Array.from(this.activeCelebFanHosts.entries())[0];
        const celebQueued: QueuedUser = { userId: celebUserId, socketId: celebSocketId, mode: CallMode.VIDEO, joinedAt: Date.now() };
        const currentUser: QueuedUser = { userId, socketId, mode: CallMode.VIDEO, isCelebrityPool: true, joinedAt: Date.now() };
        const roomId = `room_celeb_random_${uuidv4()}`;

        return {
          matched: true,
          matchResult: {
            userA: celebQueued,
            userB: currentUser,
            roomId,
            isCelebMatch: true
          }
        };
      }
    }

    // 2. Standard Random Match (Audio or Video)
    const queue = mode === CallMode.VIDEO ? this.waitingQueueVideo : this.waitingQueueAudio;
    const peerIndex = queue.findIndex(q => q.userId !== userId);

    if (peerIndex !== -1) {
      const peer = queue.splice(peerIndex, 1)[0];
      const currentUser: QueuedUser = { userId, socketId, mode, joinedAt: Date.now() };
      const roomId = `room_random_${mode.toLowerCase()}_${uuidv4()}`;

      return {
        matched: true,
        matchResult: {
          userA: peer,
          userB: currentUser,
          roomId,
          isCelebMatch: false
        }
      };
    }

    // No peer available yet, add to appropriate queue
    queue.push({ userId, socketId, mode, isCelebrityPool, joinedAt: Date.now() });
    return { matched: false };
  }

  public static dequeueUser(userId: string): void {
    this.waitingQueueAudio = this.waitingQueueAudio.filter(q => q.userId !== userId);
    this.waitingQueueVideo = this.waitingQueueVideo.filter(q => q.userId !== userId);
    this.activeCelebFanHosts.delete(userId);
  }

  public static getQueueSize(mode: CallMode): number {
    return mode === CallMode.VIDEO ? this.waitingQueueVideo.length : this.waitingQueueAudio.length;
  }

  public static buildMatchPayload(peerId: string, roomId: string, mode: CallMode, role: 'caller' | 'receiver', isCelebrity: boolean = false): MatchFoundPayload {
    const profile = DataStore.profiles.get(peerId) || {
      userId: peerId,
      fullName: isCelebrity ? 'Verified Celebrity' : 'Random Friend'
    };

    return {
      roomId,
      mode,
      peerId,
      peerName: profile.fullName,
      peerAvatar: profile.avatarUrl,
      isCelebrity,
      rtcToken: `token_${mode.toLowerCase()}_${uuidv4()}`,
      role
    };
  }
}
