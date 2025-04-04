// lib/server/auth.ts
import { cookies } from 'next/headers';
import { refreshTokens } from '../services/aps';
import { OAuthToken } from '@/types';

/**
 * getAuthTokens - Retrieves and refreshes authentication tokens if necessary.
 *
 * This function reads tokens from cookies. If the stored tokens have expired,
 * it attempts to refresh them using the refresh token. Updated tokens are then
 * stored in cookies.
 *
 * @returns An object containing internal and public tokens, or null if tokens are missing or refreshing fails.
 */
export async function getAuthTokens(): Promise<{
  internalToken: OAuthToken;
  publicToken: OAuthToken;
} | null> {
  // Get the cookie store from Next.js headers.
  const cookieStore = await cookies();
  // Retrieve the refresh token and the expiration time from cookies.
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const expiresAt = cookieStore.get('expires_at')?.value;
  
  // If either the refresh token or expires_at is missing, return null.
  if (!refreshToken || !expiresAt) {
    return null;
  }
  
  // Parse the expires_at value to a number.
  const expiresAtNum = parseInt(expiresAt);
  
  // Ensure the parsed expiration time is valid.
  if (isNaN(expiresAtNum)) {
    console.error('Invalid expires_at cookie value:', expiresAt);
    return null;
  }
  
  // Check if the token has expired.
  if (expiresAtNum < Date.now()) {
    try {
      // Attempt to refresh tokens using the refresh token.
      const tokens = await refreshTokens(refreshToken);
      
      // Validate the response to ensure all required token properties are available.
      if (
        !tokens ||
        !tokens.public_token ||
        !tokens.internal_token ||
        !tokens.refresh_token ||
        !tokens.expires_at
      ) {
        throw new Error("Incomplete token response from refreshTokens.");
      }
      
      // Update cookies with new tokens.
      cookieStore.set('public_token', tokens.public_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day (in seconds)
        path: '/'
      });
      
      cookieStore.set('internal_token', tokens.internal_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day (in seconds)
        path: '/'
      });
      
      cookieStore.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days (in seconds)
        path: '/'
      });
      
      cookieStore.set('expires_at', tokens.expires_at.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day (in seconds)
        path: '/'
      });
      
      // Return the refreshed tokens along with calculated expires_in values.
      return {
        internalToken: {
          access_token: tokens.internal_token,
          expires_in: Math.round((tokens.expires_at - Date.now()) / 1000)
        },
        publicToken: {
          access_token: tokens.public_token,
          expires_in: Math.round((tokens.expires_at - Date.now()) / 1000)
        }
      };
    } catch (error) {
      // Log any error during the refresh process and return null.
      console.error('Error refreshing tokens:', error);
      return null;
    }
  }
  
  // If tokens have not expired, return them from the cookies.
  return {
    internalToken: {
      access_token: cookieStore.get('internal_token')!.value,
      expires_in: Math.round((parseInt(expiresAt) - Date.now()) / 1000)
    },
    publicToken: {
      access_token: cookieStore.get('public_token')!.value,
      expires_in: Math.round((parseInt(expiresAt) - Date.now()) / 1000)
    }
  };
}
