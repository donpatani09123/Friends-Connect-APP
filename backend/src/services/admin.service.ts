import { DataStore } from '../database/store';
import { User, UserRole, AccountTier, EventStatus } from '../shared/types';

export class AdminService {
  /**
   * Retrieves all registered users across all roles with profiles
   */
  public static getAllUsers() {
    return Array.from(DataStore.users.values()).map(user => {
      const profile = DataStore.profiles.get(user.id);
      return {
        ...user,
        profile
      };
    });
  }

  /**
   * Toggles blocking/banning for a user
   */
  public static setUserBlockStatus(userId: string, isBlocked: boolean, reason?: string): User {
    const user = DataStore.users.get(userId);
    if (!user) throw new Error('User not found');

    if (user.role === UserRole.SUPERADMIN) {
      throw new Error('Cannot block a SuperAdmin account');
    }

    user.isBlocked = isBlocked;
    console.log(`[Admin Audit] User ${userId} (${user.phoneNumber}) block status set to: ${isBlocked}. Reason: ${reason || 'N/A'}`);
    return user;
  }

  /**
   * Upgrades a user account tier (e.g., Free -> Premium VIP)
   */
  public static updateUserTier(userId: string, tier: AccountTier): User {
    const user = DataStore.users.get(userId);
    if (!user) throw new Error('User not found');

    user.tier = tier;
    return user;
  }

  /**
   * SuperAdmin platform statistics
   */
  public static getPlatformMetrics() {
    const users = Array.from(DataStore.users.values());
    const events = Array.from(DataStore.events.values());
    const bookings = Array.from(DataStore.bookings.values());
    const calls = Array.from(DataStore.calls.values());

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalUsers: users.length,
      usersByRole: {
        normal: users.filter(u => u.role === UserRole.NORMAL).length,
        celebrities: users.filter(u => u.role === UserRole.CELEBRITY).length,
        organizations: users.filter(u => u.role === UserRole.ORGANIZATION).length,
        support: users.filter(u => u.role === UserRole.SUPPORT).length,
        superadmin: users.filter(u => u.role === UserRole.SUPERADMIN).length
      },
      premiumUsersCount: users.filter(u => u.tier === AccountTier.PREMIUM_VIP).length,
      blockedUsersCount: users.filter(u => u.isBlocked).length,
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === EventStatus.PUBLISHED).length,
      totalTicketsSold: bookings.reduce((sum, b) => sum + b.numberOfTickets, 0),
      totalRevenueUsd: totalRevenue,
      totalCallsLogged: calls.length
    };
  }
}
