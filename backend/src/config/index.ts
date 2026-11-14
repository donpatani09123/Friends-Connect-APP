import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'friends-app-super-secret-key-2026',
  jwtExpiresIn: '24h',
  otpTtlSeconds: 120, // 2 minutes
  defaultMatchTimeoutMs: 15000,
  callRingingTimeoutMs: 30000, // 30s ringing timeout
  disconnectGracePeriodMs: 10000, // 10s disconnect grace period
  turnServer: {
    urls: process.env.TURN_URLS ? process.env.TURN_URLS.split(',') : [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: process.env.TURN_USERNAME || 'openrelayproject',
    credential: process.env.TURN_CREDENTIAL || 'openrelayproject'
  },
  rtcIceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: process.env.TURN_USERNAME || 'openrelayproject',
      credential: process.env.TURN_CREDENTIAL || 'openrelayproject'
    }
  ]
};
