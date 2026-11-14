import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EventsService } from '../services/events.service';
import { CelebrityService } from '../services/celebrity.service';
import { CallsService } from '../services/calls.service';
import { SupportService } from '../services/support.service';
import { AdminService } from '../services/admin.service';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UserRole, AccountTier } from '../shared/types';
import { DataStore } from '../database/store';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & OTP
// ==========================================
apiRouter.post('/auth/otp/request', (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }
    const result = AuthService.requestOtp(phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/otp/verify', (req: Request, res: Response) => {
  try {
    const { phoneNumber, code, role } = req.body;
    if (!phoneNumber || !code) {
      res.status(400).json({ error: 'Phone number and OTP code are required' });
      return;
    }
    const result = AuthService.verifyOtp(phoneNumber, code, role);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. USER PROFILE & TIERS
// ==========================================
apiRouter.get('/users/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const profile = DataStore.profiles.get(req.user!.id);
  res.json({ user: req.user, profile });
});

apiRouter.put('/users/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const profile = DataStore.profiles.get(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  const { fullName, bio, avatarUrl, latitude, longitude, callAvailable, interests } = req.body;
  if (fullName !== undefined) profile.fullName = fullName;
  if (bio !== undefined) profile.bio = bio;
  if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
  if (latitude !== undefined) profile.latitude = latitude;
  if (longitude !== undefined) profile.longitude = longitude;
  if (callAvailable !== undefined) profile.callAvailable = callAvailable;
  if (interests !== undefined) profile.interests = interests;

  res.json({ message: 'Profile updated', profile });
});

apiRouter.post('/users/upgrade-tier', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = AdminService.updateUserTier(req.user!.id, AccountTier.PREMIUM_VIP);
    res.json({ message: 'Upgraded to Premium VIP successfully', user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. EVENTS & GEO LOCATION
// ==========================================
apiRouter.get('/events/nearby', (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50;

    const events = EventsService.getNearbyEvents(lat, lng, radiusKm);
    res.json({ count: events.length, events });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/events', authenticate, requireRole(UserRole.ORGANIZATION, UserRole.SUPERADMIN), (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = EventsService.createEvent(req.user!.id, req.body);
    res.status(201).json({ message: 'Event published successfully', event });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/events/:id/book', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = req.body.numberOfTickets ? parseInt(req.body.numberOfTickets, 10) : 1;
    const booking = EventsService.bookEvent(req.params.id, req.user!.id, tickets);
    res.status(201).json({ message: 'Tickets booked successfully', booking });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/events/my/bookings', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const bookings = EventsService.getUserBookings(req.user!.id);
  res.json({ bookings });
});

// ==========================================
// 4. CELEBRITY MEDIA & PAID CALL GATING
// ==========================================
apiRouter.get('/celebrities/feed', (req: Request, res: Response) => {
  const posts = CelebrityService.getFeed();
  res.json({ posts });
});

apiRouter.post('/celebrities/posts', authenticate, requireRole(UserRole.CELEBRITY), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mediaType, mediaUrl, caption, thumbnailUrl } = req.body;
    const post = CelebrityService.createPost(req.user!.id, mediaType, mediaUrl, caption, thumbnailUrl);
    res.status(201).json({ message: 'Post published', post });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/celebrities/:id/check-access', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const access = CelebrityService.verifyCelebrityAccess(req.user!.id, req.params.id);
  res.json(access);
});

// ==========================================
// 5. CALLS & WEBRTC SESSIONS
// ==========================================
apiRouter.get('/webrtc/ice-servers', (req: Request, res: Response) => {
  res.json({
    iceServers: CallsService.getIceServers()
  });
});

apiRouter.post('/calls/initiate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { calleeId, receiverId, type } = req.body;
    const targetId = calleeId || receiverId;
    const result = CallsService.initiateCall({
      callerId: req.user!.id,
      calleeId: targetId,
      type: type || 'video'
    });
    if (!result.success) {
      res.status(result.code === 'PREMIUM_REQUIRED' ? 403 : 400).json({ error: result.error, code: result.code });
      return;
    }
    res.status(201).json({ call: result.call, session: result.call });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

apiRouter.post('/calls/:id/accept', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const result = CallsService.acceptCall(req.params.id, req.user!.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ message: 'Call accepted', call: result.call });
});

apiRouter.post('/calls/:id/decline', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const result = CallsService.declineCall(req.params.id, req.user!.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ message: 'Call declined', call: result.call });
});

apiRouter.post('/calls/:id/end', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const result = CallsService.endCall(req.params.id, req.user!.id, req.body.reason);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ message: 'Call ended', call: result.call });
});

apiRouter.get('/calls/my/history', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const history = CallsService.getHistoryForUser(req.user!.id);
  res.json({ history });
});

// ==========================================
// 6. CUSTOMER CARE SUPPORT
// ==========================================
apiRouter.post('/support/connect', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const connection = SupportService.connectToSupport(req.user!.id);
    res.json(connection);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

apiRouter.get('/support/agents', (req: Request, res: Response) => {
  res.json({ agents: SupportService.getActiveAgents() });
});

// ==========================================
// 7. SUPER ADMIN DASHBOARD
// ==========================================
apiRouter.get('/admin/metrics', authenticate, requireRole(UserRole.SUPERADMIN), (req: AuthenticatedRequest, res: Response) => {
  res.json({ metrics: AdminService.getPlatformMetrics() });
});

apiRouter.get('/admin/users', authenticate, requireRole(UserRole.SUPERADMIN), (req: AuthenticatedRequest, res: Response) => {
  res.json({ users: AdminService.getAllUsers() });
});

apiRouter.post('/admin/users/:id/block', authenticate, requireRole(UserRole.SUPERADMIN), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isBlocked, reason } = req.body;
    const user = AdminService.setUserBlockStatus(req.params.id, isBlocked === true, reason);
    res.json({ message: `User block status set to ${isBlocked}`, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
