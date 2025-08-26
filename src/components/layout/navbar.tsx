'use client'

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun, Search, Menu, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import UserSearch from "@/components/search/user-search"

export function Navbar() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en')
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="border-b border-red-500/30 bg-black/95 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={session ? ((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN' ? "/admin" : "/dashboard") : "/"} className="text-2xl font-bold text-white hover:text-red-400 transition-all duration-300 hover:scale-105">
            <span className="bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
              BlackBurn Fitness
            </span>
          </Link>

          {/* Navigation Links */}
          {session && (
            <div className="hidden md:flex items-center space-x-8">
              {/* Admin users see only admin-specific links */}
              {(session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN' ? (
                <>
                  <Link href="/admin" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    Admin Panel
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/profile" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.profile')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/settings" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.settings')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </>
              ) : (
                /* Regular users see all standard links */
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.dashboard')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/profile" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.profile')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/programs" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.programs')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/weight" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.weightTracking')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/wallet" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.wallet')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/referrals" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.referrals')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/friends" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.friends')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link href="/settings" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
                    {t('nav.settings')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Button - only show when logged in */}
            {session && (
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-red-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">{t('nav.findUsers')}</DialogTitle>
                  </DialogHeader>
                  <UserSearch />
                </DialogContent>
              </Dialog>
            )}
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
            >
              <span className="text-xs font-medium">
                {language === 'en' ? 'FA' : 'EN'}
              </span>
            </button>

            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300 hidden sm:block">
                  {t('nav.welcome')}, {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                </span>
                <SignOutButton variant="outline" size="sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-red-500/10">
                    {t('auth.signIn')}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    {t('auth.signup')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {session && isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-red-500/30 shadow-2xl z-40">
          <div className="container mx-auto px-4 py-6">
            {/* Mobile Search */}
            <div className="mb-6">
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300"
                    onClick={closeMobileMenu}
                  >
                    <Search className="h-4 w-4 mr-3" />
                    {t('nav.findUsers')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-red-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">{t('nav.findUsers')}</DialogTitle>
                  </DialogHeader>
                  <UserSearch />
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-3 mb-6">
              {(session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN' ? (
                <>
                  <Link href="/admin" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      Admin Panel
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.profile')}
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.settings')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.dashboard')}
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.profile')}
                    </Button>
                  </Link>
                  <Link href="/programs" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.programs')}
                    </Button>
                  </Link>
                  <Link href="/weight" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.weightTracking')}
                    </Button>
                  </Link>
                  <Link href="/wallet" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.wallet')}
                    </Button>
                  </Link>
                  <Link href="/referrals" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.referrals')}
                    </Button>
                  </Link>
                  <Link href="/friends" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.friends')}
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300">
                      {t('nav.settings')}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-red-500/30">
              <div className="flex items-center gap-3">
                {/* Mobile Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>

                {/* Mobile Language Toggle */}
                <button 
                  onClick={toggleLanguage}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20"
                >
                  <span className="text-xs font-medium">
                    {language === 'en' ? 'FA' : 'EN'}
                  </span>
                </button>
              </div>

              {/* Mobile User Info & Sign Out */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">
                  {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                </span>
                <SignOutButton variant="outline" size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu for Non-Authenticated Users */}
      {!session && isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-red-500/30 shadow-2xl z-40">
          <div className="container mx-auto px-4 py-6">
            {/* Mobile Auth Buttons */}
            <div className="space-y-3 mb-6">
              <Link href="/auth/signin" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-center text-gray-300 hover:text-white hover:bg-red-500/10">
                  {t('auth.signIn')}
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={closeMobileMenu}>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {t('auth.signup')}
                </Button>
              </Link>
            </div>

            {/* Mobile Controls for Non-Authenticated Users */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-red-500/30">
              {/* Mobile Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* Mobile Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-gray-300 hover:text-white hover:bg-red-500/20"
              >
                <span className="text-xs font-medium">
                  {language === 'en' ? 'FA' : 'EN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}