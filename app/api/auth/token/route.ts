// app/api/auth/token/route.ts
import { getAuthTokens } from '@/lib/server/auth';

export async function GET() {
  const tokens = await getAuthTokens();
  
  if (!tokens) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return Response.json(tokens.publicToken);
}