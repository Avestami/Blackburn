import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/auth/sign-out-button"
import Link from "next/link"
import { Shield, Users, CreditCard, Package, Home, BarChart3, Wallet } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has admin role
  if (!session.user?.role || !['admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-red-500/30 bg-black/95 backdrop-blur-xl shadow-2xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">BlackBurn Fitness Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Shield className="h-4 w-4 text-red-400" />
              <span className="text-xs font-medium text-red-400 uppercase tracking-wide">Admin Mode</span>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-400">
                <Home className="h-4 w-4 mr-2" />
                Exit Admin Mode
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {session.user?.name || session.user?.email || 'Admin'}
              </span>
              <SignOutButton variant="outline" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 min-h-screen bg-black/90 border-r border-red-500/30 shadow-xl">
          <nav className="p-4 space-y-3">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25">
                <BarChart3 className="h-4 w-4 mr-3" />
                Overview
              </Button>
            </Link>
            <Link href="/admin/payments">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25">
                <CreditCard className="h-4 w-4 mr-3" />
                Payments
              </Button>
            </Link>
            <Link href="/admin/wallet-transactions">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25">
                <Wallet className="h-4 w-4 mr-3" />
                Wallet Transactions
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25">
                <Users className="h-4 w-4 mr-3" />
                Users
              </Button>
            </Link>
            <Link href="/admin/programs">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25">
                <Package className="h-4 w-4 mr-3" />
                Programs
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}