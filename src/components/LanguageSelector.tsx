'use client'

import React from 'react'
import { useLanguage, Language } from '@/contexts/LanguageContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe } from 'lucide-react'
import { toast } from 'sonner'

interface LanguageSelectorProps {
  className?: string
  showCard?: boolean
}

const languageOptions: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
]

export function LanguageSelector({ className, showCard = true }: LanguageSelectorProps) {
  const { language, setLanguage, loading, t } = useLanguage()

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      await setLanguage(newLanguage)
      toast.success(t('settings.languageUpdated', 'Language preference updated successfully'))
    } catch (error) {
      console.error('Error updating language:', error)
      toast.error(t('common.error', 'Error updating language preference'))
    }
  }

  const selector = (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4" />
        <label className="text-sm font-medium">
          {t('settings.language', 'Language Preference')}
        </label>
      </div>
      <Select
        value={language}
        onValueChange={handleLanguageChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('settings.language', 'Select language')} />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span>{option.nativeLabel}</span>
                <span className="text-muted-foreground text-sm">({option.label})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        {t('settings.languageDescription', 'Choose your preferred language for the interface')}
      </p>
    </div>
  )

  if (!showCard) {
    return selector
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language', 'Language Preference')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDescription', 'Choose your preferred language for the interface')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={language}
          onValueChange={handleLanguageChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('settings.language', 'Select language')} />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.nativeLabel}</span>
                  <span className="text-muted-foreground text-sm">({option.label})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

export default LanguageSelector