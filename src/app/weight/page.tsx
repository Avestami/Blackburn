'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scale, TrendingUp, TrendingDown, Calendar, Plus, Loader2 } from "lucide-react"
import { useWeight } from "@/hooks/use-weight"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState } from "react"

export default function WeightTrackingPage() {
  const { data: session, status } = useSession()
  const { weightData, loading, error, isAdding, addWeightEntry, getWeightStats, getWeightEntriesWithChange } = useWeight()
  const { t } = useLanguage()
  const [weightInput, setWeightInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }
  
  if (status === "unauthenticated") {
    redirect("/auth/signin")
  }

  const stats = getWeightStats()
  const entriesWithChange = getWeightEntriesWithChange()

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput)
    if (!weight || weight <= 0) {
      alert(t('weight.validWeightError'))
      return
    }
    
    const success = await addWeightEntry(weight, notesInput || undefined)
    if (success) {
      setWeightInput('')
      setNotesInput('')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('weight.title')}</h1>
        <p className="text-gray-300">{t('weight.progress')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Weight Entry */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('weight.addEntry')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('weight.enterWeight')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weight" className="text-white">{t('weight.weight')} ({t('weight.lbs')})</Label>
                <Input 
                  id="weight" 
                  type="number"
                  placeholder={t('weight.enterWeight')}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="bg-gray-800/50 border-red-500/30 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-white">{t('weight.notes')}</Label>
                <Input 
                  id="notes" 
                  placeholder={t('weight.addNotes')}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="bg-gray-800/50 border-red-500/30 text-white"
                />
              </div>
              
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleAddWeight}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('weight.save')
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {t('weight.progress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.currentWeight} lbs</div>
                <div className="text-gray-300">{t('weight.currentWeight')}</div>
                {stats.latestBMI && (
                  <div className="mt-2">
                    <div className="text-lg font-semibold text-red-400">BMI: {stats.latestBMI}</div>
                    <div className="text-sm text-gray-300">{stats.latestBMICategory}</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2">
                {stats.totalChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-400" />
                ) : stats.totalChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-400" />
                ) : null}
                <span className={`font-semibold ${
                  stats.totalChange < 0 ? 'text-green-400' : 
                  stats.totalChange > 0 ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} lbs
                </span>
                <span className="text-gray-300">{t('weight.totalChange')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-500/20">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{stats.startWeight}</div>
                  <div className="text-sm text-gray-300">{t('weight.weight')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{stats.totalEntries}</div>
                  <div className="text-sm text-gray-300">{t('weight.history')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weight History */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('weight.history')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('weight.startTracking')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                {entriesWithChange.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                        <Scale className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{entry.weight} lbs</div>
                        <div className="text-gray-300 text-sm">{new Date(entry.createdAt).toLocaleDateString()}</div>
                        {entry.notes && (
                          <div className="text-gray-400 text-xs mt-1">{entry.notes}</div>
                        )}
                        {entry.bmi && (
                          <div className="text-red-400 text-xs">BMI: {entry.bmi}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {entry.change !== 0 && (
                        <>
                          {entry.change < 0 ? (
                            <TrendingDown className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`text-sm font-semibold ${
                            entry.change < 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {entry.change > 0 ? '+' : ''}{entry.change.toFixed(1)} lbs
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {entriesWithChange.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Scale className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">{t('weight.noEntries')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}