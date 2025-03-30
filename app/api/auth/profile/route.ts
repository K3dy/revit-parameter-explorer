// app/api/auth/profile/route.ts
import { getAuthTokens } from '@/lib/server/auth';
import { getUserProfile } from '@/lib/services/aps';

export async function GET() {
  const tokens = await getAuthTokens();
  
  if (!tokens) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const profile = await getUserProfile(tokens.internalToken.access_token);
    return Response.json(profile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return new Response('Failed to get user profile', { status: 500 });
  }
}