'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

export interface CallInfo {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  calleeAvatar?: string;
  type: 'video' | 'audio';
  state: CallStateType;
  roomId?: string;
  startedAt?: string;
  duration?: number;
  endReason?: string;
}

export interface CallContextType {
  callState: CallStateType;
  activeCall: CallInfo | null;
  incomingCall: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCamOff: boolean;
  facingMode: 'user' | 'environment';
  callDuration: number;
  connectionQuality: 'good' | 'poor' | 'reconnecting';
  mediaError: string | null;
  initiateCall: (calleeId: string, calleeName: string, type: 'video' | 'audio', calleeAvatar?: string) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => void;
  cancelCall: (callId: string) => void;
  endCall: (reason?: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  retryCamera: () => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

// Audio Synthesizer for Phone Ringtone (Web Audio API)
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public startRingback() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    const playTone = () => {
      try {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx!.currentTime;
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx!.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (e) {}
    };

    playTone();
    this.intervalId = setInterval(playTone, 3500);
  }

  public startIncomingRing() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    const playBell = () => {
      try {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx!.currentTime;
        const freqs = [853, 960];
        freqs.forEach(f => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now);
          osc.stop(now + 0.9);
        });
      } catch (e) {}
    };

    playBell();
    this.intervalId = setInterval(playBell, 2200);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const ringtone = new RingtonePlayer();

