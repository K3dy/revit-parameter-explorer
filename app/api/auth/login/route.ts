// app/api/auth/login/route.ts
import { getAuthorizationUrl } from '@/lib/services/aps';
import { redirect } from 'next/navigation';

/**
 * GET - Handles the login route by redirecting the user to the APS authorization URL.
 *
 * This function obtains the authorization URL from the APS service and redirects the client
 * to that URL to begin the OAuth login process.
 *
 * @returns A redirect response to the APS login page.
 */
export async function GET() {
  // Generate the APS authorization URL for user login.
  const authUrl = getAuthorizationUrl();
  
  // Redirect the user to the authorization URL.
  // This redirect function internally throws a special NEXT_REDIRECT error, which is expected.
  return redirect(authUrl);
}
