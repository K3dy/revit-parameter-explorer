// app/api/auth/login/route.ts
import { getAuthorizationUrl } from '@/lib/services/aps';
import { redirect } from 'next/navigation';

export async function GET() {
  const authUrl = getAuthorizationUrl();
  return redirect(authUrl);
}