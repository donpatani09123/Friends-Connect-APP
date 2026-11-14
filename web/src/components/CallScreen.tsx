'use client';

import React, { useRef, useEffect } from 'react';
import { useCall } from '../context/CallContext';

export const CallScreen: React.FC = () => {
  const {
    callState,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    facingMode,
    callDuration,
    connectionQuality,
    mediaError,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    retryCamera
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Bind local stream to local video element
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // If idle and no active call, don't render
  if (callState === 'idle' && !activeCall) {
    return null;
  }

  // OUTGOING RINGING SCREEN (Calling...)
  if (callState === 'calling') {
    const calleeName = activeCall?.calleeName || 'Creator';
    return (
      <div className="fixed inset-0 z-50 bg-[#0d0f12] flex flex-col items-center justify-between p-6 text-white select-none">
        <div className="w-full flex justify-between items-center max-w-md pt-4">
          <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/40">
            VIP {activeCall?.type === 'video' ? 'Video' : 'Audio'} Call
          </span>
          <span className="text-xs text-slate-400">Vibzz Secure WebRTC</span>
        </div>

        <div className="flex flex-col items-center text-center my-auto">
          {/* Animated radar rings */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" />
            <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-pulse" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold shadow-2xl shadow-purple-500/50">
              {calleeName[0] || 'C'}
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-100">{calleeName}</h2>
          <p className="text-purple-400 text-sm font-medium animate-pulse mb-6">
            Ringing {calleeName}&apos;s device…
          </p>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            The call is ringing in real time. Waiting for {calleeName} to accept.
          </p>
        </div>

        {/* Local Self Camera Preview in bottom corner while waiting */}
        {activeCall?.type === 'video' && (
          <div className="w-28 h-40 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl mb-4 relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <span className="absolute bottom-1 left-1 bg-black/60 text-[9px] px-1.5 py-0.5 rounded text-slate-300">
              Your Cam
            </span>
          </div>
        )}

        <div className="w-full max-w-xs pb-6">
          <button
            onClick={() => activeCall && cancelCall(activeCall.callId)}
            className="w-full py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
          >
            Cancel Call
          </button>
        </div>
      </div>
    );
  }

  // DECLINED / MISSED / CANCELLED / BUSY / ENDED NOTIFICATION OVERLAYS
  if (['declined', 'missed', 'cancelled', 'busy', 'ended', 'failed'].includes(callState)) {
    const messages: Record<string, string> = {
      declined: `${activeCall?.calleeName || 'Creator'} is busy and declined the call.`,
      missed: `No answer from ${activeCall?.calleeName || 'Creator'} (30s timeout).`,
      cancelled: 'Call was cancelled.',
      busy: `${activeCall?.calleeName || 'Creator'} is currently in another call.`,
      ended: 'Call has ended.',
      failed: mediaError || 'Unable to connect call.'
    };

    return (
      <div className="fixed inset-0 z-50 bg-[#0d0f12]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl mb-4 border border-slate-700">
          {callState === 'declined' ? '📵' : callState === 'missed' ? '⏳' : callState === 'ended' ? '👋' : '⚠️'}
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-100">
          {callState === 'declined' ? 'Call Declined' : callState === 'missed' ? 'Missed Call' : callState === 'ended' ? 'Call Ended' : 'Notice'}
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">{messages[callState]}</p>
        <button
          onClick={() => endCall()}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium border border-slate-700 transition"
        >
          Close
        </button>
      </div>
    );
  }

  // FULL ACTIVE / CONNECTED WEBRTC CALL STAGE
  const otherPartyName = activeCall?.calleeName || 'Partner';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden">
      {/* 1. Main Remote Video Canvas */}
      <div className="relative flex-1 w-full h-full bg-[#14171c] flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-3xl font-bold mb-4 animate-pulse">
              {otherPartyName[0]}
            </div>
            <div className="text-lg font-semibold text-slate-200">{otherPartyName}</div>
            <div className="text-xs text-purple-400 mt-1">Connecting secure WebRTC video stream…</div>
          </div>
        )}

        {/* Reconnecting Overlay if ICE state is disconnected */}
        {connectionQuality === 'reconnecting' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm font-semibold text-yellow-400">Reconnecting stream…</span>
            <span className="text-xs text-slate-400 mt-1">Attempting ICE restart</span>
          </div>
        )}

        {/* Top Floating Header HUD */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionQuality === 'good' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
              }`}
            />
            <span className="text-xs font-medium text-white">{otherPartyName}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-purple-300">{formatTime(callDuration)}</span>
          </div>

          <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-slate-300">
            P2P Encrypted
          </div>
        </div>

        {/* 2. Floating Local Picture-in-Picture Preview Window */}
        <div className="absolute top-16 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {isCamOff && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
              <span>Camera Off</span>
            </div>
          )}
          <span className="absolute bottom-1.5 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white">
            You {isMuted && '· 🔇'}
          </span>
        </div>

        {/* Camera Permission Error Banner with Retry */}
        {mediaError && (
          <div className="absolute top-20 left-4 right-4 sm:left-auto sm:right-auto sm:max-w-md bg-red-950/90 border border-red-500/50 p-3 rounded-xl flex items-center justify-between gap-3 text-white text-xs z-30 shadow-2xl">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{mediaError}</span>
            </div>
            <button
              onClick={retryCamera}
              className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-white font-semibold whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Call Control Dock */}
      <div className="bg-[#14171c]/95 border-t border-slate-800/80 px-6 py-4 flex items-center justify-center gap-4 sm:gap-6 z-20">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition ${
            isMuted
              ? 'bg-red-600/20 text-red-400 border border-red-500/40'
              : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? '🔇' : '🎙'}
        </button>

        {/* Camera Video Toggle */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition ${
            isCamOff
              ? 'bg-red-600/20 text-red-400 border border-red-500/40'
              : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
          }`}
          title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCamOff ? '🚫' : '📹'}
        </button>

        {/* Flip Camera (Mobile) */}
        <button
          onClick={switchCamera}
          className="w-12 h-12 rounded-full bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-lg transition"
          title="Flip Front / Rear Camera"
        >
          🔄
        </button>

        {/* End Call Button */}
        <button
          onClick={() => endCall('User hung up')}
          className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition transform active:scale-95"
        >
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};
