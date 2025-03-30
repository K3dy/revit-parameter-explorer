'use client';

// lib/client/auth.ts
import { useState, useEffect } from 'react';
import { OAuthToken, UserProfile } from '@/types';

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/profile');
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

export async function fetchAuthToken(): Promise<OAuthToken | null> {
  try {
    const res = await fetch('/api/auth/token');
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch auth token:', error);
    return null;
  }
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await fetchUserProfile();
        setUser(profile);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, loading };
}