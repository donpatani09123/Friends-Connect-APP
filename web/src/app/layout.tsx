import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Friends & Events Hub | Connect, Discover, Meet',
  description: 'Random Friends Audio Matchmaking, Local Events Hosting & Celebrity Interactions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
