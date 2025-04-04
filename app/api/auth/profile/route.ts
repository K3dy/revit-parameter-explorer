// app/api/auth/profile/route.ts
import { getAuthTokens } from '@/lib/server/auth';
import { getUserProfile } from '@/lib/services/aps';

/**
 * GET - Retrieves the authenticated user's profile.
 *
 * This route first obtains authentication tokens from cookies.
 * If tokens are missing or invalid, it returns a 401 Unauthorized response.
 * Otherwise, it uses the internal access token to fetch the user profile.
 * Any errors during the profile fetch result in a 500 error response.
 *
 * @returns A JSON response containing the user profile or an error message.
 */
export async function GET() {
  // Retrieve tokens from cookies using the server-side auth helper.
  const tokens = await getAuthTokens();

  // If no tokens are available, return an Unauthorized response.
  if (!tokens) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Use the internal access token to get the user's profile from APS.
    const profile = await getUserProfile(tokens.internalToken.access_token);
    // Return the user profile in JSON format.
    return Response.json(profile);
  } catch (error) {
    // Log the error for debugging purposes.
    console.error('Error getting user profile:', error);
    // Return an error response if fetching the user profile fails.
    return new Response('Failed to get user profile', { status: 500 });
  }
}
