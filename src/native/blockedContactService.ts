import { NativeModules } from 'react-native';

const { BlockedContactManager } = NativeModules;

export interface BlockedContact {
  id: string;
  phoneNumber: string;
  blockedAt: number;
}

export const blockedContactService = {
  /**
   * Save userId to native SharedPreferences
   * Call this after successful login
   */
  async setUserId(userId: string): Promise<string> {
    try {
      return await BlockedContactManager.setUserId(userId);
    } catch (error) {
      console.error('Error setting userId:', error);
      throw error;
    }
  },

  /**
   * Check if a phone number is blocked
   */
  async isBlocked(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      return await BlockedContactManager.isBlocked(userId, phoneNumber);
    } catch (error) {
      console.error('Error checking if blocked:', error);
      return false;
    }
  },

  /**
   * Block a phone number
   */
  async blockNumber(userId: string, phoneNumber: string): Promise<string> {
    try {
      const result = await BlockedContactManager.blockNumber(
        userId,
        phoneNumber,
      );
      console.log('✅ Number blocked:', phoneNumber);
      return result;
    } catch (error) {
      console.error('Error blocking number:', error);
      throw error;
    }
  },

  /**
   * Unblock a phone number
   */
  async unblockNumber(userId: string, phoneNumber: string): Promise<string> {
    try {
      const result = await BlockedContactManager.unblockNumber(
        userId,
        phoneNumber,
      );
      console.log('✅ Number unblocked:', phoneNumber);
      return result;
    } catch (error) {
      console.error('Error unblocking number:', error);
      throw error;
    }
  },

  /**
   * Get all blocked numbers
   */
  async getBlockedNumbers(userId: string): Promise<BlockedContact[]> {
    try {
      return await BlockedContactManager.getBlockedNumbers(userId);
    } catch (error) {
      console.error('Error getting blocked numbers:', error);
      return [];
    }
  },
};
