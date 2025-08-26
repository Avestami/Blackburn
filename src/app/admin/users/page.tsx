'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Users, UserCheck, UserX, Search, Filter, Eye, Edit, Ban, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
  telegramId?: string;
  telegramUsername?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    fitnessLevel?: string;
    goals?: string[];
  };
  _count: {
    payments: number;
    subscriptions: number;
    workouts: number;
  };
  wallet?: {
    balance: number;
  };
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  totalPayments: number;
  totalSubscriptions: number;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  // const { t } = useLanguage(); // TODO: Add translations
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    totalPayments: 0,
    totalSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check authentication and admin role
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      redirect('/auth/signin');
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Calculate stats
      const totalUsers = data.users?.length || 0;
      const activeUsers = data.users?.filter((u: User) => u.isActive).length || 0;
      const adminUsers = data.users?.filter((u: User) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 0;
      const totalPayments = data.users?.reduce((sum: number, u: User) => sum + u._count.payments, 0) || 0;
      const totalSubs = data.users?.reduce((sum: number, u: User) => sum + u._count.subscriptions, 0) || 0;
      
      setStats({
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        totalPayments,
        totalSubscriptions: totalSubs
      });
      
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  // Toggle user status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update user status');

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: newRole
        })
      });

      if (!response.ok) throw new Error('Failed to update user role');

      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });

      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Admin</Badge>;
      case 'USER':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-300">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-400">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.admins}</div>
            <p className="text-xs text-gray-400">
              Admin and Super Admin users
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Payments</CardTitle>
            <UserX className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPayments}</div>
            <p className="text-xs text-gray-400">
              {stats.totalSubscriptions} subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5 text-red-400" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/30 border-red-500/30 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48 bg-black/30 border-red-500/30 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-red-500/30">
                <SelectItem value="all" className="text-white hover:bg-red-500/20">All Roles</SelectItem>
                <SelectItem value="USER" className="text-white hover:bg-red-500/20">Users</SelectItem>
                <SelectItem value="ADMIN" className="text-white hover:bg-red-500/20">Admins</SelectItem>
                <SelectItem value="SUPER_ADMIN" className="text-white hover:bg-red-500/20">Super Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-black/30 border-red-500/30 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-red-500/30">
                <SelectItem value="all" className="text-white hover:bg-red-500/20">All Status</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-red-500/20">Active</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-red-500/20">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white">Users</CardTitle>
          <CardDescription className="text-gray-400">
            {users.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/30">
                <TableHead className="text-red-400">User</TableHead>
                <TableHead className="text-red-400">Role</TableHead>
                <TableHead className="text-red-400">Status</TableHead>
                <TableHead className="text-red-400">Payments</TableHead>
                <TableHead className="text-red-400">Subscriptions</TableHead>
                <TableHead className="text-red-400">Workouts</TableHead>
                <TableHead className="text-red-400">Joined</TableHead>
                <TableHead className="text-red-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-red-500/30 hover:bg-red-500/10">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {user.name || user.telegramUsername || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.email || `@${user.telegramUsername}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                  <TableCell className="text-center text-white">{user._count.payments}</TableCell>
                  <TableCell className="text-center text-white">{user._count.subscriptions}</TableCell>
                  <TableCell className="text-center text-white">{user._count.workouts}</TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black border-red-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-white">User Details</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              View and manage user information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-red-400">Name</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedUser.name || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">Email</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedUser.email || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">Telegram</label>
                                  <p className="text-sm text-gray-300">
                                    @{selectedUser.telegramUsername || 'Not connected'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">Role</label>
                                  <div className="mt-1">
                                    {getRoleBadge(selectedUser.role)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">Status</label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedUser.isActive)}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">Wallet Balance</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedUser.wallet ? formatCurrency(selectedUser.wallet.balance) : '$0.00'}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedUser.profile && (
                                <div>
                                  <label className="text-sm font-medium text-red-400">Profile Information</label>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-300">
                                    {selectedUser.profile.age && (
                                      <p>Age: {selectedUser.profile.age}</p>
                                    )}
                                    {selectedUser.profile.gender && (
                                      <p>Gender: {selectedUser.profile.gender}</p>
                                    )}
                                    {selectedUser.profile.height && (
                                      <p>Height: {selectedUser.profile.height} cm</p>
                                    )}
                                    {selectedUser.profile.weight && (
                                      <p>Weight: {selectedUser.profile.weight} kg</p>
                                    )}
                                    {selectedUser.profile.fitnessLevel && (
                                      <p>Fitness Level: {selectedUser.profile.fitnessLevel}</p>
                                    )}
                                  </div>
                                  {selectedUser.profile.goals && selectedUser.profile.goals.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-red-400">Goals:</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedUser.profile.goals.map((goal, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                                            {goal}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={() => toggleUserStatus(selectedUser.id, selectedUser.isActive)}
                                  disabled={actionLoading === selectedUser.id}
                                  variant={selectedUser.isActive ? "destructive" : "default"}
                                  className={`flex items-center gap-2 ${selectedUser.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                >
                                  {selectedUser.isActive ? (
                                    <><Ban className="h-4 w-4" /> Deactivate</>
                                  ) : (
                                    <><CheckCircle className="h-4 w-4" /> Activate</>
                                  )}
                                </Button>
                                
                                {session?.user?.role === 'SUPER_ADMIN' && selectedUser.role !== 'SUPER_ADMIN' && (
                                  <Select
                                    value={selectedUser.role}
                                    onValueChange={(value) => updateUserRole(selectedUser.id, value)}
                                  >
                                    <SelectTrigger className="w-32 bg-black/30 border-red-500/30 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-red-500/30">
                                      <SelectItem value="USER" className="text-white hover:bg-red-500/20">User</SelectItem>
                                      <SelectItem value="ADMIN" className="text-white hover:bg-red-500/20">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        disabled={actionLoading === user.id}
                        className={`border-red-500/30 hover:bg-red-500/20 ${user.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        {user.isActive ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}