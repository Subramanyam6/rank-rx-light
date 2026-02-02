import type { Metadata } from 'next';
import { Architects_Daughter } from 'next/font/google';
import './globals.css';

const architectsDaughter = Architects_Daughter({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'RankRx Light - USMLE Application Ranking System',
  description: 'AI-powered analysis and ranking of USMLE residency applications using advanced PDF parsing technology.',
  keywords: ['USMLE', 'residency', 'application', 'ranking', 'medical', 'analysis'],
  authors: [{ name: 'RankRx Light' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={architectsDaughter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
