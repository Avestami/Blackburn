'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownLeft, Wallet, Check, X, Eye, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface WalletTransaction {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  receiptUrl?: string
  cardNumber?: string
  cardHolderName?: string
  adminNotes?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function AdminWalletTransactionsPage() {
  const { data: session, status } = useSession()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')

  // Format currency in Tomans
  const formatTomans = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 10)
  }

  // Fetch wallet transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/wallet-transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        toast.error('Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Error fetching transactions')
    } finally {
      setLoading(false)
    }
  }

  // Process transaction (approve/reject)
  const processTransaction = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(transactionId)
      const response = await fetch(`/api/admin/wallet-transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminNotes,
        }),
      })

      if (response.ok) {
        toast.success(`Transaction ${action}d successfully`)
        setIsDialogOpen(false)
        setSelectedTransaction(null)
        setAdminNotes('')
        fetchTransactions()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${action} transaction`)
      }
    } catch (error) {
      console.error(`Error ${action}ing transaction:`, error)
      toast.error(`Failed to ${action} transaction`)
    } finally {
      setProcessing(null)
    }
  }

  // Open transaction details dialog
  const openTransactionDialog = (transaction: WalletTransaction) => {
    setSelectedTransaction(transaction)
    setAdminNotes(transaction.adminNotes || '')
    setIsDialogOpen(true)
  }

  // Filter transactions by status
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'pending') return transaction.status === 'PENDING'
    if (activeTab === 'approved') return transaction.status === 'APPROVED'
    if (activeTab === 'rejected') return transaction.status === 'REJECTED'
    return true
  })

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
      fetchTransactions()
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wallet Transactions</h1>
        <p className="text-gray-400">Manage user deposit and withdrawal requests</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-800 border-red-500/30">
          <TabsTrigger value="pending" className="data-[state=active]:bg-red-600">
            Pending ({transactions.filter(t => t.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-green-600">
            Approved ({transactions.filter(t => t.status === 'APPROVED').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600">
            Rejected ({transactions.filter(t => t.status === 'REJECTED').length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-gray-600">
            All ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {activeTab === 'pending' && 'Pending Transactions'}
                {activeTab === 'approved' && 'Approved Transactions'}
                {activeTab === 'rejected' && 'Rejected Transactions'}
                {activeTab === 'all' && 'All Transactions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'DEPOSIT' ? 'bg-green-600/20' : 'bg-red-600/20'
                        }`}>
                          {transaction.type === 'DEPOSIT' ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {transaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {transaction.user.name} ({transaction.user.email})
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-semibold ${
                            transaction.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? '+' : '-'}{formatTomans(transaction.amount)}
                          </div>
                          <Badge className={`text-xs ${
                            transaction.status === 'APPROVED' 
                              ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                              : transaction.status === 'REJECTED' 
                              ? 'bg-red-600/20 text-red-400 border-red-500/30' 
                              : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {transaction.status}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTransactionDialog(transaction)}
                          className="border-red-500/30 text-white hover:bg-red-600/20"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-red-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTransaction?.type === 'DEPOSIT' ? (
                <ArrowDownLeft className="h-5 w-5 text-green-400" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-red-400" />
              )}
              {selectedTransaction?.type} Request Details
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Review and process this transaction request
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">User</Label>
                  <p className="text-white">{selectedTransaction.user.name}</p>
                  <p className="text-gray-400 text-sm">{selectedTransaction.user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Amount</Label>
                  <p className={`text-lg font-semibold ${
                    selectedTransaction.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedTransaction.type === 'DEPOSIT' ? '+' : '-'}{formatTomans(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Date</Label>
                  <p className="text-white">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Badge className={`${
                    selectedTransaction.status === 'APPROVED' 
                      ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                      : selectedTransaction.status === 'REJECTED' 
                      ? 'bg-red-600/20 text-red-400 border-red-500/30' 
                      : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              {/* Deposit specific info */}
              {selectedTransaction.type === 'DEPOSIT' && selectedTransaction.receiptUrl && (
                <div>
                  <Label className="text-gray-300">Payment Receipt</Label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedTransaction.receiptUrl, '_blank')}
                      className="border-red-500/30 text-white hover:bg-red-600/20"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Receipt
                    </Button>
                  </div>
                </div>
              )}

              {/* Withdrawal specific info */}
              {selectedTransaction.type === 'WITHDRAWAL' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Card Number</Label>
                    <p className="text-white font-mono">{selectedTransaction.cardNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Card Holder Name</Label>
                    <p className="text-white">{selectedTransaction.cardHolderName}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes" className="text-gray-300">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this transaction..."
                  className="mt-2 bg-gray-800 border-red-500/30 text-white"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {selectedTransaction.status === 'PENDING' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => processTransaction(selectedTransaction.id, 'approve')}
                    disabled={processing === selectedTransaction.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processing === selectedTransaction.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => processTransaction(selectedTransaction.id, 'reject')}
                    disabled={processing === selectedTransaction.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === selectedTransaction.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}