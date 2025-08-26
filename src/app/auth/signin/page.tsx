"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const [loginType, setLoginType] = useState<'email' | 'telegram'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [telegramId, setTelegramId] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const credentials: { password: string; redirect: boolean; email?: string; telegramId?: string } = { password, redirect: false }
      
      if (loginType === 'email') {
        credentials.email = email
      } else {
        credentials.telegramId = telegramId
      }
      
      const result = await signIn('credentials', credentials)

      if (result?.error) {
        setError(t('auth.invalidCredentials'))
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(t('auth.signInError'))
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-sm sm:max-w-md bg-gray-900/95 backdrop-blur-md border-red-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-white">
            BlackBurn Fitness
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm sm:text-base">
            {t('auth.signInDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Type Selector */}
          <div className="flex mb-6 bg-gray-800/30 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'email'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('auth.email')}
            </button>
            <button
              type="button"
              onClick={() => setLoginType('telegram')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'telegram'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Telegram
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {loginType === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  {t('auth.email')}
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="telegramId" className="text-white text-sm font-medium">
                  {t('auth.telegramId')}
                </Label>
                <Input
                  id="telegramId"
                  type="text"
                  placeholder={t('auth.telegramId')}
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  required
                  className="bg-gray-800/50 border-red-500/30 text-white placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20 h-11 text-base"

                />
              </div>
            )}
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
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold h-11 text-base transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t('common.loading') : t('auth.signInButton')}
            </Button>
          </form>
          
          <div className="text-center pt-4 border-t border-red-500/20">
            <p className="text-gray-400 text-sm">
              {t('auth.noAccount')}{" "}
              <Link 
                href="/auth/signup" 
                className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
              >
                {t('auth.signUpLink')}
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
        </CardContent>
      </Card>
    </div>
  )
}