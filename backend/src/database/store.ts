import { 
  User, 
  UserProfile, 
  UserRole, 
  AccountTier, 
  EventItem, 
  EventStatus, 
  EventBooking, 
  CelebrityPost, 
  MediaType, 
  CallSession, 
  CallStatus, 
  CallType 
} from '../shared/types';

export interface OtpRecord {
  code: string;
  expiresAt: number;
}

export class DataStore {
  public static users: Map<string, User> = new Map();
  public static profiles: Map<string, UserProfile> = new Map();
  public static otps: Map<string, OtpRecord> = new Map();
  public static events: Map<string, EventItem> = new Map();
  public static bookings: Map<string, EventBooking> = new Map();
  public static posts: Map<string, CelebrityPost> = new Map();
  public static calls: Map<string, CallSession> = new Map();
  public static onlineUsers: Set<string> = new Set();
  public static supportAgents: Set<string> = new Set();

  public static seed() {
    // 1. Seed SuperAdmin
    const adminId = 'admin-001';
    this.users.set(adminId, {
      id: adminId,
      phoneNumber: '+10000000000',
      role: UserRole.SUPERADMIN,
      tier: AccountTier.PREMIUM_VIP,
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(adminId, {
      userId: adminId,
      fullName: 'Super Administrator',
      bio: 'Platform Root Admin',
      callAvailable: false
    });

    // 2. Seed Customer Support Agent
    const supportId = 'support-001';
    this.users.set(supportId, {
      id: supportId,
      phoneNumber: '+10000000001',
      role: UserRole.SUPPORT,
      tier: AccountTier.PREMIUM_VIP,
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(supportId, {
      userId: supportId,
      fullName: 'Customer Care Desk - Sarah',
      bio: '24/7 Platform Assistance',
      callAvailable: true
    });
    this.supportAgents.add(supportId);

    // 3. Seed Celebrity User
    const celebId = 'celeb-001';
    this.users.set(celebId, {
      id: celebId,
      phoneNumber: '+10000000002',
      role: UserRole.CELEBRITY,
      tier: AccountTier.PREMIUM_VIP,
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(celebId, {
      userId: celebId,
      fullName: 'Elena Rostova (Singer & Artist)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      bio: 'Singer, Songwriter & Global Traveler. Connect with me on VIP call!',
      callAvailable: true,
      interests: ['Music', 'Concerts', 'Art']
    });
    // Add celebrity media posts
    this.posts.set('post-001', {
      id: 'post-001',
      celebUserId: celebId,
      celebName: 'Elena Rostova',
      celebAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      mediaType: MediaType.IMAGE,
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000',
      caption: 'Backstage vibes right before tonight’s acoustic performance! 🎸✨',
      likesCount: 12480,
      commentsCount: 432,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    });
    this.posts.set('post-002', {
      id: 'post-002',
      celebUserId: celebId,
      celebName: 'Elena Rostova',
      celebAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      mediaType: MediaType.VIDEO,
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000',
      caption: 'Sneak preview of our brand new music video release! 🎥🔥',
      likesCount: 28900,
      commentsCount: 914,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    });

    // 4. Seed Organization User
    const orgUserId = 'org-001';
    this.users.set(orgUserId, {
      id: orgUserId,
      phoneNumber: '+10000000003',
      role: UserRole.ORGANIZATION,
      tier: AccountTier.PREMIUM_VIP,
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(orgUserId, {
      userId: orgUserId,
      fullName: 'RedBull Events & Productions',
      avatarUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
      bio: 'Hosting top-tier electronic music and lifestyle events worldwide.',
      callAvailable: false
    });

    // Seed Events hosted by Organization (e.g. San Francisco & New York coordinates)
    this.events.set('event-001', {
      id: 'event-001',
      orgId: orgUserId,
      orgName: 'RedBull Events & Productions',
      title: 'Neon Nights: Electronic Music Fest 2026',
      description: 'Experience 12 hours of non-stop electronic synthwave, food trucks, and light installations.',
      category: 'Music & Concerts',
      location: { latitude: 37.7749, longitude: -122.4194 }, // SF coordinates
      venueName: 'The Midway SF',
      address: '900 Marin St, San Francisco, CA',
      startTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 5 + 3600000 * 8).toISOString(),
      totalCapacity: 500,
      bookedSeats: 142,
      ticketPrice: 35.0,
      coverImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000',
      status: EventStatus.PUBLISHED
    });

    this.events.set('event-002', {
      id: 'event-002',
      orgId: orgUserId,
      orgName: 'RedBull Events & Productions',
      title: 'Tech & Friends Networking Mixer',
      description: 'Casual networking evening for founders, mobile developers, and creators with complimentary drinks.',
      category: 'Networking',
      location: { latitude: 37.7833, longitude: -122.4167 }, // Near downtown SF
      venueName: 'Salesforce Park Rooftop',
      address: '425 Mission St, San Francisco, CA',
      startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 3).toISOString(),
      totalCapacity: 150,
      bookedSeats: 89,
      ticketPrice: 0.0, // Free event
      coverImageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000',
      status: EventStatus.PUBLISHED
    });

    // 5. Seed Normal Users
    const normalUser1 = 'user-001';
    this.users.set(normalUser1, {
      id: normalUser1,
      phoneNumber: '+19876543210',
      role: UserRole.NORMAL,
      tier: AccountTier.FREE,
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(normalUser1, {
      userId: normalUser1,
      fullName: 'Alex River',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      bio: 'Enthusiastic photographer and traveler looking to meet cool friends.',
      latitude: 37.7749,
      longitude: -122.4194,
      callAvailable: true,
      interests: ['Photography', 'Music', 'Hiking']
    });

    const normalUser2 = 'user-002';
    this.users.set(normalUser2, {
      id: normalUser2,
      phoneNumber: '+19876543211',
      role: UserRole.NORMAL,
      tier: AccountTier.PREMIUM_VIP, // Has VIP subscription
      isVerified: true,
      isBlocked: false,
      createdAt: new Date().toISOString()
    });
    this.profiles.set(normalUser2, {
      userId: normalUser2,
      fullName: 'Maya Lin',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      bio: 'Design nerd and festival lover. VIP member!',
      latitude: 37.7755,
      longitude: -122.4180,
      callAvailable: true,
      interests: ['Design', 'Art', 'Festivals']
    });
  }
}

// Seed on startup
DataStore.seed();
