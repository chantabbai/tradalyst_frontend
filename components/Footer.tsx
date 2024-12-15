import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} TradePro Journal. All rights reserved.
            </p>
          </div>
          <nav className="flex space-x-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-primary"
              prefetch={true}
            >
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}