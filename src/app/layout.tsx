import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Heritage Restaurant | Fine Indian Cuisine',
  description: 'Crafted with Tradition · Fine Indian Cuisine, digital ordering, and daily specials.',
  keywords: ['Indian Restaurant', 'Fine Dining', 'Heritage', 'Curry', 'Biryani', 'Tandoori'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-cream text-ink">
        <TRPCProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TRPCProvider>
      </body>
    </html>
  );
}
