import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vibzz | Real voices. Real connections.',
  description: 'Vibzz lets you meet someone new in a voice chat, find events near you, and talk directly with the creators you follow.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
