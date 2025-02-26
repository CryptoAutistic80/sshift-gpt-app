import 'tailwindcss/tailwind.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '../src/components/ui/toaster';
import { ThemeProvider } from '../src/context/ThemeProvider';
import { WalletProvider } from '../src/context/WalletProvider';
import { BackendProvider } from '../src/context/BackendProvider';
import { AppManagementProvider } from '../src/context/AppManagment';
import { AbiProvider } from '../src/context/AbiProvider';
import { AuthProvider } from '../src/context/AuthProvider';
import { AgentProvider } from '../src/context/AgentProvider';
import { GoogleAnalytics } from '@next/third-parties/google'
import { WebVitals } from '../src/components/ui/web-vitals';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SShift GPT',
  description: 'New AI generation platform base in Aptos blockchain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <AuthProvider>
              <BackendProvider>
                <AbiProvider>
                  <AppManagementProvider>
                    <AgentProvider>
                      <WebVitals />
                      {children}
                    </AgentProvider>
                  </AppManagementProvider>
                </AbiProvider>
              </BackendProvider>
            </AuthProvider>
          </WalletProvider>
        </ThemeProvider>
        <Toaster />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
      </body>
    </html>
  );
}
