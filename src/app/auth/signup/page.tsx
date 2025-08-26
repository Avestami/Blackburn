"use client"

import { useState } from "react"
// import { signIn } from "next-auth/react" // TODO: Add auto sign-in after registration
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [referralCode, setReferralCode] = useState('')
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Basic validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      setIsLoading(false)
      return
    }

    // Validate required fields
    if (!email || !username) {
      setError(t('auth.fillAllFields'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          referralCode: referralCode.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t('auth.accountCreated'))
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setError(data.error || t('auth.createAccountFailed'))
      }
    } catch {
      setError(t('auth.signUpError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-sm sm:max-w-md bg-gray-900/95 backdrop-blur-md border-red-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-white">
            {t('auth.joinBlackburn')}
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm sm:text-base">
            {t('auth.signUpDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                {t('auth.emailAddress')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"
                
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white text-sm font-medium">
                {t('auth.username')}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.chooseUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"

              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                {t('auth.password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"

              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                {t('auth.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.confirmPasswordDesc')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"

              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-white text-sm font-medium">
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"

              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold h-11 text-base transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t('common.loading') : t('auth.signUpButton')}
            </Button>
          </form>
          
          <div className="text-center pt-4 border-t border-red-500/20">
            <p className="text-gray-400 text-sm">
              {t('auth.alreadyHaveAccount')}{" "}
              <Link 
                href="/auth/signin" 
                className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
          
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30 mt-4">
              <AlertDescription className="text-red-300 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-500/10 border-green-500/30 mt-4">
              <AlertDescription className="text-green-300 text-sm">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}