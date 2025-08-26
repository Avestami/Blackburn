"use client"

import { usePayments } from "@/hooks/use-payments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Receipt, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export default function PaymentsPage() {
  const { 
    transformedPayments: payments, 
    paymentStats, 
    loading, 
    error, 
    createPayment,
    getStatusIcon,
    getStatusColor,
    formatPaymentStatus
  } = usePayments()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-white">{t('payments.loadingPayments')}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-400">{t('payments.errorLoading')}: {error}</div>
        </div>
      </div>
    )
  }

  // Mock data - in real app, fetch from database
  const paymentMethods = [
    {
      id: 1,
      type: "card",
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: 2,
      type: "card",
      last4: "5555",
      brand: "Mastercard",
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ]

  const paymentHistory = [
    {
      id: "pay_001",
      amount: 99.99,
      currency: "USD",
      status: "completed",
      description: "Strength Builder Pro - Monthly Subscription",
      date: "2024-02-01T10:30:00Z",
      method: "Visa ****4242",
      receiptUrl: "/receipts/pay_001.pdf"
    },
    {
      id: "pay_002",
      amount: 79.99,
      currency: "USD",
      status: "completed",
      description: "Fat Burn Accelerator - One-time Purchase",
      date: "2024-01-15T14:22:00Z",
      method: "Mastercard ****5555",
      receiptUrl: "/receipts/pay_002.pdf"
    },
    {
      id: "pay_003",
      amount: 49.99,
      currency: "USD",
      status: "pending",
      description: "Wellness & Mobility - Monthly Subscription",
      date: "2024-02-01T09:15:00Z",
      method: "Visa ****4242",
      receiptUrl: null
    },
    {
      id: "pay_004",
      amount: 129.99,
      currency: "USD",
      status: "failed",
      description: "Athletic Performance - Quarterly Plan",
      date: "2024-01-28T16:45:00Z",
      method: "Visa ****4242",
      receiptUrl: null
    }
  ]

  const upcomingPayments = [
    {
      id: "upcoming_001",
      amount: 99.99,
      currency: "USD",
      description: "Strength Builder Pro - Monthly Subscription",
      dueDate: "2024-03-01T10:30:00Z",
      method: "Visa ****4242"
    },
    {
      id: "upcoming_002",
      amount: 49.99,
      currency: "USD",
      description: "Wellness & Mobility - Monthly Subscription",
      dueDate: "2024-03-01T09:15:00Z",
      method: "Visa ****4242"
    }
  ]


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('payments.billing')}</h1>
        <p className="text-gray-300">{t('payments.billingSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Overview & Methods */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border-green-500/30">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">${paymentStats.totalSpent.toFixed(2)}</div>
                <div className="text-sm text-gray-300">{t('payments.totalSpent')}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardContent className="p-6 text-center">
                <Receipt className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{paymentStats.totalTransactions}</div>
                <div className="text-sm text-gray-300">{t('payments.totalTransactions')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('payments.paymentMethods')}
                </CardTitle>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  {t('payments.addCard')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {method.brand} ****{method.last4}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {t('payments.expires')} {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge className="bg-green-600 text-white">{t('payments.default')}</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('payments.upcomingPayments')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="p-3 bg-gray-800/30 rounded-lg border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">${payment.amount}</div>
                    <div className="text-gray-300 text-sm">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm mb-1">{payment.description}</div>
                  <div className="text-gray-400 text-xs">{payment.method}</div>
                </div>
              ))}
              
              {upcomingPayments.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{t('payments.noUpcomingPayments')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    {t('payments.paymentHistory')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('payments.viewTransactions')}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-600/20">
                  {t('payments.exportAll')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">{t('payments.noPaymentHistory')}</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold mb-1">
                            ${payment.amount.toFixed(2)}
                          </div>
                          <div className="text-gray-300 text-sm mb-1">
                            {payment.description || payment.program || t('payments.payment')}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{new Date(payment.date).toLocaleDateString()}</span>
                            <span>{payment.method || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                        
                        {payment.receiptUrl && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-600/20"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {t('payments.receipt')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30 mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{t('payments.billingInformation')}</CardTitle>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-600/20">
                  {t('payments.update')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-300 mb-1">{t('payments.billingName')}</div>
                  <div className="text-white">{t('payments.notProvided')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">{t('payments.email')}</div>
                  <div className="text-white">{t('payments.notProvided')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">{t('payments.nextBillingDate')}</div>
                  <div className="text-white">March 1, 2024</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">{t('payments.billingCycle')}</div>
                  <div className="text-white">{t('payments.monthly')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}