'use client';

import React, { useState } from 'react';
import { useCall } from '../context/CallContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!incomingCall) return null;

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await acceptCall(incomingCall.callId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      declineCall(incomingCall.callId);
    } finally {
      setIsProcessing(false);
    }
  };

  const callerInitial = incomingCall.callerName ? incomingCall.callerName[0] : 'U';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#1b1f26] border-2 border-purple-500/80 shadow-[0_0_50px_rgba(139,92,246,0.5)] p-6 text-center text-white overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Incoming VIP Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-4 animate-pulse">
          <span>🔔</span>
          <span>INCOMING VIP CALL</span>
        </div>

        {/* Caller Avatar with pulsing ring */}
        <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-purple-500/50">
            {callerInitial}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-1">{incomingCall.callerName}</h3>
        <p className="text-xs text-slate-400 mb-2">
          is requesting a 1-on-1 VIP <b className="text-purple-400">{incomingCall.type === 'video' ? 'Video' : 'Audio'}</b> Call
        </p>
        <div className="text-sm font-semibold text-emerald-400 mb-6">
          Earn ₹150/minute
        </div>

        {/* Equalizer animation */}
        <div className="flex justify-center items-center gap-1.5 h-6 mb-6">
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <span
              key={idx}
              className="w-1 bg-purple-500 rounded-full animate-pulse"
              style={{
                height: `${12 + (idx % 3) * 6}px`,
                animationDelay: `${idx * 0.15}s`
              }}
            />
          ))}
        </div>

        {/* Action Buttons: Accept / Decline */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>📞</span>
            <span>{isProcessing ? 'Connecting…' : 'Accept Call'}</span>
          </button>
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-medium transition disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
