import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#060A08',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Hummly — The Bollywood Music Guessing Game',
  description:
    'Listen to short mystery snippets and guess the Bollywood song in stages. 500+ curated tracks from 2005 to 2026.',
  keywords: [
    'Hummly',
    'Bollywood music trivia',
    'Guess the song Hindi',
    'Heardle Bollywood',
    'Indian music quiz',
    'Arijit Singh songs game',
  ],
  authors: [{ name: 'Hummly Team' }],
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${jakarta.variable}`}>
      <body className="bg-[#060A08] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-[#00E575] selection:text-black">
        <Navbar />
        <main className="flex-1 relative z-10 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