const DEFAULT_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export const CallProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
  userName: string;
  userPhone?: string;
  userAvatar?: string;
  isPremium?: boolean;
}> = ({ children, userId, userName, userPhone, userAvatar, isPremium }) => {
  const [callState, setCallState] = useState<CallStateType>('idle');
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'reconnecting'>('good');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const durationTimerRef = useRef<any>(null);
  const isAcceptingRef = useRef(false);

  // 1. Initialize Socket.IO connection with JWT or User Credentials
  useEffect(() => {
    if (!userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      auth: { userId, userName, userPhone },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket Connected] ID: ${socket.id} for user: ${userId}`);
      socket.emit('register_presence', { userId });
    });

    // Incoming Call alert
    socket.on('call:incoming', (data: { callId: string; call: CallInfo; caller: any }) => {
      console.log('[Signaling:call:incoming]', data);
      setIncomingCall(data.call);
      setCallState('ringing');
      ringtone.startIncomingRing();

      // Trigger browser notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming VIP ${data.call.type} Call`, {
          body: `${data.call.callerName} is calling you on Vibzz`,
          icon: data.call.callerAvatar || '/favicon.ico'
        });
      }
    });

    // Caller: Callee device is ringing
    socket.on('call:ringing', (data: { callId: string; call: CallInfo }) => {
      console.log('[Signaling:call:ringing]', data);
      setActiveCall(data.call);
      setCallState('calling');
      ringtone.startRingback();
    });

    // Callee accepted: Both sides open call screen and initiate WebRTC negotiation
    socket.on('call:accepted', async (data: { callId: string; call: CallInfo; roomId: string; type: 'video' | 'audio' }) => {
      console.log('[Signaling:call:accepted] Transitioning to connected stage...', data);
      ringtone.stop();
      setActiveCall(data.call);
      setIncomingCall(null);
      setCallState('accepted');

      // Start call duration timer
      clearInterval(durationTimerRef.current);
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Caller initiates the WebRTC offer
      if (data.call.callerId === userId) {
        await startWebRtcCaller(data.callId, data.type);
      }
    });

    // Callee declined
    socket.on('call:declined', (data: { callId: string; reason?: string }) => {
      console.log('[Signaling:call:declined]', data);
      ringtone.stop();
      cleanupMedia();
      setCallState('declined');
      setTimeout(() => {
        setActiveCall(null);
        setIncomingCall(null);
        setCallState('idle');
      }, 2500);
    });

    // Caller cancelled
    socket.on('call:cancelled', (data: { callId: string; reason?: string }) => {
      console.log('[Signaling:call:cancelled]', data);
      ringtone.stop();
      cleanupMedia();
      setCallState('cancelled');
      setTimeout(() => {
        setActiveCall(null);
        setIncomingCall(null);
        setCallState('idle');
      }, 2000);
    });

    // Call missed (30s timeout)
    socket.on('call:missed', (data: { callId: string; message: string }) => {
      console.log('[Signaling:call:missed]', data);
      ringtone.stop();
      cleanupMedia();
      setCallState('missed');
      setTimeout(() => {
        setActiveCall(null);
        setIncomingCall(null);
        setCallState('idle');
      }, 2500);
    });

    // Callee is busy
    socket.on('call:busy', (data: { message: string }) => {
      console.log('[Signaling:call:busy]', data);
      ringtone.stop();
      cleanupMedia();
      setCallState('busy');
      setTimeout(() => {
        setActiveCall(null);
        setCallState('idle');
      }, 2500);
    });

    // Call ended
    socket.on('call:ended', (data: { callId: string; duration?: number; reason?: string }) => {
      console.log('[Signaling:call:ended]', data);
      ringtone.stop();
      cleanupMedia();
      setCallState('ended');
      setTimeout(() => {
        setActiveCall(null);
        setIncomingCall(null);
        setCallState('idle');
      }, 2000);
    });

    // Call failed (e.g. rate limit, blocked, network error)
    socket.on('call:failed', (data: { error: string }) => {
      console.warn('[Signaling:call:failed]', data.error);
      ringtone.stop();
      cleanupMedia();
      setMediaError(data.error);
      setCallState('failed');
      setTimeout(() => {
        setCallState('idle');
        setMediaError(null);
      }, 3000);
    });

    // WebRTC Offer received (Callee side)
    socket.on('webrtc:offer', async (data: { callId: string; sdp: any; senderId: string }) => {
      console.log('[WebRTC Received Offer]', data);
      await handleWebRtcOffer(data.callId, data.sdp);
    });

    // WebRTC Answer received (Caller side)
    socket.on('webrtc:answer', async (data: { callId: string; sdp: any; senderId: string }) => {
      console.log('[WebRTC Received Answer]', data);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Process any queued ICE candidates that arrived early
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift()!;
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
      }
    });

    // WebRTC ICE Candidate received
    socket.on('webrtc:ice-candidate', async (data: { callId: string; candidate: any }) => {
      if (!data.candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.warn('[WebRTC ICE Add Error]', e);
        }
      } else {
        iceCandidatesQueue.current.push(data.candidate);
      }
    });

    // Handle tab closing mid-call
    const handleBeforeUnload = () => {
      if (activeCall) {
        socket.emit('call:end', { callId: activeCall.callId, reason: 'Tab closed' });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      ringtone.stop();
      cleanupMedia();
      socket.disconnect();
    };
  }, [userId, userName, userPhone]);

  // Clean up all tracks, peer connection, and reset state
  const cleanupMedia = useCallback(() => {
    ringtone.stop();
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      setLocalStream(null);
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    clearInterval(durationTimerRef.current);
    iceCandidatesQueue.current = [];
    isAcceptingRef.current = false;
    setRemoteStream(null);
    setConnectionQuality('good');
  }, [localStream]);

  // Request user media safely with video -> audio fallback
  const acquireMedia = async (type: 'video' | 'audio', facing: 'user' | 'environment' = 'user'): Promise<MediaStream | null> => {
    try {
      setMediaError(null);
      let stream: MediaStream;
      if (type === 'video') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch (errVideo: any) {
          console.warn('[WebRTC Camera Fallback] Trying video-only or audio-only fallback:', errVideo.name);
          if (errVideo.name === 'NotAllowedError' || errVideo.name === 'PermissionDeniedError') {
            setMediaError('Camera permission was denied. Please allow camera and microphone access.');
            return null;
          }
          // Fallback to audio only
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC getUserMedia Error]', err);
      let msg = 'Unable to access microphone or camera.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera or microphone found on your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Camera and microphone permissions were denied.';
      }
      setMediaError(msg);
      return null;
    }
  };

  // Create RTCPeerConnection and attach event listeners
  const createPeerConnection = (callId: string, stream: MediaStream): RTCPeerConnection => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
    }

    const pc = new RTCPeerConnection(DEFAULT_ICE_SERVERS);
    pcRef.current = pc;

    // Add local stream tracks to PC
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Remote track arrived
    pc.ontrack = (event) => {
      console.log('[WebRTC ontrack] Remote stream track arrived:', event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setCallState('connected');
      }
    };

    // Relay local ICE candidates to server
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc:ice-candidate', {
          callId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Monitor Connection State & Reconnection
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Connection State]: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionQuality('good');
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected') {
        setConnectionQuality('reconnecting');
      } else if (pc.connectionState === 'failed') {
        setConnectionQuality('reconnecting');
        console.warn('[WebRTC] Connection failed. Attempting ICE restart...');
        try {
          pc.restartIce();
        } catch (e) {
          endCall('WebRTC connection failed');
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC ICE State]: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'disconnected') {
        setConnectionQuality('reconnecting');
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionQuality('good');
      }
    };

    return pc;
  };

  // Caller initiates the WebRTC offer
  const startWebRtcCaller = async (callId: string, type: 'video' | 'audio') => {
    let stream = localStream;
    if (!stream) {
      stream = await acquireMedia(type, facingMode);
      if (!stream) return;
    }

    const pc = createPeerConnection(callId, stream);
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video'
    });
    await pc.setLocalDescription(offer);

    console.log('[WebRTC] Sending Offer to server for call:', callId);
    socketRef.current?.emit('webrtc:offer', { callId, sdp: offer });
  };

  // Callee receives offer and creates answer
  const handleWebRtcOffer = async (callId: string, offerSdp: any) => {
    let stream = localStream;
    if (!stream) {
      stream = await acquireMedia('video', facingMode);
      if (!stream) return;
    }

    const pc = createPeerConnection(callId, stream);
    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    // Drain queued ICE candidates
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift()!;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    console.log('[WebRTC] Sending Answer to server for call:', callId);
    socketRef.current?.emit('webrtc:answer', { callId, sdp: answer });
  };

  // Initiate call to Callee
  const initiateCall = async (calleeId: string, calleeName: string, type: 'video' | 'audio', calleeAvatar?: string) => {
    if (callState !== 'idle') return;

    setMediaError(null);
    const stream = await acquireMedia(type, facingMode);
    if (!stream) return;

    const placeholderCall: CallInfo = {
      callId: `pending_${Date.now()}`,
      callerId: userId,
      callerName: userName,
      callerAvatar: userAvatar,
      calleeId,
      calleeName,
      calleeAvatar,
      type,
      state: 'calling'
    };

    setActiveCall(placeholderCall);
    setCallState('calling');
    ringtone.startRingback();

    socketRef.current?.emit('call:initiate', { calleeId, type });
  };

  // Accept incoming call
  const acceptCall = async (callId: string) => {
    if (isAcceptingRef.current) return;
    isAcceptingRef.current = true;
    ringtone.stop();

    const type = incomingCall?.type || 'video';
    const stream = await acquireMedia(type, facingMode);

    if (!stream) {
      // Permission denied or media error -> decline call
      declineCall(callId);
      isAcceptingRef.current = false;
      return;
    }

    console.log(`[Call:Accept] Emitting call:accept for ${callId}`);
    socketRef.current?.emit('call:accept', { callId });
    setIncomingCall(null);
    setCallState('accepted');
  };

  // Decline incoming call
  const declineCall = (callId: string) => {
    ringtone.stop();
    socketRef.current?.emit('call:decline', { callId });
    setIncomingCall(null);
    setCallState('idle');
  };

  // Cancel outgoing call
  const cancelCall = (callId: string) => {
    ringtone.stop();
    socketRef.current?.emit('call:cancel', { callId });
    cleanupMedia();
    setActiveCall(null);
    setCallState('idle');
  };

  // End active call
  const endCall = (reason?: string) => {
    ringtone.stop();
    const callId = activeCall?.callId;
    if (callId && socketRef.current) {
      socketRef.current.emit('call:end', { callId, reason });
    }
    cleanupMedia();
    setActiveCall(null);
    setIncomingCall(null);
    setCallState('idle');
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(t => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera Video On/Off
  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(t => (t.enabled = isCamOff));
      setIsCamOff(!isCamOff);
    }
  };

  // Switch between Front & Rear Camera on mobile
  const switchCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (localStream && pcRef.current) {
      const oldVideoTrack = localStream.getVideoTracks()[0];
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace track in RTCPeerConnection sender
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        localStream.addTrack(newVideoTrack);
      } catch (err) {
        console.warn('[Switch Camera Error]', err);
      }
    }
  };

  const retryCamera = async () => {
    if (activeCall) {
      await acquireMedia(activeCall.type, facingMode);
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        facingMode,
        callDuration,
        connectionQuality,
        mediaError,
        initiateCall,
        acceptCall,
        declineCall,
        cancelCall,
        endCall,
        toggleMute,
        toggleCamera,
        switchCamera,
        retryCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
