import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { DataStore } from '../database/store';
import { User, UserRole, AccountTier, AuthResponseDto } from '../shared/types';

export class AuthService {
  /**
   * Generates a 6-digit OTP code and persists it in memory/Redis with TTL
   */
  public static requestOtp(phoneNumber: string): { message: string; devOtp?: string } {
    const formattedPhone = phoneNumber.trim();
    // Deterministic dev OTP for known test numbers, or random 6-digit OTP
    const code = formattedPhone.startsWith('+1000') || formattedPhone.startsWith('+1987') 
      ? '123456' 
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + config.otpTtlSeconds * 1000;
    DataStore.otps.set(formattedPhone, { code, expiresAt });

    console.log(`[SMS Gateway] Dispatched OTP code [${code}] to destination: ${formattedPhone}`);

    return {
      message: 'OTP sent successfully via SMS',
      devOtp: code // Exposed for development / automated testing convenience
    };
  }

  /**
   * Verifies the OTP and logs in / registers the user
   */
  public static verifyOtp(phoneNumber: string, code: string, requestedRole: UserRole = UserRole.NORMAL): AuthResponseDto {
    const formattedPhone = phoneNumber.trim();
    const record = DataStore.otps.get(formattedPhone);

    if (!record) {
      throw new Error('No OTP request found for this phone number. Please request a new OTP.');
    }

    if (Date.now() > record.expiresAt) {
      DataStore.otps.delete(formattedPhone);
      throw new Error('OTP code has expired. Please request a new one.');
    }

    if (record.code !== code.trim()) {
      throw new Error('Invalid OTP code. Please check and try again.');
    }

    // OTP verified -> remove from store
    DataStore.otps.delete(formattedPhone);

    // Find existing user by phone or create new one
    let user: User | undefined;
    for (const u of DataStore.users.values()) {
      if (u.phoneNumber === formattedPhone) {
        user = u;
        break;
      }
    }

    if (!user) {
      const newUserId = uuidv4();
      user = {
        id: newUserId,
        phoneNumber: formattedPhone,
        role: requestedRole,
        tier: requestedRole === UserRole.CELEBRITY || requestedRole === UserRole.ORGANIZATION 
          ? AccountTier.PREMIUM_VIP 
          : AccountTier.FREE,
        isVerified: requestedRole === UserRole.NORMAL,
        isBlocked: false,
        createdAt: new Date().toISOString()
      };
      DataStore.users.set(newUserId, user);

      // Create default profile
      DataStore.profiles.set(newUserId, {
        userId: newUserId,
        fullName: `User_${formattedPhone.slice(-4)}`,
        callAvailable: true
      });
    }

    if (user.isBlocked) {
      throw new Error('Account suspended by platform administration.');
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, tier: user.tier },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const profile = DataStore.profiles.get(user.id);

    return {
      accessToken,
      refreshToken,
      user,
      profile
    };
  }
}
