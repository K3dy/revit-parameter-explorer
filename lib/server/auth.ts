// lib/server/auth.ts
import { cookies } from 'next/headers';
import { refreshTokens } from '../services/aps';
import { OAuthToken } from '@/types';

export async function getAuthTokens(): Promise<{ 
  internalToken: OAuthToken; 
  publicToken: OAuthToken;
} | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const expiresAt = cookieStore.get('expires_at')?.value;
  
  if (!refreshToken || !expiresAt) {
    return null;
  }
  
  const expiresAtNum = parseInt(expiresAt);
  
  if (expiresAtNum < Date.now()) {
    try {
      const tokens = await refreshTokens(refreshToken);
      
      // Update cookies with new tokens
      cookieStore.set('public_token', tokens.public_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      
      cookieStore.set('internal_token', tokens.internal_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      
      cookieStore.set('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
      
      cookieStore.set('expires_at', tokens.expires_at.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      
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
      console.error('Error refreshing tokens:', error);
      return null;
    }
  }
  
  // Use existing tokens
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