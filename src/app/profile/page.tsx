'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, Phone, Calendar, Activity, Award, Loader2, Target, Settings, Bell, Shield, Globe } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { useUserStats } from "@/hooks/use-user-stats"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { profileData, loading: profileLoading, updateProfile } = useProfile()
  const { stats, loading: statsLoading } = useUserStats()
  const { t } = useLanguage()
  const [isUpdating, setIsUpdating] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  if (status === "loading" || profileLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }
  
  if (status === "unauthenticated") {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('profile.settings')}</h1>
        <p className="text-gray-300">{t('profile.manageAccount')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('profile.updateDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form ref={formRef} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">{t('profile.firstName')}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={profileData?.user?.firstName || ""}
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">{t('profile.lastName')}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={profileData?.user?.lastName || ""}
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={profileData?.user?.email || ""}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName" className="text-gray-300">{t('profile.emergencyContactName')}</Label>
                    <Input
                      id="emergencyName"
                      name="emergencyName"
                      defaultValue={profileData?.user?.profile?.emergencyContact ? JSON.parse(profileData.user.profile.emergencyContact).name : ""}
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-gray-300">{t('profile.emergencyContactPhone')}</Label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      defaultValue={profileData?.user?.profile?.emergencyContact ? JSON.parse(profileData.user.profile.emergencyContact).phone : ""}
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship" className="text-gray-300">{t('profile.emergencyContactRelationship')}</Label>
                  <Input
                    id="emergencyRelationship"
                    name="emergencyRelationship"
                    defaultValue={profileData?.user?.profile?.emergencyContact ? JSON.parse(profileData.user.profile.emergencyContact).relationship : ""}
                    className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medicalConditions" className="text-gray-300">{t('profile.medicalConditions')}</Label>
                  <Textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    placeholder={t('profile.medicalConditionsPlaceholder')}
                    defaultValue={profileData?.user?.profile?.medicalHistory || ""}
                    className="bg-gray-800 border-gray-700 text-white focus:border-red-500 min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-300">{t('profile.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-300">{t('profile.newPassword')}</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">{t('profile.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="bg-gray-800 border-gray-700 text-white focus:border-red-500"
                    />
                  </div>
                </div>
                
                <Button 
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isUpdating}
                  onClick={async () => {
                    if (!formRef.current) return;
                    
                    setIsUpdating(true);
                    try {
                      const formData = new FormData(formRef.current);
                      
                      // Handle password change if provided
                      const currentPassword = formData.get('currentPassword') as string;
                      const newPassword = formData.get('newPassword') as string;
                      const confirmPassword = formData.get('confirmPassword') as string;
                      
                      if (newPassword || confirmPassword) {
                        if (!currentPassword) {
                          toast.error('Current password is required to change password');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          toast.error('New passwords do not match');
                          return;
                        }
                        if (newPassword.length < 6) {
                          toast.error('New password must be at least 6 characters');
                          return;
                        }
                        
                        // Update password
                        const passwordResponse = await fetch('/api/user/change-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            currentPassword,
                            newPassword
                          })
                        });
                        
                        if (!passwordResponse.ok) {
                          const error = await passwordResponse.json();
                          toast.error(error.message || 'Failed to change password');
                          return;
                        }
                        
                        toast.success('Password changed successfully');
                      }
                      
                      // Prepare profile update data
                      const emergencyName = formData.get('emergencyName') as string;
                      const emergencyPhone = formData.get('emergencyPhone') as string;
                      const emergencyRelationship = formData.get('emergencyRelationship') as string;
                      const medicalConditions = formData.get('medicalConditions') as string;
                      
                      const updateData: any = {
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                      };
                      
                      // Add emergency contact if any field is provided
                      if (emergencyName || emergencyPhone || emergencyRelationship) {
                        updateData.emergencyContact = {
                          name: emergencyName || '',
                          phone: emergencyPhone || '',
                          relationship: emergencyRelationship || ''
                        };
                      }
                      
                      // Add medical conditions if provided
                      if (medicalConditions) {
                        updateData.medicalConditions = medicalConditions.split(',').map(c => c.trim()).filter(c => c);
                      }
                      
                      const success = await updateProfile(updateData);
                      if (success) {
                        toast.success('Profile updated successfully');
                      } else {
                        toast.error('Failed to update profile');
                      }
                    } catch (error) {
                      console.error('Failed to update profile:', error);
                      toast.error('An error occurred while updating profile');
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('common.saveChanges')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Profile Stats */}
        <div className="space-y-6">
          {/* Language Settings */}
          <div className="mb-6">
            <LanguageSelector className="w-full" />
          </div>
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('profile.quickStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('profile.memberSince')}</span>
                <span className="text-white font-semibold">
                  {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('profile.workoutsCompleted')}</span>
                <span className="text-red-400 font-semibold">{stats?.totalWorkouts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('profile.currentStreak')}</span>
                <span className="text-red-400 font-semibold">{stats?.currentStreak || 0} {t('profile.days')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('profile.programsEnrolled')}</span>
                <span className="text-white font-semibold">{stats?.programsEnrolled || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white">{t('profile.accountStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('profile.accountType')}</span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                    {profileData?.user?.role === 'ADMIN' ? t('profile.admin') : t('profile.premium')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('profile.status')}</span>
                  <span className="text-green-400 font-semibold">{t('profile.active')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('profile.totalCaloriesBurned')}</span>
                  <span className="text-red-400 font-semibold">{stats?.totalCalories || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{t('profile.weeklyWorkouts')}</span>
                  <span className="text-white font-semibold">{stats?.weeklyStats?.workouts || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Section */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              {t('settings.title', 'Settings')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Language Settings */}
            <div className="md:col-span-2 lg:col-span-1">
              <LanguageSelector className="w-full" />
            </div>

            {/* Privacy Settings */}
            <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-red-400" />
                  {t('settings.privacy', 'Privacy Settings')}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t('settings.privacyDescription', 'Control your privacy and data sharing preferences')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{t('settings.dataSharing', 'Data Sharing')}</p>
                      <p className="text-sm text-gray-400">
                        {t('settings.dataDescription', 'Control how your data is used')}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{t('settings.analytics', 'Analytics')}</p>
                      <p className="text-sm text-gray-400">
                        {t('settings.analyticsDescription', 'Help improve the app with usage data')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="md:col-span-2 lg:col-span-1 bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-red-400" />
                  {t('settings.notifications', 'Notifications')}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t('settings.notificationsDescription', 'Manage your notification preferences')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{t('settings.emailNotifications', 'Email Notifications')}</p>
                      <p className="text-sm text-gray-400">
                        {t('settings.emailDescription', 'Receive updates via email')}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{t('settings.pushNotifications', 'Push Notifications')}</p>
                      <p className="text-sm text-gray-400">
                        {t('settings.pushDescription', 'Receive push notifications')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Info */}
            <Card className="md:col-span-2 bg-gray-900/95 backdrop-blur-md border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5 text-red-400" />
                  {t('settings.about', 'About Blackburn Fitness')}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {t('settings.aboutDescription', 'Application information and support')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-medium text-white">{t('settings.version', 'Version')}</p>
                    <p className="text-sm text-gray-400">{t('settings.versionNumber', '1.0.0')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">{t('settings.support', 'Support')}</p>
                    <p className="text-sm text-gray-400">
                      {t('settings.supportDescription', 'Contact us for help and support')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}