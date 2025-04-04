'use client';

// lib/client/auth.ts
import { useState, useEffect } from 'react';
import { OAuthToken, UserProfile } from '@/types';

/**
 * fetchUserProfile - Fetches the authenticated user's profile from the server.
 *
 * @returns A Promise that resolves with the user profile data if the request is successful,
 *          or null if the request fails or returns a non-OK status.
 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    // Request the user profile from the API endpoint.
    const res = await fetch('/api/auth/profile');
    if (res.ok) {
      // Parse and return the user profile data as JSON.
      return await res.json();
    }
    // Log a warning if the response status is not OK.
    console.warn('User profile fetch returned a non-OK response:', res.status);
    return null;
  } catch (error) {
    // Log the error and return null if the fetch fails.
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * fetchAuthToken - Fetches the OAuth authentication token from the server.
 *
 * @returns A Promise that resolves with the OAuth token data if the request is successful,
 *          or null if the request fails or returns a non-OK status.
 */
export async function fetchAuthToken(): Promise<OAuthToken | null> {
  try {
    // Request the OAuth token from the API endpoint.
    const res = await fetch('/api/auth/token');
    if (res.ok) {
      // Parse and return the token data as JSON.
      return await res.json();
    }
    // Log a warning if the response status is not OK.
    console.warn('Auth token fetch returned a non-OK response:', res.status);
    return null;
  } catch (error) {
    // Log the error and return null if the fetch fails.
    console.error('Failed to fetch auth token:', error);
    return null;
  }
}

/**
 * useUser - Custom React hook to manage and provide the authenticated user's profile.
 *
 * This hook fetches the user profile when the component mounts and provides both the
 * user data and a loading state.
 *
 * @returns An object with two properties:
 *          - user: The user profile data, or null if not authenticated.
 *          - loading: A boolean indicating whether the user data is still being loaded.
 */
export function useUser() {
  // State to hold the user profile; initialized as null.
  const [user, setUser] = useState<UserProfile | null>(null);
  // State to indicate whether the profile is currently being loaded.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define an async function to load the user profile.
    async function loadUser() {
      try {
        // Fetch the user profile using the helper function.
        const profile = await fetchUserProfile();
        // Update the state with the fetched profile.
        setUser(profile);
      } catch (error) {
        // Log any errors encountered while loading the user profile.
        console.error('Error loading user:', error);
      } finally {
        // Set loading to false once the fetch attempt is complete.
        setLoading(false);
      }
    }

    // Invoke the loadUser function on component mount.
    loadUser();
  }, []);

  // Return the user profile and loading state.
  return { user, loading };
}
