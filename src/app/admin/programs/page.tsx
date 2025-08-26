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
import { Users, DollarSign, Calendar, Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    subscriptions: number;
  };
}

interface ProgramStats {
  total: number;
  active: number;
  inactive: number;
  totalSubscriptions: number;
  totalRevenue: number;
}

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
  };
  createdAt: string;
}

export default function AdminProgramsPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<ProgramStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalSubscriptions: 0,
    totalRevenue: 0
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    discount: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Fetch programs data
  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/programs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch programs');
      
      const data = await response.json();
      setPrograms(data.programs || []);
      
      // Calculate stats
      const totalPrograms = data.programs?.length || 0;
      const activePrograms = data.programs?.filter((p: Program) => p.isActive).length || 0;
      const totalSubs = data.programs?.reduce((sum: number, p: Program) => sum + p._count.subscriptions, 0) || 0;
      const totalRev = data.programs?.reduce((sum: number, p: Program) => sum + (p.price * p._count.subscriptions), 0) || 0;
      
      setStats({
        total: totalPrograms,
        active: activePrograms,
        inactive: totalPrograms - activePrograms,
        totalSubscriptions: totalSubs,
        totalRevenue: totalRev
      });
      
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedFetchPrograms'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  // Fetch program subscriptions
  const fetchProgramSubscriptions = async (programId: string) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}/subscriptions`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setShowSubscriptions(true);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedFetchSubscriptions'),
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPrograms();
    }
  }, [session, fetchPrograms]);

  // Toggle program status
  const toggleProgramStatus = async (programId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update program status');

      toast({
        title: t('admin.success'),
        description: !currentStatus ? t('admin.programActivatedSuccess') : t('admin.programDeactivatedSuccess')
      });

      await fetchPrograms();
    } catch (error) {
      console.error('Error updating program status:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedUpdateProgramStatus'),
        variant: 'destructive'
      });
    }
  };

  // Add new program
  const handleAddProgram = async () => {
    try {
      setActionLoading('add');
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration)
        })
      });

      if (!response.ok) throw new Error('Failed to add program');

      await fetchPrograms();
      setShowAddDialog(false);
      setFormData({ name: '', description: '', price: '', duration: '', discount: '' });
      
      toast({
        title: t('admin.success'),
        description: t('admin.programAddedSuccess')
      });
    } catch (error) {
      console.error('Error adding program:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedAddProgram'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Edit program
  const handleEditProgram = async () => {
    if (!selectedProgram) return;
    
    try {
      setActionLoading('edit');
      const response = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration)
        })
      });

      if (!response.ok) throw new Error('Failed to edit program');

      await fetchPrograms();
      setShowEditDialog(false);
      setSelectedProgram(null);
      setFormData({ name: '', description: '', price: '', duration: '', discount: '' });
      
      toast({
        title: t('admin.success'),
        description: t('admin.programUpdatedSuccess')
      });
    } catch (error) {
      console.error('Error editing program:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedEditProgram'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete program
  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;
    
    try {
      setActionLoading('delete');
      const response = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete program');

      await fetchPrograms();
      setShowDeleteDialog(false);
      setSelectedProgram(null);
      
      toast({
        title: t('admin.success'),
        description: t('admin.programDeletedSuccess')
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedDeleteProgram'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Apply discount
  const handleApplyDiscount = async () => {
    if (!selectedProgram) return;
    
    try {
      setActionLoading('discount');
      const discountPercent = parseFloat(formData.discount);
      const originalPrice = selectedProgram.originalPrice || selectedProgram.price;
      const discountedPrice = originalPrice * (1 - discountPercent / 100);
      
      const response = await fetch(`/api/admin/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discountedPrice: discountedPrice,
          discountPercentage: discountPercent
        })
      });

      if (!response.ok) throw new Error('Failed to apply discount');

      await fetchPrograms();
      setShowDiscountDialog(false);
      setSelectedProgram(null);
      setFormData({ name: '', description: '', price: '', duration: '', discount: '' });
      
      toast({
        title: t('admin.success'),
        description: `Discount of ${discountPercent}% applied successfully`
      });
    } catch (error) {
      console.error('Error applying discount:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedApplyDiscount'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Remove discount
  const handleRemoveDiscount = async (program: Program) => {
    if (!program.originalPrice) return;
    
    try {
      setActionLoading('removeDiscount');
      
      const response = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: program.originalPrice
        })
      });

      if (!response.ok) throw new Error('Failed to remove discount');

      await fetchPrograms();
      
      toast({
        title: t('admin.success'),
        description: 'Discount removed successfully'
      });
    } catch (error) {
      console.error('Error removing discount:', error);
      toast({
        title: t('admin.error'),
        description: 'Failed to remove discount',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="text-green-600 border-green-600">{t('admin.active')}</Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">{t('admin.inactive')}</Badge>
    );
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="outline" className="text-green-600 border-green-600">{t('admin.active')}</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="text-red-600 border-red-600">{t('admin.expired')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">{t('admin.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h1 className="text-3xl font-bold text-white">{t('admin.programManagement')}</h1>
          <p className="text-gray-400">{t('admin.manageFitnessPrograms')}</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-red-500"
        >
          <Plus className="h-4 w-4" />
          {t('admin.addProgram')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">{t('admin.totalPrograms')}</CardTitle>
            <Calendar className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-400">
              {stats.active} {t('admin.active').toLowerCase()}, {stats.inactive} {t('admin.inactive').toLowerCase()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">{t('admin.activePrograms')}</CardTitle>
            <Calendar className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {t('admin.ofTotal')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">{t('admin.totalSubscriptions')}</CardTitle>
            <Users className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSubscriptions}</div>
            <p className="text-xs text-gray-400">
              {t('admin.acrossAllPrograms')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">{t('admin.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-400">
              {t('admin.fromProgramSubscriptions')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Filter className="h-5 w-5" />
            {t('admin.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.searchProgramsPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black border-red-500/30 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-black border-red-500/30 text-white">
                  <SelectValue placeholder={t('admin.filterByStatus')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-red-500/30">
                  <SelectItem value="all" className="text-white hover:bg-red-500/20">{t('admin.allPrograms')}</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-red-500/20">{t('admin.activeOnly')}</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-red-500/20">{t('admin.inactiveOnly')}</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">{t('admin.programs')}</CardTitle>
          <CardDescription className="text-gray-400">
            {programs.length} {t('admin.programsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/30">
                <TableHead className="text-red-400">{t('admin.program')}</TableHead>
                <TableHead className="text-red-400">{t('admin.price')}</TableHead>
                <TableHead className="text-red-400">{t('admin.duration')}</TableHead>
                <TableHead className="text-red-400">{t('admin.subscriptions')}</TableHead>
                <TableHead className="text-red-400">{t('admin.status')}</TableHead>
                <TableHead className="text-red-400">{t('admin.created')}</TableHead>
                <TableHead className="text-red-400">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id} className="border-red-500/30 hover:bg-red-500/10">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{program.name}</div>
                      <div className="text-sm text-gray-400 line-clamp-2">
                        {program.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    <div className="flex flex-col">
                      {program.originalPrice && program.discountPercentage ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">{formatCurrency(program.price)}</span>
                            <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                              -{program.discountPercentage}%
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(program.originalPrice)}
                          </span>
                        </>
                      ) : (
                        <span>{formatCurrency(program.price)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    {program.duration} days
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-red-400 hover:text-red-300"
                      onClick={() => {
                        setSelectedProgram(program);
                        fetchProgramSubscriptions(program.id);
                      }}
                    >
                      {program._count.subscriptions}
                    </Button>
                  </TableCell>
                  <TableCell>{getStatusBadge(program.isActive)}</TableCell>
                  <TableCell className="text-sm text-white">
                    {formatDate(program.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProgram(program)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black border-red-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-white">{t('admin.programDetails')}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              {t('admin.viewAndManageProgramInfo')}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedProgram && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.name')}</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedProgram.name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.price')}</label>
                                  <p className="text-sm text-gray-300">
                                    {formatCurrency(selectedProgram.price)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.duration')}</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedProgram.duration} days
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.status')}</label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedProgram.isActive)}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-red-400">{t('admin.description')}</label>
                                <p className="text-sm text-gray-300 mt-1">
                                  {selectedProgram.description}
                                </p>
                              </div>
                              
                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={() => toggleProgramStatus(selectedProgram.id, selectedProgram.isActive)}
                                  className={selectedProgram.isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                                >
                                  {selectedProgram.isActive ? t('admin.deactivate') : t('admin.activate')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setFormData({
                                      name: selectedProgram.name,
                                      description: selectedProgram.description,
                                      price: selectedProgram.price.toString(),
                                      duration: selectedProgram.duration.toString(),
                                      discount: ''
                                    });
                                    setShowEditDialog(true);
                                  }}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('admin.edit')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProgramStatus(program.id, program.isActive)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      >
                        {program.isActive ? t('admin.deactivate') : t('admin.activate')}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedProgram(program);
                          setFormData({
                            name: program.name,
                            description: program.description,
                            price: program.price.toString(),
                            duration: program.duration.toString(),
                            discount: ''
                          });
                          setShowEditDialog(true);
                        }}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {program.originalPrice && program.discountPercentage && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRemoveDiscount(program)}
                          disabled={actionLoading === 'removeDiscount'}
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                          title="Remove Discount"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
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
                {t('admin.page')} {currentPage} {t('admin.of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  {t('admin.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  {t('admin.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Program Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{t('admin.addProgram')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('admin.createNewFitnessProgram')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-red-400">{t('admin.name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-black border-red-500/30 text-white"
                placeholder={t('admin.enterProgramName')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-red-400">{t('admin.description')}</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black border-red-500/30 text-white"
                placeholder={t('admin.enterProgramDescription')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-red-400">{t('admin.price')}</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-black border-red-500/30 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-red-400">{t('admin.duration')}</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-black border-red-500/30 text-white"
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddProgram}
                disabled={actionLoading === 'add'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading === 'add' ? t('admin.adding') : t('admin.addProgram')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                {t('admin.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Program Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{t('admin.editProgram')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('admin.updateProgramDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-red-400">{t('admin.name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-black border-red-500/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-red-400">{t('admin.description')}</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-black border-red-500/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-red-400">{t('admin.price')}</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-black border-red-500/30 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-red-400">{t('admin.duration')}</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-black border-red-500/30 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleEditProgram}
                disabled={actionLoading === 'edit'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading === 'edit' ? t('admin.updating') : t('admin.updateProgram')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProgram(null);
                  setShowDiscountDialog(true);
                }}
                className="border-green-500/30 text-green-400 hover:bg-green-500/20"
              >
                {t('admin.applyDiscount')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setShowDeleteDialog(true);
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('admin.delete')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
              >
                {t('admin.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{t('admin.deleteProgram')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('admin.confirmDeleteProgram')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleDeleteProgram}
              disabled={actionLoading === 'delete'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading === 'delete' ? t('admin.deleting') : t('admin.delete')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
            >
              {t('admin.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-md bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{t('admin.applyDiscount')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('admin.enterDiscountPercentage')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-red-400">{t('admin.discountPercentage')}</label>
              <Input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="bg-black border-red-500/30 text-white"
                placeholder="10"
                min="0"
                max="100"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApplyDiscount}
                disabled={actionLoading === 'discount'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading === 'discount' ? t('admin.applying') : t('admin.applyDiscount')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDiscountDialog(false)}
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/20"
              >
                {t('admin.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Program Subscriptions Dialog */}
      <Dialog open={showSubscriptions} onOpenChange={setShowSubscriptions}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProgram?.name} - {t('admin.subscriptions')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.manageProgramSubscriptions')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.user')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.startDate')}</TableHead>
                  <TableHead>{t('admin.endDate')}</TableHead>
                  <TableHead>{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subscription.user.name || subscription.user.telegramUsername || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSubscriptionStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(subscription.startDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(subscription.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}