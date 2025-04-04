// app/api/hubs/route.ts
import { getAuthTokens } from '@/lib/server/auth';
import { getHubs } from '@/lib/services/aps';

/**
 * GET - Retrieves a list of hubs for the authenticated user.
 *
 * This route first obtains authentication tokens from cookies.
 * If tokens are missing or invalid, it returns a 401 Unauthorized response.
 * Otherwise, it uses the internal access token to fetch the hubs.
 * Any errors during the hubs fetch result in a 500 error response.
 *
 * @returns A JSON response containing the list of hubs or an error message.
 */
export async function GET() {
  // Retrieve tokens from cookies using the server-side auth helper.
  const tokens = await getAuthTokens();
  
  // If tokens are missing, return a JSON response with a 401 Unauthorized status.
  if (!tokens) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Use the internal access token to fetch the list of hubs.
    const hubs = await getHubs(tokens.internalToken.access_token);
    // Return the hubs in a JSON response.
    return Response.json(hubs);
  } catch (error) {
    // Log the error for debugging purposes.
    console.error('Error getting hubs:', error);
    // Return a JSON response with a 500 status if fetching hubs fails.
    return Response.json({ error: 'Failed to fetch hubs' }, { status: 500 });
  }
}
