"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-provider"
import { BarChart2, BookOpen, DollarSign, Settings, LogOut, TrendingUp, Menu, X, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Image from 'next/image'

const primaryNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/stock-analysis', label: 'Stock Analysis', icon: TrendingUp },
]

const LogoPlaceholder = () => (
  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center">
    <span className="text-primary-foreground font-bold text-xl md:text-2xl">T</span>
  </div>
)

export default function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  }

  const AvatarButton = ({ email, className }: { email?: string, className?: string }) => {
    const initial = email ? getInitials(email) : '';
    const colors = {
      'A': 'bg-red-100 text-red-600',
      'B': 'bg-blue-100 text-blue-600',
      'C': 'bg-green-100 text-green-600',
      'D': 'bg-purple-100 text-purple-600',
      'E': 'bg-yellow-100 text-yellow-600',
      'F': 'bg-pink-100 text-pink-600',
      'G': 'bg-indigo-100 text-indigo-600',
      'H': 'bg-orange-100 text-orange-600',
      'I': 'bg-teal-100 text-teal-600',
      'J': 'bg-cyan-100 text-cyan-600',
    };
    
    const colorKey = initial as keyof typeof colors;
    const colorClass = colors[colorKey] || 'bg-gray-100 text-gray-600';

    return (
      <div className={cn(
        "flex items-center gap-2 p-1",
        className
      )}>
        <div className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full ring-2 ring-background shadow-sm",
          colorClass
        )}>
          {email ? (
            <span className="text-sm font-semibold">
              {initial}
            </span>
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <nav className="bg-background shadow-sm">
        <div className="flex justify-between items-center p-4">
          <Link href="/" className="flex items-center space-x-2">
            <LogoPlaceholder />
            <span className="text-2xl font-bold text-primary">Tradalyst</span>
          </Link>
          <div className="flex items-center space-x-4">
              
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background shadow-sm">
      <div className="hidden md:flex justify-between items-center p-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <LogoPlaceholder />
            <span className="text-2xl font-bold text-primary">Tradalyst</span>
          </Link>
          {primaryNavItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                className="flex items-center"
                asChild
              >
                <span>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="hover:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <AvatarButton email={user?.email} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <div className="px-2 py-3 border-b">
                <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </DropdownMenuItem>
                <div className="px-2 py-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Theme</div>
                  <ThemeToggle />
                </div>
                <DropdownMenuItem>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-500" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex justify-between items-center p-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <LogoPlaceholder />
            <span className="text-2xl font-bold text-primary">Tradalyst</span>
          </Link>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="p-4 space-y-2 border-t bg-background">
            {primaryNavItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setIsMenuOpen(false)}
                  asChild
                >
                  <span>
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </span>
                </Button>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start hover:bg-transparent p-0">
                  <AvatarButton email={user?.email} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <div className="px-2 py-3 border-b">
                  <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full">
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </DropdownMenuItem>
                  <div className="px-2 py-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Theme</div>
                    <ThemeToggle />
                  </div>
                  <DropdownMenuItem>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-500" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  )
}
