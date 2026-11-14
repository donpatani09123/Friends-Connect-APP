import assert from 'assert';
import { AuthService } from '../services/auth.service';
import { EventsService } from '../services/events.service';
import { CelebrityService } from '../services/celebrity.service';
import { MatchmakingService } from '../services/matchmaking.service';
import { SupportService } from '../services/support.service';
import { AdminService } from '../services/admin.service';
import { UserRole, AccountTier, EventStatus, MediaType, CallMode } from '../shared/types';
import { DataStore } from '../database/store';

async function runTests() {
  console.log('🧪 Starting Automated Unit Test Suite for Friends App Ecosystem (With Random Video)... \n');

  // Test 1: OTP Generation & Verification
  console.log('▶ Test 1: Phone Number & OTP Verification Workflow');
  const testPhone = '+19876543299';
  const otpResponse = AuthService.requestOtp(testPhone);
  assert.ok(otpResponse.devOtp, 'Dev OTP should be generated');
  assert.strictEqual(otpResponse.devOtp.length, 6, 'OTP must be 6 digits');

  const authResult = AuthService.verifyOtp(testPhone, otpResponse.devOtp, UserRole.NORMAL);
  assert.ok(authResult.accessToken, 'Access token must be returned');
  assert.strictEqual(authResult.user.phoneNumber, testPhone);
  assert.strictEqual(authResult.user.tier, AccountTier.FREE, 'Normal user starts on FREE tier');
  console.log('  ✔ OTP requested and verified successfully.');

  // Test 2: Geo-Location Event Calculations (Haversine)
  console.log('\n▶ Test 2: Geo-Location Distance & Proximity Event Filtering');
  const sfDowntown = { latitude: 37.7749, longitude: -122.4194 };
  const oakland = { latitude: 37.8044, longitude: -122.2712 };
  const distance = EventsService.calculateDistanceKm(sfDowntown, oakland);
  console.log(`  Distance SF -> Oakland calculated: ${distance} km`);
  assert.ok(distance > 10 && distance < 20, 'Distance SF to Oakland should be ~13-15km');

  const nearbyEvents = EventsService.getNearbyEvents(sfDowntown.latitude, sfDowntown.longitude, 25);
  assert.ok(nearbyEvents.length >= 2, 'Should find seeded SF events within 25km');
  console.log(`  ✔ Found ${nearbyEvents.length} nearby events within 25km radius sorted by proximity.`);

  // Test 3: Event Ticket Booking
  console.log('\n▶ Test 3: Event Ticket Booking');
  const eventToBook = nearbyEvents[0];
  const initialBooked = eventToBook.bookedSeats;
  const booking = EventsService.bookEvent(eventToBook.id, authResult.user.id, 2);
  assert.strictEqual(booking.numberOfTickets, 2);
  assert.ok(booking.bookingCode.startsWith('PASS-'));
  const updatedEvent = DataStore.events.get(eventToBook.id);
  assert.strictEqual(updatedEvent?.bookedSeats, initialBooked + 2);
  console.log(`  ✔ Successfully booked 2 tickets. Booking Code: ${booking.bookingCode}`);

  // Test 4: Celebrity Paid Content & Call Gating (Paywall Enforcement)
  console.log('\n▶ Test 4: Celebrity Calling Paywall & Tier Enforcement');
  const celebId = 'celeb-001';
  // Normal Free user tries to call celebrity
  const freeUserAccess = CelebrityService.verifyCelebrityAccess(authResult.user.id, celebId);
  assert.strictEqual(freeUserAccess.allowed, false, 'Free user must be rejected from calling celebrity');
  console.log(`  ✔ Paywall correctly blocked free user`);

  // Upgrade user to Premium VIP
  AdminService.updateUserTier(authResult.user.id, AccountTier.PREMIUM_VIP);
  const vipUserAccess = CelebrityService.verifyCelebrityAccess(authResult.user.id, celebId);
  assert.strictEqual(vipUserAccess.allowed, true, 'Premium VIP user must be allowed to call celebrity');
  console.log('  ✔ VIP User permitted to initiate audio/video call with celebrity.');

  // Test 5: Random Audio vs Random Video Matchmaking Separation
  console.log('\n▶ Test 5: Random Audio vs Random Video Matchmaking Pool Separation');
  const audioUser = 'sim-audio-user';
  const videoUser1 = 'sim-video-user-1';
  const videoUser2 = 'sim-video-user-2';

  // 1. Audio user joins queue
  const audioMatch = MatchmakingService.enqueueUser(audioUser, 'sock-audio', CallMode.AUDIO);
  assert.strictEqual(audioMatch.matched, false);

  // 2. Video user joins queue -> MUST NOT match audio user!
  const videoMatch1 = MatchmakingService.enqueueUser(videoUser1, 'sock-video-1', CallMode.VIDEO);
  assert.strictEqual(videoMatch1.matched, false, 'Video user must not match audio user');

  // 3. Second video user joins queue -> MUST match first video user!
  const videoMatch2 = MatchmakingService.enqueueUser(videoUser2, 'sock-video-2', CallMode.VIDEO);
  assert.strictEqual(videoMatch2.matched, true, 'Second video user must match first video user');
  assert.ok(videoMatch2.matchResult?.roomId.startsWith('room_random_video_'));
  console.log(`  ✔ Random Video match successfully established in: ${videoMatch2.matchResult?.roomId}`);

  // Test 6: Celebrity Random Fan Video Connect Pool
  console.log('\n▶ Test 6: Celebrity Random Fan Video Connect Pool');
  // Celebrity registers live for fan connect
  MatchmakingService.setCelebrityHostActive(celebId, 'sock-celeb', true);

  // VIP user requests celebrity pool match
  const celebFanMatch = MatchmakingService.enqueueUser(authResult.user.id, 'sock-fan', CallMode.VIDEO, true);
  assert.strictEqual(celebFanMatch.matched, true, 'VIP fan should match with live celebrity');
  assert.ok(celebFanMatch.matchResult?.roomId.startsWith('room_celeb_random_'));
  assert.strictEqual(celebFanMatch.matchResult?.isCelebMatch, true);
  console.log(`  ✔ VIP fan successfully matched with celebrity in: ${celebFanMatch.matchResult?.roomId}`);

  // Test 7: Customer Care Support Desk Assignment
  console.log('\n▶ Test 7: Customer Care Support Desk Assignment');
  const supportConn = SupportService.connectToSupport(authResult.user.id);
  assert.ok(supportConn.session, 'Support call session should be created');
  assert.strictEqual(supportConn.assignedAgentId, 'support-001');
  console.log(`  ✔ User connected to Customer Support Agent: ${supportConn.assignedAgentId}`);
  // Terminate support call to free up user
  const { CallsService: CS } = await import('../services/calls.service');
  CS.endCall((supportConn.session as any).callId, authResult.user.id);

  // Test 8: SuperAdmin Platform Metrics & User Blocking
  console.log('\n▶ Test 8: SuperAdmin Controls & Platform Metrics');
  const metrics = AdminService.getPlatformMetrics();
  assert.ok(metrics.totalUsers >= 5, 'Total users count is accurate');

  // Block a user
  AdminService.setUserBlockStatus(authResult.user.id, true, 'Violation during random video');
  const blockedUser = DataStore.users.get(authResult.user.id);
  assert.strictEqual(blockedUser?.isBlocked, true, 'User must be marked blocked');
  console.log(`  ✔ SuperAdmin blocked abusive user. Total users: ${metrics.totalUsers}`);

  // Test 9: One-to-One WebRTC Call State Machine
  console.log('\n▶ Test 9: One-to-One WebRTC Call State Machine (Initiate, Accept, Decline, Cancel)');
  const { CallsService } = await import('../services/calls.service');
  
  // Unblock user for calling test
  AdminService.setUserBlockStatus(authResult.user.id, false);
  DataStore.onlineUsers.add('celeb-001');
  DataStore.onlineUsers.add(authResult.user.id);

  // 1. Initiate 1-on-1 call with celebrity
  const callInit = CallsService.initiateCall({
    callerId: authResult.user.id,
    calleeId: 'celeb-001',
    type: 'video'
  });
  assert.strictEqual(callInit.success, true, 'Call initiation should succeed for VIP user');
  assert.ok(callInit.call);
  assert.strictEqual(callInit.call.state, 'calling');
  console.log(`  ✔ Call initiated in 'calling' state with callId: ${callInit.call.callId}`);

  // 2. Accept call by callee
  const acceptRes = CallsService.acceptCall(callInit.call.callId, 'celeb-001');
  assert.strictEqual(acceptRes.success, true);
  assert.strictEqual(acceptRes.call?.state, 'accepted');
  console.log(`  ✔ Call accepted: transitioned to 'accepted' state`);

  // 3. Mark connected (WebRTC answer exchanged)
  const connectedCall = CallsService.markConnected(callInit.call.callId);
  assert.strictEqual(connectedCall?.state, 'connected');
  console.log(`  ✔ WebRTC answer received: transitioned to 'connected' state`);

  // 4. End call
  const endRes = CallsService.endCall(callInit.call.callId, 'celeb-001', 'Normal hangup');
  assert.strictEqual(endRes.success, true);
  assert.strictEqual(endRes.call?.state, 'ended');
  console.log(`  ✔ Call ended: state 'ended' with duration ${endRes.call?.duration}s`);

  // 5. Test Decline flow
  const callInit2 = CallsService.initiateCall({
    callerId: authResult.user.id,
    calleeId: 'celeb-001',
    type: 'video'
  });
  assert.ok(callInit2.call);
  const declineRes = CallsService.declineCall(callInit2.call.callId, 'celeb-001');
  assert.strictEqual(declineRes.success, true);
  assert.strictEqual(declineRes.call?.state, 'declined');
  console.log(`  ✔ Callee decline flow: caller notified of 'declined' state`);

  // 6. Test ICE servers
  const iceServers = CallsService.getIceServers();
  assert.ok(Array.isArray(iceServers) && iceServers.length >= 2, 'STUN + TURN servers must be configured');
  console.log(`  ✔ ICE servers verified (${iceServers.length} servers configured including TURN)`);

  console.log('\n🎉 ALL 9 TEST SUITES (INCLUDING 1-TO-1 WEBRTC CALL STATE MACHINE) PASSED FLAWLESSLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
