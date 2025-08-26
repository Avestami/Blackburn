'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Gift, Copy, DollarSign, Trophy, Star, Loader2 } from "lucide-react"
import { useReferrals } from "@/hooks/use-referrals"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState, useEffect } from "react"

export default function ReferralsPage() {
  const { data: session, status } = useSession()
  const { referralData, transformedReferrals, loading, error, copyToClipboard, getReferralLink } = useReferrals()
  const { t } = useLanguage()
  const [copySuccess, setCopySuccess] = useState('')

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
          <p className="text-red-400">Error loading referral data: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Get referral code from API data or show generate button
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Update referral code when data loads
  useEffect(() => {
    if (referralData && 'referralCode' in referralData) {
      setReferralCode((referralData as any).referralCode)
    }
  }, [referralData])
  const referralStats = referralData?.referralStats || {
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0
  }
  const referralHistory = transformedReferrals || []

  const handleGenerateReferralCode = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        setReferralCode(data.referralCode)
        setCopySuccess('Referral code generated!')
        setTimeout(() => setCopySuccess(''), 2000)
      } else {
        setCopySuccess('Failed to generate code')
        setTimeout(() => setCopySuccess(''), 2000)
      }
    } catch (error) {
      setCopySuccess('Failed to generate code')
      setTimeout(() => setCopySuccess(''), 2000)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyReferralCode = async () => {
    if (!referralCode) return
    const success = await copyToClipboard(referralCode)
    setCopySuccess(success ? 'Copied!' : 'Failed to copy')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const shareReferralLink = async () => {
    if (!referralCode) return
    const referralLink = getReferralLink(referralCode)
    const success = await copyToClipboard(referralLink)
    setCopySuccess(success ? 'Link copied!' : 'Failed to copy')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('referrals.title')}</h1>
        <p className="text-gray-300">{t('referrals.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{t('referrals.totalReferrals')}</p>
                    <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{t('referrals.successfulReferrals')}</p>
                    <p className="text-2xl font-bold text-white">{referralStats.successfulReferrals}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{t('referrals.totalEarnings')}</p>
                    <p className="text-2xl font-bold text-white">${referralStats.totalEarnings?.toFixed(2) || '0.00'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{t('referrals.pendingReferrals')}</p>
                    <p className="text-2xl font-bold text-white">{referralStats.pendingReferrals}</p>
                  </div>
                  <Gift className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Code */}
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Share2 className="h-5 w-5" />
{t('referrals.yourReferralCode')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {referralCode ? (
                <>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={referralCode}
                      readOnly
                      className="bg-gray-800/50 border-red-500/30 text-white font-mono"
                    />
                    <Button 
                      size="icon" 
                      onClick={copyReferralCode}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={shareReferralLink}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('referrals.shareReferralLink')}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">
                    You don't have a referral code yet. Generate one to start earning rewards!
                  </p>
                  <Button 
                    onClick={handleGenerateReferralCode} 
                    disabled={isGenerating}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Referral Code'
                    )}
                  </Button>
                </div>
              )}
              
              {copySuccess && (
                <p className="text-sm text-green-400 text-center">{copySuccess}</p>
              )}
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('referrals.howItWorks')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <div className="text-white font-semibold">{t('referrals.shareYourCode')}</div>
                  <div className="text-gray-300 text-sm">{t('referrals.sendCodeToFriends')}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <div className="text-white font-semibold">{t('referrals.theySignUp')}</div>
                  <div className="text-gray-300 text-sm">{t('referrals.friendJoinsWithCode')}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <div className="text-white font-semibold">{t('referrals.earnRewards')}</div>
                  <div className="text-gray-300 text-sm">{t('referrals.get25WhenPurchase')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral History */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('referrals.referralHistory')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('referrals.trackSuccessfulReferrals')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">{t('referrals.pendingEarnings')}</div>
                  <div className="text-xl font-bold text-yellow-400">${referralStats.totalEarnings}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">{t('referrals.noReferralsYet')}</p>
                    <p className="text-gray-500 text-sm">{t('referrals.startSharingCode')}</p>
                  </div>
                ) : (
                  referralHistory.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">{referral.name || referral.email}</div>
                          <div className="text-gray-300 text-sm">{referral.email}</div>
                          <div className="text-gray-400 text-xs">
                            {t('referrals.joined')} {referral.joinDate}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        {referral.program && <div className="text-gray-300 text-sm mb-1">{referral.program}</div>}
                        <Badge 
                          className={referral.status === 'SUCCESSFUL' ? 'bg-green-600' : 'bg-yellow-600'}
                        >
                          {referral.status === 'SUCCESSFUL' ? t('referrals.successful') : t('referrals.pending')}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-semibold ${
                          referral.earnings > 0 ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          ${referral.earnings}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {referral.status === 'SUCCESSFUL' ? t('referrals.earned') : t('referrals.pending')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('referrals.topReferrersThisMonth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((rank) => (
                  <div key={rank} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rank === 1 ? 'bg-yellow-600' : rank === 2 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {rank === 1 ? <Star className="h-4 w-4 text-white" /> : rank}
                      </div>
                      <div>
                        <div className="text-white font-semibold">User #{rank * 123}</div>
                        <div className="text-gray-300 text-sm">{25 - rank * 3} {t('referrals.referrals')}</div>
                      </div>
                    </div>
                    <div className="text-green-400 font-semibold">
                      ${(500 - rank * 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}