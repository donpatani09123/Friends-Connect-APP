import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MatchmakingService } from '../services/matchmaking.service';
import { CallsService } from '../services/calls.service';
import { DataStore } from '../database/store';
import { CallMode, CallRecord } from '../shared/types';
import { config } from '../config';

export function setupSocketGateway(io: SocketIOServer) {
  // Socket -> UserId mapping
  const socketToUser = new Map<string, string>();
  // UserId -> Set of SocketIds (supports multiple tabs / devices per user)
  const userToSockets = new Map<string, Set<string>>();

  // -------------------------------------------------------------
  // 1. JWT Authentication Middleware for Socket.IO
  // -------------------------------------------------------------
  io.use((socket: Socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const token = socket.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : socket.handshake.query?.token);

      if (token && typeof token === 'string') {
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
          socket.data.userId = decoded.userId;
          return next();
        } catch (jwtErr) {
          console.warn(`[Socket Auth] Invalid JWT token on socket ${socket.id}`);
        }
      }

      // Fallback for demo / development handshake with explicit userId or phone
      const fallbackUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
      if (fallbackUserId && typeof fallbackUserId === 'string') {
        socket.data.userId = fallbackUserId;
        return next();
      }

      // Allow connection with anonymous socket, registration handled on 'register_presence'
      next();
    } catch (err: any) {
      console.error('[Socket Auth Middleware Error]', err);
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    let currentUserId = socket.data.userId as string | undefined;

    const registerUserSession = (userId: string) => {
      currentUserId = userId;
      socket.data.userId = userId;
      socketToUser.set(socket.id, userId);

      if (!userToSockets.has(userId)) {
        userToSockets.set(userId, new Set());
      }
      userToSockets.get(userId)!.add(socket.id);

      // Join private user room "user:{userId}"
      const userRoom = `user:${userId}`;
      socket.join(userRoom);

      DataStore.onlineUsers.add(userId);
      CallsService.cancelDisconnectGracePeriod(userId);

      io.emit('presence_update', { onlineCount: DataStore.onlineUsers.size });
      console.log(`[Socket] User ${userId} joined private room ${userRoom} (Socket ${socket.id}). Online: ${DataStore.onlineUsers.size}`);

      // Check if user has an active call reconnecting
      const existingCall = CallsService.getActiveCallForUser(userId);
      if (existingCall && existingCall.state !== 'ended') {
        socket.emit('call:sync', { call: existingCall });
      }
    };

    if (currentUserId) {
      registerUserSession(currentUserId);
    }

    // Explicit presence registration
    socket.on('register_presence', (data: { userId: string; token?: string }) => {
      if (data?.token) {
        try {
          const decoded = jwt.verify(data.token, config.jwtSecret) as { userId: string };
          registerUserSession(decoded.userId);
          return;
        } catch (e) {}
      }
      if (data?.userId) {
        registerUserSession(data.userId);
      }
    });

    // -------------------------------------------------------------
    // 2. ONE-TO-ONE CALL STATE MACHINE EVENTS
    // -------------------------------------------------------------

    /**
     * EVENT: call:initiate
     * Caller initiates a 1-to-1 video/audio call
     */
    socket.on('call:initiate', (data: { calleeId: string; type: 'video' | 'audio' }) => {
      const callerId = socket.data.userId;
      if (!callerId) {
        socket.emit('call:failed', { error: 'Authentication required to initiate a call' });
        return;
      }

      console.log(`[Signaling:call:initiate] Caller ${callerId} -> Callee ${data.calleeId} (${data.type})`);
      const result = CallsService.initiateCall({
        callerId,
        calleeId: data.calleeId,
        type: data.type || 'video'
      });

      if (!result.success || !result.call) {
        if (result.code === 'BUSY') {
          socket.emit('call:busy', { calleeId: data.calleeId, message: result.error });
        } else {
          socket.emit('call:failed', { error: result.error, code: result.code });
        }
        return;
      }

      const call = result.call;

      // 1. Notify caller that call has been initiated and is ringing
      io.to(`user:${callerId}`).emit('call:ringing', {
        callId: call.callId,
        call,
        iceServers: CallsService.getIceServers()
      });

      // 2. Emit call:incoming to callee's private room
      io.to(`user:${data.calleeId}`).emit('call:incoming', {
        callId: call.callId,
        call,
        caller: {
          id: callerId,
          name: call.callerName,
          phone: call.callerPhone,
          avatar: call.callerAvatar
        },
        type: call.type,
        iceServers: CallsService.getIceServers()
      });

      // 3. Start 30s ringing timeout
      CallsService.setRingingTimeout(call.callId, (timedOutCall) => {
        io.to(`user:${timedOutCall.callerId}`).emit('call:missed', {
          callId: timedOutCall.callId,
          message: `${timedOutCall.calleeName} did not answer (30s timeout)`
        });
        io.to(`user:${timedOutCall.calleeId}`).emit('call:missed', {
          callId: timedOutCall.callId,
          message: 'Missed call from ' + timedOutCall.callerName
        });
      });
    });

    /**
     * EVENT: call:accept
     * Callee accepts the incoming call
     */
    socket.on('call:accept', (data: { callId: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      console.log(`[Signaling:call:accept] Callee ${userId} accepting call ${data.callId}`);
      const result = CallsService.acceptCall(data.callId, userId);

      if (!result.success || !result.call) {
        socket.emit('call:failed', { error: result.error || 'Failed to accept call' });
        return;
      }

      const call = result.call;

      // Both caller and callee join the dedicated call room
      const callerSockets = userToSockets.get(call.callerId);
      const calleeSockets = userToSockets.get(call.calleeId);

      callerSockets?.forEach(sid => io.sockets.sockets.get(sid)?.join(call.roomId));
      calleeSockets?.forEach(sid => io.sockets.sockets.get(sid)?.join(call.roomId));

      // Emit call:accepted to BOTH users simultaneously
      const acceptedPayload = {
        callId: call.callId,
        call,
        roomId: call.roomId,
        type: call.type,
        iceServers: CallsService.getIceServers()
      };

      io.to(`user:${call.callerId}`).emit('call:accepted', acceptedPayload);
      io.to(`user:${call.calleeId}`).emit('call:accepted', acceptedPayload);
    });

    /**
     * EVENT: call:decline
     * Callee declines the incoming call
     */
    socket.on('call:decline', (data: { callId: string; reason?: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      console.log(`[Signaling:call:decline] Callee ${userId} declining call ${data.callId}`);
      const result = CallsService.declineCall(data.callId, userId);

      if (result.success && result.call) {
        const call = result.call;
        const payload = {
          callId: call.callId,
          reason: `${call.calleeName} declined the call`,
          call
        };

        // Notify both sides so screens exit synchronously
        io.to(`user:${call.callerId}`).emit('call:declined', payload);
        io.to(`user:${call.calleeId}`).emit('call:declined', payload);
      }
    });

    /**
     * EVENT: call:cancel
     * Caller cancels while ringing
     */
    socket.on('call:cancel', (data: { callId: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      console.log(`[Signaling:call:cancel] Caller ${userId} cancelling call ${data.callId}`);
      const result = CallsService.cancelCall(data.callId, userId);

      if (result.success && result.call) {
        const call = result.call;
        const payload = {
          callId: call.callId,
          reason: 'Call cancelled by caller',
          call
        };

        io.to(`user:${call.callerId}`).emit('call:cancelled', payload);
        io.to(`user:${call.calleeId}`).emit('call:cancelled', payload);
      }
    });

    /**
     * EVENT: call:end
     * Either user clicks End
     */
    socket.on('call:end', (data: { callId: string; reason?: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      console.log(`[Signaling:call:end] User ${userId} ending call ${data.callId}`);
      const result = CallsService.endCall(data.callId, userId, data.reason);

      if (result.success && result.call) {
        const call = result.call;
        const payload = {
          callId: call.callId,
          duration: call.duration,
          reason: call.endReason || 'Call ended',
          call
        };

        io.to(`user:${call.callerId}`).emit('call:ended', payload);
        io.to(`user:${call.calleeId}`).emit('call:ended', payload);
      }
    });

    // -------------------------------------------------------------
    // 3. WEBRTC SIGNALING RELAYS (Offer, Answer, ICE Candidates)
    // -------------------------------------------------------------

    /**
     * EVENT: webrtc:offer
     * Caller creates and sends WebRTC Offer to Callee
     */
    socket.on('webrtc:offer', (data: { callId: string; sdp: any }) => {
      const userId = socket.data.userId;
      const call = CallsService.getCall(data.callId);
      if (!call) return;

      const targetUserId = (call.callerId === userId) ? call.calleeId : call.callerId;
      console.log(`[WebRTC] Relaying SDP OFFER from ${userId} to ${targetUserId}`);

      io.to(`user:${targetUserId}`).emit('webrtc:offer', {
        callId: data.callId,
        sdp: data.sdp,
        senderId: userId
      });
    });

    /**
     * EVENT: webrtc:answer
     * Callee creates and sends WebRTC Answer to Caller
     */
    socket.on('webrtc:answer', (data: { callId: string; sdp: any }) => {
      const userId = socket.data.userId;
      const call = CallsService.getCall(data.callId);
      if (!call) return;

      CallsService.markConnected(data.callId);
      const targetUserId = (call.calleeId === userId) ? call.callerId : call.calleeId;
      console.log(`[WebRTC] Relaying SDP ANSWER from ${userId} to ${targetUserId}`);

      io.to(`user:${targetUserId}`).emit('webrtc:answer', {
        callId: data.callId,
        sdp: data.sdp,
        senderId: userId
      });

      // Notify both that call media is connected
      io.to(`user:${call.callerId}`).emit('call:connected', { callId: data.callId });
      io.to(`user:${call.calleeId}`).emit('call:connected', { callId: data.callId });
    });

    /**
     * EVENT: webrtc:ice-candidate
     * Exchange ICE candidate between peers
     */
    socket.on('webrtc:ice-candidate', (data: { callId: string; candidate: any }) => {
      const userId = socket.data.userId;
      const call = CallsService.getCall(data.callId);
      if (!call) return;

      const targetUserId = (call.callerId === userId) ? call.calleeId : call.callerId;
      io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', {
        callId: data.callId,
        candidate: data.candidate,
        senderId: userId
      });
    });

    // -------------------------------------------------------------
    // 4. Random Matchmaking & Legacy Gateway Support
    // -------------------------------------------------------------
    socket.on('find_random_match', (data: { userId: string; mode?: CallMode; isCelebrityPool?: boolean }) => {
      const userId = data?.userId || socket.data.userId;
      if (!userId) {
        socket.emit('error', { message: 'User ID is required to match' });
        return;
      }

      const mode = data.mode || CallMode.AUDIO;
      const isCelebrityPool = data.isCelebrityPool || false;

      const { matched, matchResult } = MatchmakingService.enqueueUser(userId, socket.id, mode, isCelebrityPool);

      if (matched && matchResult) {
        const { userA, userB, roomId, isCelebMatch } = matchResult;
        const socketA = io.sockets.sockets.get(userA.socketId);
        const socketB = io.sockets.sockets.get(userB.socketId);

        if (socketA) socketA.join(roomId);
        if (socketB) socketB.join(roomId);

        const payloadA = MatchmakingService.buildMatchPayload(userB.userId, roomId, mode, 'caller', false);
        io.to(userA.socketId).emit('match_found', payloadA);

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
      const userId = data?.userId || socket.data.userId;
      if (userId) {
        MatchmakingService.dequeueUser(userId);
        socket.emit('matchmaking_cancelled', { message: 'Matchmaking cancelled' });
      }
    });

    // Celebrity fan connect status toggle
    socket.on('celebrity_fan_connect_toggle', (data: { celebUserId: string; active: boolean }) => {
      MatchmakingService.setCelebrityHostActive(data.celebUserId, socket.id, data.active);
      io.emit('celebrity_fan_connect_status', { celebUserId: data.celebUserId, isLive: data.active });
    });

    // -------------------------------------------------------------
    // 5. Disconnection & Cleanup
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        const sSet = userToSockets.get(userId);
        if (sSet) {
          sSet.delete(socket.id);
          if (sSet.size === 0) {
            userToSockets.delete(userId);
            DataStore.onlineUsers.delete(userId);
            io.emit('presence_update', { onlineCount: DataStore.onlineUsers.size });

            // Handle 10s grace period for mid-call reconnect
            CallsService.handleDisconnectGracePeriod(userId, (terminatedCall) => {
              const otherUserId = (terminatedCall.callerId === userId) ? terminatedCall.calleeId : terminatedCall.callerId;
              io.to(`user:${otherUserId}`).emit('call:ended', {
                callId: terminatedCall.callId,
                duration: terminatedCall.duration,
                reason: terminatedCall.endReason || 'Peer disconnected'
              });
            });
          }
        }
        MatchmakingService.dequeueUser(userId);
        socketToUser.delete(socket.id);
        console.log(`[Socket] Socket ${socket.id} (User: ${userId}) disconnected.`);
      }
    });
  });
}
