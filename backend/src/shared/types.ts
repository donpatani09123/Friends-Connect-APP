// Core User Roles
export enum UserRole {
  NORMAL = 'NORMAL',
  CELEBRITY = 'CELEBRITY',
  ORGANIZATION = 'ORGANIZATION',
  SUPPORT = 'SUPPORT',
  SUPERADMIN = 'SUPERADMIN'
}

// Subscription & Account Tier
export enum AccountTier {
  FREE = 'FREE',
  PREMIUM_VIP = 'PREMIUM_VIP'
}

// Connection & Matching Mode
export enum CallMode {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

// WebRTC & Call Types
export enum CallType {
  RANDOM_AUDIO = 'RANDOM_AUDIO',
  RANDOM_VIDEO = 'RANDOM_VIDEO',
  CELEB_AUDIO = 'CELEB_AUDIO',
  CELEB_VIDEO = 'CELEB_VIDEO',
  CELEB_RANDOM_FAN_VIDEO = 'CELEB_RANDOM_FAN_VIDEO',
  SUPPORT_CALL = 'SUPPORT_CALL'
}

export enum CallStatus {
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  REJECTED = 'REJECTED',
  BUSY = 'BUSY'
}

// Industry-Standard WebRTC Call State Machine
export type CallStateType =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'accepted'
  | 'connected'
  | 'ended'
  | 'declined'
  | 'cancelled'
  | 'missed'
  | 'busy'
  | 'failed';

export enum CallState {
  IDLE = 'idle',
  CALLING = 'calling',
  RINGING = 'ringing',
  ACCEPTED = 'accepted',
  CONNECTED = 'connected',
  ENDED = 'ended',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
  BUSY = 'busy',
  FAILED = 'failed'
}

export interface CallRecord {
  callId: string;
  callerId: string;
  callerName: string;
  callerPhone?: string;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  calleePhone?: string;
  calleeAvatar?: string;
  type: 'video' | 'audio';
  state: CallStateType;
  roomId: string;
  startedAt: string;
  acceptedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  duration: number; // in seconds
  endReason?: string;
}

// Event Status & Category
export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

// Media Post Types
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

// Domain Entities
export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  tier: AccountTier;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  callAvailable?: boolean;
  interests?: string[];
  randomFanConnectActive?: boolean; // For celebrities
}

export interface Organization {
  id: string;
  ownerUserId: string;
  name: string;
  businessRegistrationNumber?: string;
  website?: string;
  isApproved: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface EventItem {
  id: string;
  orgId: string;
  orgName?: string;
  title: string;
  description: string;
  category: string;
  location: GeoLocation;
  venueName: string;
  address: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  bookedSeats: number;
  ticketPrice: number; // 0 for free
  coverImageUrl?: string;
  status: EventStatus;
  distanceKm?: number;
}

export interface EventBooking {
  id: string;
  eventId: string;
  userId: string;
  bookingCode: string;
  numberOfTickets: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
}

export interface CelebrityPost {
  id: string;
  celebUserId: string;
  celebName: string;
  celebAvatar?: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CallSession {
  id: string;
  callType: CallType;
  mode: CallMode;
  callerId: string;
  callerName?: string;
  receiverId?: string;
  receiverName?: string;
  roomId: string;
  rtcToken?: string;
  status: CallStatus;
  durationSeconds?: number;
  startedAt: string;
  endedAt?: string;
}

// Matchmaking WebSocket Events
export interface MatchRequestPayload {
  userId: string;
  mode: CallMode;
  isCelebrityPool?: boolean;
  genderPreference?: 'ANY' | 'MALE' | 'FEMALE';
  language?: string;
}

export interface MatchFoundPayload {
  roomId: string;
  mode: CallMode;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  isCelebrity?: boolean;
  rtcToken: string;
  role: 'caller' | 'receiver';
}

// API DTOs
export interface RequestOtpDto {
  phoneNumber: string;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  code: string;
  role?: UserRole;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
  profile?: UserProfile;
}
