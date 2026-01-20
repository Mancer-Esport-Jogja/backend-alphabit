import { env } from '../config/env';

/**
 * User data types from Neynar Snapchain API
 */
type UserDataType = 
  | 'USER_DATA_TYPE_USERNAME'
  | 'USER_DATA_TYPE_DISPLAY'
  | 'USER_DATA_TYPE_PFP'
  | 'USER_DATA_PRIMARY_ADDRESS_ETHEREUM'
  | 'USER_DATA_TYPE_BIO'
  | 'USER_DATA_TYPE_URL'
  | 'USER_DATA_TYPE_TWITTER'
  | 'USER_DATA_TYPE_BANNER'
  | 'USER_DATA_PRIMARY_ADDRESS_SOLANA';

interface NeynarMessage {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    network: string;
    userDataBody: {
      type: UserDataType;
      value: string;
    };
  };
  hash: string;
}

interface NeynarResponse {
  messages: NeynarMessage[];
  nextPageToken?: string;
}

export interface FarcasterUserData {
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  primaryEthAddress: string | null;
}

const NEYNAR_BASE_URL = 'https://snapchain-api.neynar.com/v1';

/**
 * Neynar Service - Fetch Farcaster user data
 */
export const neynarService = {
  /**
   * Fetch user data from Neynar Snapchain API by FID
   */
  getUserDataByFid: async (fid: number): Promise<FarcasterUserData> => {
    const result: FarcasterUserData = {
      username: null,
      displayName: null,
      pfpUrl: null,
      primaryEthAddress: null
    };

    if (!env.NEYNAR_API_KEY) {
      console.warn('NEYNAR_API_KEY not set, skipping profile fetch');
      return result;
    }

    try {
      const response = await fetch(
        `${NEYNAR_BASE_URL}/userDataByFid?fid=${fid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.NEYNAR_API_KEY
          }
        }
      );

      if (!response.ok) {
        console.error(`Neynar API error: ${response.status} ${response.statusText}`);
        return result;
      }

      const data: NeynarResponse = await response.json();

      // Parse messages to extract user data
      for (const message of data.messages) {
        const { type, value } = message.data.userDataBody;
        
        switch (type) {
          case 'USER_DATA_TYPE_USERNAME':
            result.username = value;
            break;
          case 'USER_DATA_TYPE_DISPLAY':
            result.displayName = value;
            break;
          case 'USER_DATA_TYPE_PFP':
            result.pfpUrl = value;
            break;
          case 'USER_DATA_PRIMARY_ADDRESS_ETHEREUM':
            result.primaryEthAddress = value;
            break;
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching user data from Neynar:', error);
      return result;
    }
  }
};
