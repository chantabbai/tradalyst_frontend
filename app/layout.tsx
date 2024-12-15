import './globals.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })
const currentYear = new Date().getFullYear();
export const metadata: Metadata = {
  title: 'Tradalyst',
  description: 'One stop solution for all your trading needs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Toaster />
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1">
                {children}
              </div>
              <footer className="py-6 px-4 border-t">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    © {currentYear} Tradalyst. All rights reserved.
                  </div>
                  <div className="flex gap-4 text-sm">
                    <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                      Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-muted-foreground hover:text-primary">
                      Terms of Service
                    </Link>
                    <Link href="/contact" className="text-muted-foreground hover:text-primary">
                      Contact
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
