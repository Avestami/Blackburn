'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Wallet, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, Gift, Loader2, Upload, Copy, Minus } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function WalletPage() {
  const { data: session, status } = useSession()
  const { walletData, loading, error, submitting, requestWithdrawal } = useWallet()
  const { t } = useLanguage()
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [showCreditCardInfo, setShowCreditCardInfo] = useState(false)

  // Format currency in Tomans
  const formatTomans = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 10) // Convert to Tomans (1 Toman = 10 Rials)
  }

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/transactions');
      if (response.ok) {
        const data = await response.json();
        setWalletTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || !receiptFile) {
      toast.error('Please enter amount and upload receipt');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload receipt file first
      const formData = new FormData();
      formData.append('file', receiptFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload receipt');
      }
      
      const { url: receiptUrl } = await uploadResponse.json();

      // Create deposit transaction
      const response = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DEPOSIT',
          amount: parseFloat(depositAmount),
          receiptUrl,
        }),
      });

      if (response.ok) {
        toast.success('Deposit request submitted successfully! It will be processed by an admin.');
        setDepositAmount('');
        setReceiptFile(null);
        setIsDepositDialogOpen(false);
        setShowCreditCardInfo(false);
        fetchWalletTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit deposit request');
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdrawal
  const handleWithdrawal = async () => {
    if (!withdrawAmount || !cardNumber || !cardHolderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'WITHDRAWAL',
          amount: parseFloat(withdrawAmount),
          cardNumber,
          cardHolderName,
        }),
      });

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully! It will be processed by an admin.');
        setWithdrawAmount('');
        setCardNumber('');
        setCardHolderName('');
        setIsWithdrawDialogOpen(false);
        fetchWalletTransactions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load wallet transactions on component mount
  useEffect(() => {
    if (session) {
      fetchWalletTransactions();
    }
  }, [session]);

  // Copy credit card info to clipboard
  const copyCreditCardInfo = () => {
    const cardInfo = '6219 8618 6301 1432\nامیرحسین نبی زاده';
    navigator.clipboard.writeText(cardInfo);
    toast.success('Credit card information copied to clipboard!');
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-400">Error loading wallet data: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const walletBalance = walletData?.wallet?.balance || 0
  const transactions = walletData?.transactions || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('wallet.title')}</h1>
        <p className="text-gray-300">{t('wallet.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Balance & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {t('wallet.currentBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTomans(walletBalance)}
                </div>
                <p className="text-gray-300">{t('wallet.availableToSpend')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Add Funds */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('wallet.addFunds')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('wallet.topUpBalance')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-white">{t('wallet.amount')} ({t('wallet.tomans')})</Label>
                <Input 
                  id="amount" 
                  type="number"
                  placeholder="Enter amount"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="bg-gray-800/50 border-red-500/30 text-white"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10" 
                  size="sm"
                  onClick={() => setAddFundsAmount('250000')}
                >
                  250,000 {t('wallet.tomans')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10" 
                  size="sm"
                  onClick={() => setAddFundsAmount('500000')}
                >
                  500,000 {t('wallet.tomans')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10" 
                  size="sm"
                  onClick={() => setAddFundsAmount('1000000')}
                >
                  1,000,000 {t('wallet.tomans')}
                </Button>
              </div>
              
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0}
                onClick={() => {
                  // In a real app, this would integrate with a payment processor
                  alert('Add funds functionality would integrate with payment processor (Stripe, PayPal, etc.)')
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {t('wallet.addFunds')}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">{t('wallet.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Deposit Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>
                      Add money to your wallet by uploading a payment receipt.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="deposit-amount">Amount (Tomans)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                    
                    {!showCreditCardInfo ? (
                      <Button 
                        onClick={() => setShowCreditCardInfo(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Show Payment Information
                      </Button>
                    ) : (
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-blue-900">Payment Information</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={copyCreditCardInfo}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-blue-800">
                            <p className="font-mono">6219 8618 6301 1432</p>
                            <p className="mt-1">امیرحسین نبی زاده</p>
                          </div>
                          <p className="text-xs text-blue-600">
                            Transfer the amount to this card and upload your receipt below.
                          </p>
                        </div>
                      </Card>
                    )}
                    
                    <div>
                      <Label htmlFor="receipt-upload">Payment Receipt</Label>
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleDeposit} 
                      disabled={isProcessing || !depositAmount || !receiptFile}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Processing...' : 'Submit Deposit Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('wallet.withdrawFunds')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Withdraw money from your wallet to your bank card.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount (Tomans)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available balance: {formatTomans(walletBalance)}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="card-holder">Card Holder Name</Label>
                      <Input
                        id="card-holder"
                        type="text"
                        placeholder="Enter card holder name"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleWithdrawal} 
                      disabled={isProcessing || !withdrawAmount || !cardNumber || !cardHolderName}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Minus className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Processing...' : 'Submit Withdrawal Request'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Transactions */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Wallet Transactions
              </CardTitle>
              <CardDescription className="text-gray-300">
                Deposit and withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walletTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No wallet transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletTransactions.map((transaction: any) => (
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
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                          {transaction.adminNotes && (
                            <div className="text-gray-400 text-xs mt-1">
                              {transaction.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                      
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
                          {transaction.status === 'PENDING' ? 'In Process' : transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Regular Transaction History */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">{t('wallet.transactionHistory')}</CardTitle>
              <CardDescription className="text-gray-300">
                {t('wallet.recentActivity')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const transactionType = transaction.type === 'CREDIT' ? 'credit' : 'debit'
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transactionType === 'credit' ? 'bg-green-600/20' : 'bg-red-600/20'
                        }`}>
                          {transactionType === 'credit' ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{transaction.description}</div>
                          <div className="text-gray-300 text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transactionType === 'credit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transactionType === 'credit' ? '+' : '-'}{formatTomans(Math.abs(transaction.amount))}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {t('wallet.completed')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">{t('wallet.noTransactions')}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-red-500/20">
                <Button variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
                  {t('wallet.viewAllTransactions')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}