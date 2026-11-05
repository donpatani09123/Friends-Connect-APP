import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { CelebrityPost, MediaType, UserRole, AccountTier } from '../shared/types';

export class CelebrityService {
  /**
   * Celebrity posts photo or video
   */
  public static createPost(
    celebUserId: string,
    mediaType: MediaType,
    mediaUrl: string,
    caption: string,
    thumbnailUrl?: string
  ): CelebrityPost {
    const celebUser = DataStore.users.get(celebUserId);
    if (!celebUser || celebUser.role !== UserRole.CELEBRITY) {
      throw new Error('Only verified celebrity accounts can publish posts to this feed');
    }

    const celebProfile = DataStore.profiles.get(celebUserId);

    const post: CelebrityPost = {
      id: `post-${uuidv4().substring(0, 8)}`,
      celebUserId,
      celebName: celebProfile?.fullName || 'Verified Celebrity',
      celebAvatar: celebProfile?.avatarUrl,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      caption,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };

    DataStore.posts.set(post.id, post);
    return post;
  }

  /**
   * Get public feed of celebrity media
   */
  public static getFeed(): CelebrityPost[] {
    return Array.from(DataStore.posts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Gatekeeper Check:
   * Verifies if caller is authorized to message, audio call, or video call a celebrity.
   * Requires AccountTier.PREMIUM_VIP.
   */
  public static verifyCelebrityAccess(callerUserId: string, celebUserId: string): { allowed: boolean; reason?: string } {
    const caller = DataStore.users.get(callerUserId);
    if (!caller) {
      return { allowed: false, reason: 'Caller account not found' };
    }

    const celeb = DataStore.users.get(celebUserId);
    if (!celeb || celeb.role !== UserRole.CELEBRITY) {
      return { allowed: false, reason: 'Target user is not a celebrity account' };
    }

    const celebProfile = DataStore.profiles.get(celebUserId);
    if (!celebProfile?.callAvailable) {
      return { allowed: false, reason: 'Celebrity is currently unavailable or in Do Not Disturb mode' };
    }

    // Enforce Premium Account Requirement
    if (caller.tier !== AccountTier.PREMIUM_VIP) {
      return {
        allowed: false,
        reason: 'Celebrity direct audio/video calling is an exclusive VIP feature. Please upgrade to a Premium Subscription or purchase Call Credits to unlock direct access.'
      };
    }

    return { allowed: true };
  }
}
