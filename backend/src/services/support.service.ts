import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { CallSession, CallStatus, CallType, UserRole } from '../shared/types';
import { CallsService } from './calls.service';

export class SupportService {
  /**
   * Connects a user directly to an available Customer Care Representative
   */
  public static connectToSupport(userId: string): { session: CallSession; assignedAgentId: string } {
    const caller = DataStore.users.get(userId);
    if (!caller) throw new Error('User not found');

    // Find first available support agent
    const availableAgentId = Array.from(DataStore.supportAgents)[0];

    if (!availableAgentId) {
      throw new Error('All Customer Care representatives are currently busy. Please try again shortly.');
    }

    const session = CallsService.initiateCall(userId, availableAgentId, CallType.SUPPORT_CALL);

    return {
      session,
      assignedAgentId: availableAgentId
    };
  }

  /**
   * List of active support agents
   */
  public static getActiveAgents() {
    return Array.from(DataStore.supportAgents).map(agentId => {
      const profile = DataStore.profiles.get(agentId);
      const user = DataStore.users.get(agentId);
      return {
        id: agentId,
        name: profile?.fullName || 'Support Representative',
        phone: user?.phoneNumber,
        available: profile?.callAvailable ?? true
      };
    });
  }
}
