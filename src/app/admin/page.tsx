import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { 
  Users, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign
} from "lucide-react"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has admin role
  if (!session.user?.role || !['admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  // Fetch dashboard statistics
  const [stats, recentPayments, pendingPayments] = await Promise.all([
    // Overall statistics
    Promise.all([
      prisma.user.count(),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'APPROVED' } }),
      prisma.payment.count({ where: { status: 'REJECTED' } }),
      prisma.program.count({ where: { isActive: true } }),
      prisma.payment.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true }
      })
    ]),
    // Recent payments (last 5)
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    }),
    // Pending payments requiring attention
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })
  ])

  const [
    totalUsers,
    totalPayments,
    pendingPaymentsCount,
    approvedPayments,
    rejectedPayments,
    activePrograms,
    totalRevenue
  ] = stats

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-black text-white space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-300">Manage users, payments, and system settings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-xs text-gray-300">Registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(Number(totalRevenue._sum.amount) || 0)}
            </div>
            <p className="text-xs text-gray-300">From approved payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{pendingPaymentsCount}</div>
            <p className="text-xs text-gray-300">Require review</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Programs</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activePrograms}</div>
            <p className="text-xs text-gray-300">Available programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">Payment Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Total Payments</span>
              <span className="font-semibold text-white">{totalPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">Approved</span>
              <span className="font-semibold text-green-400">{approvedPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-400">Pending</span>
              <span className="font-semibold text-orange-400">{pendingPaymentsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-400">Rejected</span>
              <span className="font-semibold text-red-400">{rejectedPayments}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/payments?status=pending">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" variant="default">
                <CreditCard className="h-4 w-4 mr-2" />
                Review Pending Payments
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full border-red-500/30 text-red-400 hover:bg-red-600/20" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/programs">
              <Button className="w-full border-red-500/30 text-red-400 hover:bg-red-600/20" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Manage Programs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Active Programs</span>
              <span className="font-semibold text-white">{activePrograms}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Platform Status</span>
              <Badge className="bg-green-600 text-white" variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Table */}
      {pendingPayments.length > 0 && (
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-white">Pending Payments Requiring Attention</CardTitle>
             <CardDescription className="text-gray-300">
               {pendingPayments.length} {pendingPayments.length === 1 ? 'payment waiting for review' : 'payments waiting for review'}
             </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-800/30 border border-red-500/20 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {payment.user.firstName || payment.user.username || 'Unknown User'}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {payment.program.name} • {formatCurrency(Number(payment.amount))}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/admin/payments/${payment.id}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {pendingPayments.length >= 10 && (
              <div className="mt-4 text-center">
                <Link href="/admin/payments?status=pending">
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-600/20">
                    View All Pending Payments
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white">Recent Payment Activity</CardTitle>
          <CardDescription className="text-gray-300">Latest payment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-800/30 border border-red-500/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">
                      {payment.user.firstName || payment.user.username || 'Unknown User'}
                    </span>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="text-sm text-gray-300">
                    {payment.program.name} • {formatCurrency(Number(payment.amount))}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Link href={`/admin/payments/${payment.id}`}>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-600/20">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}