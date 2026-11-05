import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'friends-app-super-secret-key-2026',
  jwtExpiresIn: '24h',
  otpTtlSeconds: 120, // 2 minutes
  defaultMatchTimeoutMs: 15000,
  rtcIceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};
