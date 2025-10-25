import type {Metadata} from 'next';
import {SidebarProvider} from '@/components/ui/sidebar';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lifeline',
  description:
    'An integrated framework for users to align their daily actions with their long-term goals, values, and desired mindsets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
