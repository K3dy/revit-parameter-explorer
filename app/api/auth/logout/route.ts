// app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = await cookies();
  
  cookieStore.delete('public_token');
  cookieStore.delete('internal_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('expires_at');
  
  return redirect('/');
}