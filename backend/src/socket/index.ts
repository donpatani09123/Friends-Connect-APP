import { Server as SocketIOServer, Socket } from 'socket.io';
import { MatchmakingService } from '../services/matchmaking.service';
import { DataStore } from '../database/store';
import { CallMode } from '../shared/types';

export function setupSocketGateway(io: SocketIOServer) {
  const socketToUser = new Map<string, string>();
  const userToSocket = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Register User Online Presence
    socket.on('register_presence', (data: { userId: string }) => {
      if (data?.userId) {
        socketToUser.set(socket.id, data.userId);
        userToSocket.set(data.userId, socket.id);
        DataStore.onlineUsers.add(data.userId);
        io.emit('presence_update', { onlineCount: DataStore.onlineUsers.size });
        console.log(`[Presence] User ${data.userId} is ONLINE. Total: ${DataStore.onlineUsers.size}`);
      }
    });

    // Celebrity starts or stops Random Fan Video Connect hour
    socket.on('celebrity_fan_connect_toggle', (data: { celebUserId: string; active: boolean }) => {
      MatchmakingService.setCelebrityHostActive(data.celebUserId, socket.id, data.active);
      io.emit('celebrity_fan_connect_status', { celebUserId: data.celebUserId, isLive: data.active });
    });

    // -------------------------------------------------------------
    // Random Matchmaking Engine (Audio & Video)
    // -------------------------------------------------------------
    socket.on('find_random_match', (data: { userId: string; mode?: CallMode; isCelebrityPool?: boolean }) => {
      const userId = data?.userId || socketToUser.get(socket.id);
      if (!userId) {
        socket.emit('error', { message: 'User ID is required to match' });
        return;
      }

      const mode = data.mode || CallMode.AUDIO;
      const isCelebrityPool = data.isCelebrityPool || false;

      console.log(`[Matchmaking] User ${userId} requested [${mode}] match (CelebPool: ${isCelebrityPool})...`);
      const { matched, matchResult } = MatchmakingService.enqueueUser(userId, socket.id, mode, isCelebrityPool);

      if (matched && matchResult) {
        const { userA, userB, roomId, isCelebMatch } = matchResult;
        console.log(`[Matchmaking] MATCH FOUND (${mode})! Pairing User ${userA.userId} with User ${userB.userId} in room ${roomId}`);

        const socketA = io.sockets.sockets.get(userA.socketId);
        const socketB = io.sockets.sockets.get(userB.socketId);

        if (socketA) socketA.join(roomId);
        if (socketB) socketB.join(roomId);

        // Notify User A
        const payloadA = MatchmakingService.buildMatchPayload(userB.userId, roomId, mode, 'caller', false);
        io.to(userA.socketId).emit('match_found', payloadA);

        // Notify User B
        const payloadB = MatchmakingService.buildMatchPayload(userA.userId, roomId, mode, 'receiver', isCelebMatch);
        io.to(userB.socketId).emit('match_found', payloadB);
      } else {
        socket.emit('match_waiting', { 
          message: mode === CallMode.VIDEO ? 'Searching for online video friends...' : 'Searching for online audio friends...', 
          queueSize: MatchmakingService.getQueueSize(mode),
          mode
        });
      }
    });

    socket.on('cancel_matchmaking', (data: { userId: string }) => {
      const userId = data?.userId || socketToUser.get(socket.id);
      if (userId) {
        MatchmakingService.dequeueUser(userId);
        socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
      }
    });

    // -------------------------------------------------------------
    // WebRTC Signaling Relay (Full-Duplex Audio & Video)
    // -------------------------------------------------------------
    socket.on('join_room', (data: { roomId: string }) => {
      socket.join(data.roomId);
      socket.to(data.roomId).emit('peer_joined', { peerSocketId: socket.id });
    });

    socket.on('webrtc_offer', (data: { roomId: string; sdp: any }) => {
      socket.to(data.roomId).emit('webrtc_offer', {
        sdp: data.sdp,
        senderSocketId: socket.id
      });
    });

    socket.on('webrtc_answer', (data: { roomId: string; sdp: any }) => {
      socket.to(data.roomId).emit('webrtc_answer', {
        sdp: data.sdp,
        senderSocketId: socket.id
      });
    });

    socket.on('webrtc_ice_candidate', (data: { roomId: string; candidate: any }) => {
      socket.to(data.roomId).emit('webrtc_ice_candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id
      });
    });

    // Video-specific camera and moderation events
    socket.on('video_track_muted', (data: { roomId: string; isVideoMuted: boolean }) => {
      socket.to(data.roomId).emit('peer_video_muted', { isVideoMuted: data.isVideoMuted });
    });

    socket.on('report_and_blur', (data: { roomId: string; reportedUserId: string; reason: string }) => {
      console.log(`[Safety Alert] User reported in room ${data.roomId}: ${data.reportedUserId}. Reason: ${data.reason}`);
      socket.to(data.roomId).emit('call_ended', { message: 'Call terminated due to safety policy' });
      socket.leave(data.roomId);
    });

    socket.on('hangup_call', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('call_ended', { message: 'Peer ended the call' });
      socket.leave(data.roomId);
    });

    // -------------------------------------------------------------
    // Disconnection & Cleanup
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        DataStore.onlineUsers.delete(userId);
        MatchmakingService.dequeueUser(userId);
        userToSocket.delete(userId);
        socketToUser.delete(socket.id);
        io.emit('presence_update', { onlineCount: DataStore.onlineUsers.size });
        console.log(`[Socket] User ${userId} disconnected.`);
      }
    });
  });
}
