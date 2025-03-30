// app/api/auth/callback/route.ts
import { getTokens } from '@/lib/services/aps';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return new Response('Authorization code is missing', { status: 400 });
  }
  
  try {
    const tokens = await getTokens(code);
    
    const cookieStore = await cookies();
    cookieStore.set('public_token', tokens.public_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });
    
    cookieStore.set('internal_token', tokens.internal_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });
    
    cookieStore.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    cookieStore.set('expires_at', tokens.expires_at.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });
    

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error getting tokens:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}