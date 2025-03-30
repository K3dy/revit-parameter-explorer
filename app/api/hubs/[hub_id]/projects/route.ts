// app/api/hubs/[hub_id]/projects/route.ts
import { getAuthTokens } from '@/lib/server/auth';
import { getProjects } from '@/lib/services/aps';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { hub_id: string } }
) {

  const {hub_id} = await params;
  
  const tokens = await getAuthTokens();
  
  if (!tokens) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projects = await getProjects(hub_id, tokens.internalToken.access_token);
    return Response.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}