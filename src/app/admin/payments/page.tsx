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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Eye, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    telegramUsername?: string;
  };
  program: {
    id: string;
    name: string;
    price: number;
  };
  adminNotes?: string;
}

interface PaymentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
  pendingRevenue: number;
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    amount: 0,
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
    adminNotes: '',
    receiptUrl: ''
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedPaymentForAction, setSelectedPaymentForAction] = useState<Payment | null>(null);

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

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const data = await response.json();
      setPayments(data.payments);
      setStats({
        total: data.summary.total,
        pending: data.summary.pending,
        approved: data.summary.approved,
        rejected: data.summary.rejected,
        totalRevenue: data.summary.totalAmount,
        pendingRevenue: data.summary.pendingAmount
      });
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: t('admin.error'),
        description: t('admin.failedFetchPayments'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    if (session?.user) {
      fetchPayments();
    }
  }, [session, fetchPayments]);

  // Handle payment action (approve/reject)
  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(paymentId);
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          adminNotes
        })
      });

      if (!response.ok) throw new Error(`Failed to ${action} payment`);

      toast({
        title: t('admin.success'),
        description: action === 'approve' ? t('admin.paymentApprovedSuccess') : t('admin.paymentRejectedSuccess')
      });

      // Refresh payments list
      await fetchPayments();
      setSelectedPayment(null);
      setAdminNotes('');
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      toast({
        title: t('admin.error'),
        description: action === 'approve' ? t('admin.failedApprovePayment') : t('admin.failedRejectPayment'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export payments
  const handleExportPayments = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        format: 'csv'
      });
      
      const response = await fetch(`/api/admin/payments/export?${params}`);
      if (!response.ok) throw new Error('Failed to export payments');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('admin.success'),
        description: 'Payments exported successfully'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('admin.error'),
        description: 'Failed to export payments',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Handle edit payment
  const handleEditPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setActionLoading(selectedPayment.id);
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) throw new Error('Failed to update payment');

      toast({
        title: t('admin.success'),
        description: 'Payment updated successfully'
      });

      await fetchPayments();
      setEditDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Edit payment error:', error);
      toast({
        title: t('admin.error'),
        description: 'Failed to update payment',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete payment
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setActionLoading(selectedPayment.id);
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete payment');

      toast({
        title: t('admin.success'),
        description: 'Payment removed successfully'
      });

      await fetchPayments();
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Delete payment error:', error);
      toast({
        title: t('admin.error'),
        description: 'Failed to remove payment',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditFormData({
      amount: payment.amount,
      status: payment.status,
      adminNotes: payment.adminNotes || '',
      receiptUrl: payment.receiptUrl || ''
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setSelectedPaymentForAction(payment);
    setDeleteDialogOpen(true);
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="min-h-screen bg-black text-white container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('admin.paymentManagement')}</h1>
          <p className="text-gray-300">{t('admin.reviewManagePayments')}</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-red-500/30 text-red-400 hover:bg-red-600/20"
          onClick={handleExportPayments}
          disabled={exportLoading}
        >
          <Download className="h-4 w-4" />
          {exportLoading ? 'Exporting...' : t('admin.export')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t('admin.totalPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.total}</div>
            <p className="text-xs text-gray-400">
              {t('admin.revenue')}: {formatCurrency(stats.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t('admin.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <p className="text-xs text-gray-400">
              {t('admin.value')}: {formatCurrency(stats.pendingRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t('admin.approved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% {t('admin.approvalRate')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t('admin.rejected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <p className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% {t('admin.rejectionRate')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5 text-red-400" />
            {t('admin.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/30 border-red-500/30 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-black/30 border-red-500/30 text-white">
                <SelectValue placeholder={t('admin.filterByStatus')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-red-500/30">
                <SelectItem value="all" className="text-white hover:bg-red-600/20">{t('admin.allStatus')}</SelectItem>
                <SelectItem value="PENDING" className="text-white hover:bg-red-600/20">{t('admin.pending')}</SelectItem>
                <SelectItem value="APPROVED" className="text-white hover:bg-red-600/20">{t('admin.approved')}</SelectItem>
                <SelectItem value="REJECTED" className="text-white hover:bg-red-600/20">{t('admin.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-black/50 backdrop-blur-sm border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white">{t('admin.payments')}</CardTitle>
          <CardDescription className="text-gray-300">
            {payments.length} {t('admin.paymentsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/30">
                <TableHead className="text-red-400">{t('admin.user')}</TableHead>
                <TableHead className="text-red-400">{t('admin.program')}</TableHead>
                <TableHead className="text-red-400">{t('admin.amount')}</TableHead>
                <TableHead className="text-red-400">{t('admin.status')}</TableHead>
                <TableHead className="text-red-400">{t('admin.date')}</TableHead>
                <TableHead className="text-red-400">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className="border-red-500/20 hover:bg-red-600/10">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {payment.user.name || payment.user.telegramUsername || t('admin.unknown')}
                      </div>
                      <div className="text-sm text-gray-400">
                        {payment.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{payment.program.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatCurrency(payment.program.price)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-sm text-gray-300">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-400 hover:bg-red-600/20"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setAdminNotes(payment.adminNotes || '');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black border-red-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-white">{t('admin.paymentDetails')}</DialogTitle>
                            <DialogDescription className="text-gray-300">
                              {t('admin.reviewPaymentInfo')}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPayment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.user')}</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedPayment.user.name || selectedPayment.user.telegramUsername}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {selectedPayment.user.email}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.program')}</label>
                                  <p className="text-sm text-gray-300">
                                    {selectedPayment.program.name}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatCurrency(selectedPayment.program.price)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.amount')}</label>
                                  <p className="text-sm text-gray-300">
                                    {formatCurrency(selectedPayment.amount)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-red-400">{t('admin.status')}</label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedPayment.status)}
                                  </div>
                                </div>
                              </div>
                              
                              {selectedPayment.receiptUrl && (
                <div>
                  <label className="text-sm font-medium text-red-400">{t('admin.receipt')}</label>
                  <div className="mt-2 border border-red-500/30 rounded-lg p-4 bg-black/30">
                    <Image
                      src={selectedPayment.receiptUrl}
                      alt="Payment Receipt"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-red-400">{t('admin.adminNotes')}</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('admin.addNotesPlaceholder')}
                  className="mt-1 bg-black/30 border-red-500/30 text-white placeholder:text-gray-400"
                />
                              </div>
                              
                              {selectedPayment.status === 'PENDING' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handlePaymentAction(selectedPayment.id, 'approve')}
                    disabled={actionLoading === selectedPayment.id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {actionLoading === selectedPayment.id ? t('admin.approving') : t('admin.approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handlePaymentAction(selectedPayment.id, 'reject')}
                    disabled={actionLoading === selectedPayment.id}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="h-4 w-4" />
                    {actionLoading === selectedPayment.id ? t('admin.rejecting') : t('admin.reject')}
                  </Button>
                </div>
              )}
                            </div>
                          )}
                        </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(payment)}
                          className="border-red-500/30 text-red-400 hover:bg-red-600/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(payment)}
                          className="border-red-500/30 text-red-600 hover:bg-red-600/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {payment.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handlePaymentAction(payment.id, 'approve')}
                            disabled={actionLoading === payment.id}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {actionLoading === payment.id ? '...' : t('admin.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePaymentAction(payment.id, 'reject')}
                            disabled={actionLoading === payment.id}
                            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="h-3 w-3" />
                            {actionLoading === payment.id ? '...' : t('admin.reject')}
                          </Button>
                        </>
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

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-400">Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-status" className="text-gray-300">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as 'PENDING' | 'APPROVED' | 'REJECTED' }))}
              >
                <SelectTrigger className="bg-gray-900 border-red-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-red-500/30">
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-amount" className="text-gray-300">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="bg-gray-900 border-red-500/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-admin-notes" className="text-gray-300">Admin Notes</Label>
              <Textarea
                id="edit-admin-notes"
                value={editFormData.adminNotes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                className="bg-gray-900 border-red-500/30 text-white"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-red-500/30 text-red-400 hover:bg-red-600/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPayment}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Updating...' : 'Update Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-black border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>
            {selectedPaymentForAction && (
              <div className="bg-gray-900 p-4 rounded border border-red-500/30">
                <p className="text-white"><strong>Payment ID:</strong> {selectedPaymentForAction.id}</p>
                <p className="text-white"><strong>Amount:</strong> {formatCurrency(selectedPaymentForAction.amount)}</p>
                <p className="text-white"><strong>User:</strong> {selectedPaymentForAction.user?.name || selectedPaymentForAction.user?.telegramUsername || 'Unknown'}</p>
                <p className="text-white"><strong>Status:</strong> {selectedPaymentForAction.status}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-red-500/30 text-red-400 hover:bg-red-600/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePayment}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deleting...' : 'Delete Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}