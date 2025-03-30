// app/api/hubs/route.ts
import { getAuthTokens } from '@/lib/server/auth';
import { getHubs } from '@/lib/services/aps';

export async function GET() {
  const tokens = await getAuthTokens();
  
  if (!tokens) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const hubs = await getHubs(tokens.internalToken.access_token);
    return Response.json(hubs);
  } catch (error) {
    console.error('Error getting hubs:', error);
    return Response.json({ error: 'Failed to fetch hubs' }, { status: 500 });
  }
}