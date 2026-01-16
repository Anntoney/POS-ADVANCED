import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { VersionCheck } from '@/app/version-check'
import Script from 'next/script'
import '@/lib/utils/error-handler'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <VersionCheck />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
        <Script
          id="remove-extension-attributes"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove browser extension injected attributes that cause hydration errors
                const removeExtensionAttributes = () => {
                  const attributesToRemove = ['bis_skin_checked', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
                  document.querySelectorAll('*').forEach((el) => {
                    attributesToRemove.forEach((attr) => {
                      if (el.hasAttribute(attr)) {
                        el.removeAttribute(attr);
                      }
                    });
                  });
                };
                
                // Run immediately
                removeExtensionAttributes();
                
                // Run after DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeExtensionAttributes);
                }
                
                // Run after a short delay to catch late injections
                setTimeout(removeExtensionAttributes, 100);
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
