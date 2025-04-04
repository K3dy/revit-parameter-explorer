// app/layout.tsx
import './globals.css'; // Import global styles for the application
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'; // Wraps the app with global context providers

// Load the Inter font from Google Fonts with the specified subsets
const inter = Inter({ subsets: ['latin'] });

// Define metadata for SEO and social sharing using Next.js Metadata API
export const metadata: Metadata = {
  title: 'Revit Parameters Browser',
  description: 'Browse and view content from Revit models',
};

/**
 * RootLayout Component
 * Acts as the root layout for the application, setting up the HTML structure
 * and wrapping the application with global providers.
 * 
 * Note: If you require additional error handling, consider implementing an error boundary
 * at a higher level to catch and display errors gracefully.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Providers component wraps the children with context providers (e.g., theme, auth) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
