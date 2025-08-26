'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

type Language = 'en' | 'fa' | 'ar' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => Promise<void>
  loading: boolean
  translations: Record<string, string>
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Comprehensive translations for the app
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Authentication
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.telegramId': 'Telegram ID',
    'auth.telegramUsername': 'Telegram Username',
    'auth.telegramCode': 'Telegram Code',
    'auth.signInButton': 'Sign In',
    'auth.signUpButton': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.invalidCredentials': 'Invalid credentials',
    'auth.signInError': 'An error occurred during sign in',
    'auth.noAccount': "Don't have an account?",
    'auth.signUpLink': 'Sign up',
    'auth.passwordsNoMatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 6 characters long',
    'auth.fillAllFields': 'Please fill in all required fields',
    'auth.accountCreated': 'Account created successfully! You can now sign in.',
    'auth.createAccountFailed': 'Failed to create account',
    'auth.signUpError': 'An error occurred during sign up',
    'auth.welcomeBack': 'Welcome Back',
    'auth.joinBlackburn': 'Join BlackBurn Fitness',
    'auth.signInDescription': 'Welcome back to BlackBurn Fitness',
    'auth.signUpDescription': 'Create your account to start your fitness journey',
    'auth.website': 'Website',
    'auth.telegramBot': 'Telegram Bot',
    'auth.emailAddress': 'Email Address',
    'auth.enterEmail': 'Enter your email',
    'auth.chooseUsername': 'Choose a username',
    'auth.telegramUsernameDesc': 'Your Telegram username',
    'auth.telegramCodeDesc': 'Code from Telegram bot',
    'auth.getTelegramCode': 'Get this code by starting our Telegram bot',
    'auth.enterPassword': 'Enter your password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.confirmPasswordDesc': 'Confirm your password',
    'auth.enterTelegramId': 'Enter your Telegram ID',
    'auth.loginType': 'Login Type',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.programs': 'Programs',
    'nav.wallet': 'Wallet',
    'nav.payments': 'Payments',
    'nav.referrals': 'Referrals',
    'nav.friends': 'Friends',
    'nav.weight': 'Weight Tracking',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.weightTracking': 'Weight Tracking',
    'nav.findUsers': 'Find Users',
    'nav.welcome': 'Welcome',
    'nav.signOut': 'Sign Out',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.download': 'Download',
    'common.upload': 'Upload',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to Blackburn Fitness',
    'dashboard.overview': 'Overview',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.welcomeBack': 'Welcome Back',
    'dashboard.champion': 'Champion',
    'dashboard.transformBody': 'Transform your body, elevate your mind, and achieve greatness through disciplined training.',
    'dashboard.todaysWorkout': "Today's Workout",
    'dashboard.startWorkout': 'Start Workout',
    'dashboard.viewPrograms': 'View Programs',
    'dashboard.quickStats': 'Quick Stats',
    'dashboard.totalWorkouts': 'Total Workouts',
    'dashboard.currentStreak': 'Current Streak',
    'dashboard.caloriesBurned': 'Calories Burned',
    'dashboard.weeklyGoal': 'Weekly Goal',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.viewAll': 'View All',
    
    // Dashboard Programs
    'dashboard.programs.strengthBuilding': 'Strength Building',
    'dashboard.programs.strengthBuildingDesc': 'Build muscle mass and increase overall strength through progressive resistance training.',
    'dashboard.programs.strengthEnrolled': '2,847 enrolled',
    'dashboard.programs.strengthDuration': '12 weeks',
    'dashboard.programs.strengthLevel': 'Intermediate',
    'dashboard.programs.strengthPrice': '$89',
    'dashboard.programs.getStarted': 'Get Started',
    
    'dashboard.programs.weightLoss': 'Weight Loss',
    'dashboard.programs.weightLossDesc': 'Burn fat and achieve your ideal body composition with targeted workouts and nutrition guidance.',
    'dashboard.programs.weightLossEnrolled': '3,521 enrolled',
    'dashboard.programs.weightLossDuration': '8 weeks',
    'dashboard.programs.weightLossLevel': 'Beginner',
    'dashboard.programs.weightLossPrice': '$69',
    
    'dashboard.programs.athleticPerformance': 'Athletic Performance',
    'dashboard.programs.athleticPerformanceDesc': 'Enhance your athletic abilities with sport-specific training and performance optimization.',
    'dashboard.programs.athleticEnrolled': '1,923 enrolled',
    'dashboard.programs.athleticDuration': '16 weeks',
    'dashboard.programs.athleticLevel': 'Advanced',
    'dashboard.programs.athleticPrice': '$129',
    'dashboard.programs.athleticPerformanceEnrolled': '856 enrolled',
    'dashboard.programs.athleticPerformanceDuration': '16-week program',
    'dashboard.programs.athleticPerformanceLevel': 'Expert level',
    'dashboard.programs.athleticPerformancePrice': '$149',
    
    'dashboard.programs.wellnessMobility': 'Wellness & Mobility',
    'dashboard.programs.wellnessMobilityDesc': 'Improve flexibility, mobility, and overall wellness through mindful movement and recovery.',
    'dashboard.programs.wellnessEnrolled': '2,156 enrolled',
    'dashboard.programs.wellnessDuration': '6 weeks',
    'dashboard.programs.wellnessLevel': 'All Levels',
    'dashboard.programs.wellnessPrice': '$49',
    'dashboard.programs.wellnessMobilityEnrolled': '1,234 enrolled',
    'dashboard.programs.wellnessMobilityDuration': '6-week program',
    'dashboard.programs.wellnessMobilityLevel': 'Beginner level',
    'dashboard.programs.wellnessMobilityPrice': '$49',
    
    'dashboard.adminPanel': 'Admin Panel',
    'dashboard.adminAccess': 'Access admin dashboard for user and system management',
    
    // Profile
    'profile.title': 'Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.preferences': 'Preferences',
    'profile.language': 'Language',
    'profile.settings': 'Profile Settings',
    'profile.manageAccount': 'Manage your account information and preferences',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.medicalHistory': 'Medical History',
    'profile.medicalPlaceholder': 'Any medical conditions or notes...',
    'profile.medicalHistoryPlaceholder': 'Enter any relevant medical history or conditions...',

    'profile.updateDetails': 'Update your personal details and contact information',
    'profile.quickStats': 'Quick Stats',
    'profile.memberSince': 'Member Since',
    'profile.workoutsCompleted': 'Workouts Completed',
    'profile.currentStreak': 'Current Streak',
    'profile.programsEnrolled': 'Programs Enrolled',
    'profile.accountStatus': 'Account Status',
    'profile.accountType': 'Account Type',
    'profile.status': 'Status',
    'profile.totalCaloriesBurned': 'Total Calories Burned',
    'profile.weeklyWorkouts': 'Weekly Workouts',
    'profile.admin': 'Admin',
    'profile.premium': 'Premium',
    'profile.active': 'Active',
    'profile.days': 'days',
    'profile.saveChanges': 'Save Changes',
    'profile.saving': 'Saving...',
    
    // Programs
    'programs.fitnessAssessment': 'Take our fitness assessment to get personalized program recommendations',
    'programs.availablePrograms': 'Available Programs',
    'programs.myPrograms': 'My Programs',
    'programs.recommended': 'Recommended for You',
    'programs.beginner': 'Beginner',
    'programs.intermediate': 'Intermediate',
    'programs.advanced': 'Advanced',
    'programs.duration': 'Duration',
    'programs.weeks': 'weeks',
    'programs.workoutsPerWeek': 'Workouts per week',
    'programs.difficulty': 'Difficulty',
    'programs.equipment': 'Equipment',
    'programs.viewDetails': 'View Details',
    'programs.continue': 'Continue',
    'programs.completed': 'Completed',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.balance': 'Balance',
    'wallet.transactions': 'Transactions',
    'wallet.deposit': 'Deposit',
    'wallet.withdraw': 'Withdraw',
    'wallet.history': 'Transaction History',
    'wallet.amount': 'Amount',
    'wallet.date': 'Date',
    'wallet.type': 'Type',
    'wallet.status': 'Status',
    'wallet.pending': 'Pending',
    'wallet.completed': 'Completed',
    'wallet.failed': 'Failed',
    'wallet.credit': 'Credit',
    'wallet.debit': 'Debit',
    'wallet.noTransactions': 'No transactions yet',
    'wallet.addFunds': 'Add Funds',
    'wallet.withdrawFunds': 'Withdraw Funds',
    'wallet.minimumAmount': 'Minimum amount',
    'wallet.maximumAmount': 'Maximum amount',
    'wallet.enterAmount': 'Enter amount',
    'wallet.confirm': 'Confirm',
    'wallet.cancel': 'Cancel',
    
    // Payments
    'payments.title': 'Payments',
    'payments.history': 'Payment History',
    'payments.subscription': 'Subscription',
    'payments.programs': 'Programs',
    'payments.services': 'Services',
    'payments.invoice': 'Invoice',
    'payments.receipt': 'Receipt',
    'payments.download': 'Download',
    'payments.refund': 'Refund',
    'payments.refundRequested': 'Refund Requested',
    'payments.refunded': 'Refunded',
    'payments.paymentMethod': 'Payment Method',
    'payments.card': 'Card',
    'payments.wallet': 'Wallet',
    'payments.bank': 'Bank Transfer',
    
    // Referrals
    'referrals.title': 'Referrals',
    'referrals.program': 'Referral Program',
    'referrals.inviteFriends': 'Invite Friends',
    'referrals.earnRewards': 'Earn Rewards',
    'referrals.yourCode': 'Your Referral Code',
    'referrals.copyCode': 'Copy Code',
    'referrals.shareLink': 'Share Link',
    'referrals.totalReferrals': 'Total Referrals',
    'referrals.totalEarnings': 'Total Earnings',
    'referrals.pendingRewards': 'Pending Rewards',
    'referrals.rewardPerReferral': 'Reward per Referral',


    
    // Weight Tracking
    'weight.title': 'Weight Tracking',
    'weight.currentWeight': 'Current Weight',
    'weight.goalWeight': 'Goal Weight',
    'weight.progress': 'Progress',
    'weight.addEntry': 'Add Entry',
    'weight.history': 'Weight History',
    'weight.date': 'Date',
    'weight.weight': 'Weight',
    'weight.change': 'Change',
    'weight.notes': 'Notes',
    'weight.kg': 'kg',
    'weight.lbs': 'lbs',
    'weight.gained': 'gained',
    'weight.lost': 'lost',
    'weight.maintained': 'maintained',
    'weight.enterWeight': 'Enter your weight',
    'weight.addNotes': 'Add notes (optional)',
    'weight.save': 'Save Entry',
    'weight.edit': 'Edit',
    'weight.delete': 'Delete',
    'weight.noEntries': 'No weight entries yet',
    'weight.startTracking': 'Start tracking your weight progress',
    'weight.totalChange': 'total change',
    'weight.validWeightError': 'Please enter a valid weight',
    
    // Referrals
    'referrals.shareCode': 'Share Your Code',
    'referrals.recentReferrals': 'Recent Referrals',
    'referrals.noReferrals': 'No referrals yet',
    'referrals.howItWorks': 'How It Works',
    'referrals.step1': 'Share your unique referral code',
    'referrals.step2': 'Friends sign up using your code',
    'referrals.step3': 'Earn rewards for each successful referral',
    'referrals.terms': 'Terms and Conditions',
    'referrals.referralHistory': 'Referral History',
    'referrals.name': 'Name',
    'referrals.joinDate': 'Join Date',
    'referrals.reward': 'Reward',
    'referrals.claimed': 'Claimed',
    'referrals.unclaimed': 'Unclaimed',
    
    // Programs
    'programs.title': 'Fitness Programs',
    'programs.subtitle': 'Choose from our expertly designed programs to achieve your fitness goals',
    'programs.enrolled': 'enrolled',
    'programs.whatsIncluded': "What's Included",
    'programs.enrollNow': 'Enroll Now',
    'programs.learnMore': 'Learn More',
    'programs.notSureTitle': 'Not sure which program is right for you?',
    'programs.notSureDescription': 'Take our fitness assessment to get personalized program recommendations based on your goals and fitness level.',
    'programs.takeAssessment': 'Take Assessment',
    'programs.features.progressiveOverload': 'Progressive Overload',
    'programs.features.nutritionGuide': 'Nutrition Guide',
    'programs.features.videoTutorials': 'Video Tutorials',
    'programs.features.support247': '24/7 Support',
    'programs.features.hiitWorkouts': 'HIIT Workouts',
    'programs.features.mealPlans': 'Meal Plans',
    'programs.features.progressTracking': 'Progress Tracking',
    'programs.features.communityAccess': 'Community Access',
    'programs.features.sportSpecificDrills': 'Sport-Specific Drills',
    'programs.features.recoveryProtocols': 'Recovery Protocols',
    'programs.features.performanceAnalytics': 'Performance Analytics',
    'programs.features.coachConsultation': 'Coach Consultation',
    'programs.features.yogaSessions': 'Yoga Sessions',
    'programs.features.stretchingRoutines': 'Stretching Routines',
    'programs.features.meditationGuide': 'Meditation Guide',
    'programs.features.stressManagement': 'Stress Management',
    'programs.features.expertGuidance': 'Expert Guidance',
    'programs.features.communitySupport': 'Community Support',
    'programs.features.flexibleSchedule': 'Flexible Schedule',

    // Settings
    'settings.title': 'Settings',
    'settings.description': 'Manage your account preferences and application settings',
    'settings.account': 'Account Settings',
    'settings.accountDescription': 'Manage your account information and security',
    'settings.notSet': 'Not set',
    'settings.privacy': 'Privacy Settings',
    'settings.privacyDescription': 'Control your privacy and data sharing preferences',
    'settings.dataSharing': 'Data Sharing',
    'settings.dataDescription': 'Control how your data is used',
    'settings.analytics': 'Analytics',
    'settings.analyticsDescription': 'Help improve the app with usage data',
    'settings.notifications': 'Notifications',
    'settings.notificationsDescription': 'Manage your notification preferences',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailDescription': 'Receive updates via email',
    'settings.pushNotifications': 'Push Notifications',
    'settings.pushDescription': 'Receive push notifications',
    'settings.about': 'About Blackburn Fitness',
    'settings.aboutDescription': 'Application information and support',
    'settings.version': 'Version',
    'settings.versionNumber': '1.0.0',
    'settings.support': 'Support',
    'settings.supportDescription': 'Contact us for help and support',
    'settings.language': 'Language Preference',
    'settings.languageDescription': 'Choose your preferred language for the interface',
    'settings.languageUpdated': 'Language preference updated successfully',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.toggle': 'Toggle Theme',
    
    // Language names
    'language.english': 'English',
    'language.farsi': 'فارسی',
    'language.arabic': 'العربية',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.russian': 'Русский',
    'language.chinese': '中文',
    'language.toggle': 'Toggle Language',
  },
  fa: {
    // Authentication
    'auth.signin': 'ورود',
    'auth.signup': 'ثبت نام',
    'auth.email': 'ایمیل',
    'auth.password': 'رمز عبور',
    'auth.username': 'نام کاربری',
    'auth.telegramId': 'شناسه تلگرام',
    'auth.telegramUsername': 'نام کاربری تلگرام',
    'auth.telegramCode': 'کد تلگرام',
    'auth.signInButton': 'ورود',
    'auth.signUpButton': 'ایجاد حساب',
    'auth.alreadyHaveAccount': 'قبلاً حساب دارید؟',
    'auth.invalidCredentials': 'اطلاعات ورود نامعتبر',
    'auth.signInError': 'خطایی در هنگام ورود رخ داد',
    'auth.noAccount': 'حساب کاربری ندارید؟',
    'auth.signUpLink': 'ثبت نام',
    'auth.passwordsNoMatch': 'رمزهای عبور مطابقت ندارند',
    'auth.passwordTooShort': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    'auth.fillAllFields': 'لطفاً تمام فیلدهای الزامی را پر کنید',
    'auth.accountCreated': 'حساب کاربری با موفقیت ایجاد شد! اکنون می‌توانید وارد شوید.',
    'auth.createAccountFailed': 'ایجاد حساب کاربری ناموفق بود',
    'auth.signUpError': 'خطایی در هنگام ثبت نام رخ داد',
    'auth.welcomeBack': 'خوش آمدید',
    'auth.joinBlackburn': 'به بلک‌برن فیتنس بپیوندید',
    'auth.signInDescription': 'به بلک‌برن فیتنس خوش آمدید',
    'auth.signUpDescription': 'حساب خود را ایجاد کنید تا سفر تناسب اندام خود را شروع کنید',
    'auth.website': 'وب‌سایت',
    'auth.telegramBot': 'ربات تلگرام',
    'auth.emailAddress': 'آدرس ایمیل',
    'auth.enterEmail': 'ایمیل خود را وارد کنید',
    'auth.chooseUsername': 'نام کاربری انتخاب کنید',
    'auth.telegramUsernameDesc': 'نام کاربری تلگرام شما',
    'auth.telegramCodeDesc': 'کد دریافتی از ربات تلگرام',
    'auth.getTelegramCode': 'این کد را با شروع ربات تلگرام ما دریافت کنید',
    'auth.enterPassword': 'رمز عبور خود را وارد کنید',
    'auth.confirmPassword': 'تأیید رمز عبور',
    'auth.confirmPasswordDesc': 'رمز عبور خود را تأیید کنید',
    'auth.enterTelegramId': 'شناسه تلگرام خود را وارد کنید',
    'auth.loginType': 'نوع ورود',
    
    // Navigation
    'nav.dashboard': 'داشبورد',
    'nav.profile': 'پروفایل',
    'nav.programs': 'برنامه‌ها',
    'nav.wallet': 'کیف پول',
    'nav.payments': 'پرداخت‌ها',
    'nav.referrals': 'معرفی‌ها',
    'nav.friends': 'دوستان',
    'nav.weight': 'پیگیری وزن',
    'nav.settings': 'تنظیمات',
    'nav.logout': 'خروج',
    'nav.weightTracking': 'پیگیری وزن',
    'nav.findUsers': 'جستجوی کاربران',
    'nav.welcome': 'خوش آمدید',
    'nav.signOut': 'خروج',
    
    // Common
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا',
    'common.success': 'موفقیت',
    'common.save': 'ذخیره',
    'common.cancel': 'لغو',
    'common.edit': 'ویرایش',
    'common.delete': 'حذف',
    'common.add': 'افزودن',
    'common.update': 'به‌روزرسانی',
    'common.submit': 'ارسال',
    'common.close': 'بستن',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.previous': 'قبلی',
    'common.search': 'جستجو',
    'common.filter': 'فیلتر',
    'common.sort': 'مرتب‌سازی',
    'common.export': 'خروجی',
    'common.import': 'ورودی',
    'common.download': 'دانلود',
    'common.upload': 'آپلود',
    
    // Dashboard
    'dashboard.welcome': 'به بلکبرن فیتنس خوش آمدید',
    'dashboard.overview': 'نمای کلی',
    'dashboard.quickActions': 'اقدامات سریع',
    'dashboard.welcomeBack': 'خوش برگشتید',
    'dashboard.champion': 'قهرمان',
    'dashboard.transformBody': 'بدن خود را متحول کنید، ذهن خود را ارتقا دهید و از طریق تمرین منظم به عظمت برسید.',
    'dashboard.todaysWorkout': 'تمرین امروز',
    'dashboard.startWorkout': 'شروع تمرین',
    'dashboard.viewPrograms': 'مشاهده برنامه‌ها',
    'dashboard.quickStats': 'آمار سریع',
    'dashboard.totalWorkouts': 'کل تمرین‌ها',
    'dashboard.currentStreak': 'رکورد فعلی',
    'dashboard.caloriesBurned': 'کالری سوزانده شده',
    'dashboard.weeklyGoal': 'هدف هفتگی',
    'dashboard.recentActivity': 'فعالیت‌های اخیر',
    'dashboard.viewAll': 'مشاهده همه',
    
    // Dashboard Programs
    'dashboard.programs.strengthBuilding': 'قدرت‌سازی',
    'dashboard.programs.strengthBuildingDesc': 'افزایش توده عضلانی و قدرت کلی از طریق تمرینات مقاومتی پیشرونده.',
    'dashboard.programs.strengthEnrolled': '۲,۸۴۷ ثبت نام شده',
    'dashboard.programs.strengthDuration': '۱۲ هفته',
    'dashboard.programs.strengthLevel': 'متوسط',
    'dashboard.programs.strengthPrice': '۸۹ دلار',
    'dashboard.programs.getStarted': 'شروع کنید',
    
    'dashboard.programs.weightLoss': 'کاهش وزن',
    'dashboard.programs.weightLossDesc': 'چربی‌سوزی و دستیابی به ترکیب بدنی ایده‌آل با تمرینات هدفمند و راهنمایی تغذیه.',
    'dashboard.programs.weightLossEnrolled': '۳,۵۲۱ ثبت نام شده',
    'dashboard.programs.weightLossDuration': '۸ هفته',
    'dashboard.programs.weightLossLevel': 'مبتدی',
    'dashboard.programs.weightLossPrice': '۶۹ دلار',
    
    'dashboard.programs.athleticPerformance': 'عملکرد ورزشی',
    'dashboard.programs.athleticPerformanceDesc': 'بهبود توانایی‌های ورزشی با تمرینات تخصصی و بهینه‌سازی عملکرد.',
    'dashboard.programs.athleticEnrolled': '۱,۹۲۳ ثبت نام شده',
    'dashboard.programs.athleticDuration': '۱۶ هفته',
    'dashboard.programs.athleticLevel': 'پیشرفته',
    'dashboard.programs.athleticPrice': '۱۲۹ دلار',
    'dashboard.programs.athleticPerformanceEnrolled': '۸۵۶ ثبت نام شده',
    'dashboard.programs.athleticPerformanceDuration': 'برنامه ۱۶ هفته‌ای',
    'dashboard.programs.athleticPerformanceLevel': 'سطح متخصص',
    'dashboard.programs.athleticPerformancePrice': '۱۴۹ دلار',
    
    'dashboard.programs.wellnessMobility': 'سلامت و تحرک',
    'dashboard.programs.wellnessMobilityDesc': 'بهبود انعطاف‌پذیری، تحرک و سلامت کلی از طریق حرکات آگاهانه و بازیابی.',
    'dashboard.programs.wellnessEnrolled': '۲,۱۵۶ ثبت نام شده',
    'dashboard.programs.wellnessDuration': '۶ هفته',
    'dashboard.programs.wellnessLevel': 'همه سطوح',
    'dashboard.programs.wellnessPrice': '۴۹ دلار',
    'dashboard.programs.wellnessMobilityEnrolled': '۱,۲۳۴ ثبت نام شده',
    'dashboard.programs.wellnessMobilityDuration': 'برنامه ۶ هفته‌ای',
    'dashboard.programs.wellnessMobilityLevel': 'سطح مبتدی',
    'dashboard.programs.wellnessMobilityPrice': '۴۹ دلار',
    
    'dashboard.adminPanel': 'پنل مدیریت',
    'dashboard.adminAccess': 'دسترسی به داشبورد مدیریت برای مدیریت کاربران و سیستم',
    
    // Profile
    'profile.title': 'پروفایل',
    'profile.personalInfo': 'اطلاعات شخصی',
    'profile.preferences': 'تنظیمات',
    'profile.language': 'زبان',
    'profile.settings': 'تنظیمات پروفایل',
    'profile.manageAccount': 'اطلاعات حساب کاربری و تنظیمات خود را مدیریت کنید',
    'profile.firstName': 'نام',
    'profile.lastName': 'نام خانوادگی',
    'profile.email': 'ایمیل',
    'profile.phone': 'تلفن',
    'profile.medicalHistory': 'سابقه پزشکی',
    'profile.medicalPlaceholder': 'هرگونه بیماری یا یادداشت پزشکی...',
    'profile.medicalHistoryPlaceholder': 'سابقه پزشکی یا شرایط مربوطه را وارد کنید...',
    
    'profile.updateDetails': 'جزئیات شخصی و اطلاعات تماس خود را به‌روزرسانی کنید',
    'profile.quickStats': 'آمار سریع',
    'profile.memberSince': 'عضو از',
    'profile.workoutsCompleted': 'تمرینات تکمیل شده',
    'profile.currentStreak': 'رکورد فعلی',
    'profile.programsEnrolled': 'برنامه‌های ثبت‌نام شده',
    'profile.accountStatus': 'وضعیت حساب',
    'profile.accountType': 'نوع حساب',
    'profile.status': 'وضعیت',
    'profile.totalCaloriesBurned': 'کل کالری سوزانده شده',
    'profile.weeklyWorkouts': 'تمرینات هفتگی',
    'profile.admin': 'مدیر',
    'profile.premium': 'پریمیوم',
    'profile.active': 'فعال',
    'profile.days': 'روز',
    'profile.saveChanges': 'ذخیره تغییرات',
    'profile.saving': 'در حال ذخیره...',
    
    // Programs
    'programs.title': 'برنامه‌ها',
    'programs.fitnessAssessment': 'ارزیابی آمادگی جسمانی خود را انجام دهید تا توصیه‌های برنامه شخصی‌سازی شده دریافت کنید',
    'programs.takeAssessment': 'شروع ارزیابی',
    'programs.availablePrograms': 'برنامه‌های موجود',
    'programs.myPrograms': 'برنامه‌های من',
    'programs.recommended': 'پیشنهادی برای شما',
    'programs.beginner': 'مبتدی',
    'programs.intermediate': 'متوسط',
    'programs.advanced': 'پیشرفته',
    'programs.duration': 'مدت زمان',
    'programs.weeks': 'هفته',
    'programs.workoutsPerWeek': 'تمرین در هفته',
    'programs.difficulty': 'سطح دشواری',
    'programs.equipment': 'تجهیزات',
    'programs.enrollNow': 'ثبت نام کنید',
    'programs.viewDetails': 'مشاهده جزئیات',
    'programs.enrolled': 'ثبت نام شده',
    'programs.continue': 'ادامه',
    'programs.completed': 'تکمیل شده',
    
    // Wallet
    'wallet.title': 'کیف پول',
    'wallet.balance': 'موجودی',
    'wallet.transactions': 'تراکنش‌ها',
    'wallet.deposit': 'واریز',
    'wallet.withdraw': 'برداشت',
    'wallet.history': 'تاریخچه تراکنش‌ها',
    'wallet.amount': 'مبلغ',
    'wallet.date': 'تاریخ',
    'wallet.type': 'نوع',
    'wallet.status': 'وضعیت',
    'wallet.pending': 'در انتظار',
    'wallet.completed': 'تکمیل شده',
    'wallet.failed': 'ناموفق',
    'wallet.credit': 'بستانکار',
    'wallet.debit': 'بدهکار',
    'wallet.noTransactions': 'هنوز تراکنشی وجود ندارد',
    'wallet.addFunds': 'افزودن وجه',
    'wallet.withdrawFunds': 'برداشت وجه',
    'wallet.minimumAmount': 'حداقل مبلغ',
    'wallet.maximumAmount': 'حداکثر مبلغ',
    'wallet.enterAmount': 'مبلغ را وارد کنید',
    'wallet.confirm': 'تأیید',
    'wallet.cancel': 'لغو',
    
    // Payments
    'payments.title': 'پرداخت‌ها',
    'payments.history': 'تاریخچه پرداخت‌ها',
    'payments.subscription': 'اشتراک',
    'payments.programs': 'برنامه‌ها',
    'payments.services': 'خدمات',
    'payments.invoice': 'فاکتور',
    'payments.receipt': 'رسید',
    'payments.download': 'دانلود',
    'payments.refund': 'بازپرداخت',
    'payments.refundRequested': 'درخواست بازپرداخت',
    'payments.refunded': 'بازپرداخت شده',
    'payments.paymentMethod': 'روش پرداخت',
    'payments.card': 'کارت',
    'payments.wallet': 'کیف پول',
    'payments.bank': 'انتقال بانکی',
    
    // Weight Tracking
    'weight.title': 'پیگیری وزن',
    'weight.currentWeight': 'وزن فعلی',
    'weight.goalWeight': 'وزن هدف',
    'weight.progress': 'پیشرفت',
    'weight.addEntry': 'افزودن ورودی',
    'weight.history': 'تاریخچه وزن',
    'weight.date': 'تاریخ',
    'weight.weight': 'وزن',
    'weight.change': 'تغییر',
    'weight.notes': 'یادداشت‌ها',
    'weight.kg': 'کیلوگرم',
    'weight.lbs': 'پوند',
    'weight.gained': 'افزایش',
    'weight.lost': 'کاهش',
    'weight.maintained': 'ثابت',
    'weight.enterWeight': 'وزن خود را وارد کنید',
    'weight.addNotes': 'یادداشت اضافه کنید (اختیاری)',
    'weight.save': 'ذخیره ورودی',
    'weight.edit': 'ویرایش',
    'weight.delete': 'حذف',
    'weight.noEntries': 'هنوز ورودی وزنی وجود ندارد',
    'weight.startTracking': 'پیگیری پیشرفت وزن خود را شروع کنید',
    'weight.totalChange': 'کل تغییر',
    'weight.validWeightError': 'لطفاً وزن معتبری وارد کنید',
    
    // Referrals
    'referrals.title': 'معرفی‌ها',
    'referrals.program': 'برنامه معرفی',
    'referrals.inviteFriends': 'دعوت از دوستان',
    'referrals.earnRewards': 'کسب پاداش',
    'referrals.shareCode': 'کد خود را به اشتراک بگذارید',
    'referrals.yourCode': 'کد معرفی شما',
    'referrals.copyCode': 'کپی کد',
    'referrals.shareLink': 'اشتراک لینک',
    'referrals.totalReferrals': 'کل معرفی‌ها',
    'referrals.totalEarnings': 'کل درآمد',
    'referrals.pendingRewards': 'پاداش‌های در انتظار',
    'referrals.recentReferrals': 'معرفی‌های اخیر',
    'referrals.noReferrals': 'هنوز معرفی‌ای وجود ندارد',
    'referrals.howItWorks': 'نحوه کارکرد',
    'referrals.step1': 'کد منحصر به فرد معرفی خود را به اشتراک بگذارید',
    'referrals.step2': 'دوستان با استفاده از کد شما ثبت نام می‌کنند',
    'referrals.step3': 'برای هر معرفی موفق پاداش کسب کنید',
    'referrals.terms': 'شرایط و ضوابط',
    
    // Programs

    'programs.features.progressiveOverload': 'بارگذاری تدریجی',
    'programs.features.nutritionGuide': 'راهنمای تغذیه',
    'programs.features.videoTutorials': 'آموزش‌های ویدیویی',
    'programs.features.support247': 'پشتیبانی ۲۴/۷',
    'programs.features.hiitWorkouts': 'تمرینات HIIT',
    'programs.features.mealPlans': 'برنامه‌های غذایی',
    'programs.features.progressTracking': 'پیگیری پیشرفت',
    'programs.features.communityAccess': 'دسترسی به انجمن',
    'programs.features.sportSpecificDrills': 'تمرینات ورزش‌محور',
    'programs.features.recoveryProtocols': 'پروتکل‌های بازیابی',
    'programs.features.performanceAnalytics': 'تجزیه و تحلیل عملکرد',
    'programs.features.coachConsultation': 'مشاوره مربی',
    'programs.features.yogaSessions': 'جلسات یوگا',
    'programs.features.stretchingRoutines': 'برنامه‌های کشش',
    'programs.features.meditationGuide': 'راهنمای مدیتیشن',
    'programs.features.stressManagement': 'مدیریت استرس',
    'programs.features.expertGuidance': 'راهنمایی متخصص',
    'programs.features.communitySupport': 'پشتیبانی انجمن',
    'programs.features.flexibleSchedule': 'برنامه انعطاف‌پذیر',

    // Settings
    'settings.title': 'تنظیمات',
    'settings.description': 'تنظیمات حساب و برنامه خود را مدیریت کنید',
    'settings.account': 'تنظیمات حساب',
    'settings.accountDescription': 'اطلاعات حساب و امنیت خود را مدیریت کنید',
    'settings.notSet': 'تنظیم نشده',
    'settings.privacy': 'تنظیمات حریم خصوصی',
    'settings.privacyDescription': 'حریم خصوصی و اشتراک‌گذاری داده‌ها را کنترل کنید',
    'settings.dataSharing': 'اشتراک‌گذاری داده‌ها',
    'settings.dataDescription': 'نحوه استفاده از داده‌های خود را کنترل کنید',
    'settings.analytics': 'تجزیه و تحلیل',
    'settings.analyticsDescription': 'با داده‌های استفاده به بهبود برنامه کمک کنید',
    'settings.notifications': 'اعلان‌ها',
    'settings.notificationsDescription': 'تنظیمات اعلان‌های خود را مدیریت کنید',
    'settings.emailNotifications': 'اعلان‌های ایمیل',
    'settings.emailDescription': 'به‌روزرسانی‌ها را از طریق ایمیل دریافت کنید',
    'settings.pushNotifications': 'اعلان‌های فوری',
    'settings.pushDescription': 'اعلان‌های فوری دریافت کنید',
    'settings.about': 'درباره بلک‌برن فیتنس',
    'settings.aboutDescription': 'اطلاعات برنامه و پشتیبانی',
    'settings.version': 'نسخه',
    'settings.versionNumber': '1.0.0',
    'settings.support': 'پشتیبانی',
    'settings.supportDescription': 'برای کمک و پشتیبانی با ما تماس بگیرید',
    'settings.language': 'زبان مورد نظر',
    'settings.languageDescription': 'زبان مورد نظر خود را برای رابط کاربری انتخاب کنید',
    'settings.languageUpdated': 'زبان مورد نظر با موفقیت به‌روزرسانی شد',
    
    // Theme
    'theme.light': 'روشن',
    'theme.dark': 'تیره',
    'theme.toggle': 'تغییر تم',
    
    // Language names
    'language.english': 'انگلیسی',
    'language.farsi': 'فارسی',
    'language.arabic': 'عربی',
    'language.spanish': 'اسپانیایی',
    'language.french': 'فرانسوی',
    'language.german': 'آلمانی',
    'language.italian': 'ایتالیایی',
    'language.portuguese': 'پرتغالی',
    'language.russian': 'روسی',
    'language.chinese': 'چینی',
    'language.toggle': 'تغییر زبان',
  },
  ar: {
    // Basic translations for Arabic
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.programs': 'البرامج',
    'nav.wallet': 'المحفظة',
    'nav.payments': 'المدفوعات',
    'nav.referrals': 'الإحالات',
    'nav.friends': 'الأصدقاء',
    'nav.weight': 'تتبع الوزن',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'settings.title': 'الإعدادات',
    'settings.language': 'تفضيل اللغة',
    'settings.languageDescription': 'اختر لغتك المفضلة للواجهة',
    'settings.languageUpdated': 'تم تحديث تفضيل اللغة بنجاح',
    'language.arabic': 'العربية',
  },
  es: {
    // Basic translations for Spanish
    'nav.dashboard': 'Panel de Control',
    'nav.profile': 'Perfil',
    'nav.programs': 'Programas',
    'nav.wallet': 'Billetera',
    'nav.payments': 'Pagos',
    'nav.referrals': 'Referencias',
    'nav.friends': 'Amigos',
    'nav.weight': 'Seguimiento de Peso',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar Sesión',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'settings.title': 'Configuración',
    'settings.language': 'Preferencia de Idioma',
    'settings.languageDescription': 'Elige tu idioma preferido para la interfaz',
    'settings.languageUpdated': 'Preferencia de idioma actualizada exitosamente',
    'language.spanish': 'Español',
  },
  fr: {
    // Basic translations for French
    'nav.dashboard': 'Tableau de Bord',
    'nav.profile': 'Profil',
    'nav.programs': 'Programmes',
    'nav.wallet': 'Portefeuille',
    'nav.payments': 'Paiements',
    'nav.referrals': 'Références',
    'nav.friends': 'Amis',
    'nav.weight': 'Suivi du Poids',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'settings.title': 'Paramètres',
    'settings.language': 'Préférence de Langue',
    'settings.languageDescription': 'Choisissez votre langue préférée pour l\'interface',
    'settings.languageUpdated': 'Préférence de langue mise à jour avec succès',
    'language.french': 'Français',
  },
  de: {
    // Basic translations for German
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profil',
    'nav.programs': 'Programme',
    'nav.wallet': 'Geldbörse',
    'nav.payments': 'Zahlungen',
    'nav.referrals': 'Empfehlungen',
    'nav.friends': 'Freunde',
    'nav.weight': 'Gewichtsverfolgung',
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'settings.title': 'Einstellungen',
    'settings.language': 'Spracheinstellung',
    'settings.languageDescription': 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche',
    'settings.languageUpdated': 'Spracheinstellung erfolgreich aktualisiert',
    'language.german': 'Deutsch',
  },
  it: {
    // Basic translations for Italian
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profilo',
    'nav.programs': 'Programmi',
    'nav.wallet': 'Portafoglio',
    'nav.payments': 'Pagamenti',
    'nav.referrals': 'Referenze',
    'nav.friends': 'Amici',
    'nav.weight': 'Monitoraggio Peso',
    'nav.settings': 'Impostazioni',
    'nav.logout': 'Disconnetti',
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    'settings.title': 'Impostazioni',
    'settings.language': 'Preferenza Lingua',
    'settings.languageDescription': 'Scegli la tua lingua preferita per l\'interfaccia',
    'settings.languageUpdated': 'Preferenza lingua aggiornata con successo',
    'language.italian': 'Italiano',
  },
  pt: {
    // Basic translations for Portuguese
    'nav.dashboard': 'Painel',
    'nav.profile': 'Perfil',
    'nav.programs': 'Programas',
    'nav.wallet': 'Carteira',
    'nav.payments': 'Pagamentos',
    'nav.referrals': 'Referências',
    'nav.friends': 'Amigos',
    'nav.weight': 'Controle de Peso',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'settings.title': 'Configurações',
    'settings.language': 'Preferência de Idioma',
    'settings.languageDescription': 'Escolha seu idioma preferido para a interface',
    'settings.languageUpdated': 'Preferência de idioma atualizada com sucesso',
    'language.portuguese': 'Português',
  },
  ru: {
    // Basic translations for Russian
    'nav.dashboard': 'Панель управления',
    'nav.profile': 'Профиль',
    'nav.programs': 'Программы',
    'nav.wallet': 'Кошелек',
    'nav.payments': 'Платежи',
    'nav.referrals': 'Рефералы',
    'nav.friends': 'Друзья',
    'nav.weight': 'Отслеживание веса',
    'nav.settings': 'Настройки',
    'nav.logout': 'Выйти',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успех',
    'settings.title': 'Настройки',
    'settings.language': 'Предпочтение языка',
    'settings.languageDescription': 'Выберите предпочитаемый язык для интерфейса',
    'settings.languageUpdated': 'Предпочтение языка успешно обновлено',
    'language.russian': 'Русский',
  },
  zh: {
    // Basic translations for Chinese
    'nav.dashboard': '仪表板',
    'nav.profile': '个人资料',
    'nav.programs': '项目',
    'nav.wallet': '钱包',
    'nav.payments': '付款',
    'nav.referrals': '推荐',
    'nav.friends': '朋友',
    'nav.weight': '体重跟踪',
    'nav.settings': '设置',
    'nav.logout': '登出',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'settings.title': '设置',
    'settings.language': '语言偏好',
    'settings.languageDescription': '选择您的界面首选语言',
    'settings.languageUpdated': '语言偏好更新成功',
    'language.chinese': '中文',
  },
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en')
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()

  // Load user's language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      if (status === 'loading') return
      
      if (session?.user) {
        try {
          const response = await fetch('/api/user/language')
          if (response.ok) {
            const data = await response.json()
            setLanguageState(data.language as Language)
          }
        } catch (error) {
          console.error('Error loading language preference:', error)
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedLanguage = localStorage.getItem('language') as Language
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage)
        } else {
          // Check browser language
          const browserLanguage = navigator.language.toLowerCase()
          if (browserLanguage.startsWith('fa') || browserLanguage.startsWith('per')) {
            setLanguageState('fa')
          } else if (browserLanguage.startsWith('ar')) {
            setLanguageState('ar')
          } else if (browserLanguage.startsWith('es')) {
            setLanguageState('es')
          } else if (browserLanguage.startsWith('fr')) {
            setLanguageState('fr')
          } else if (browserLanguage.startsWith('de')) {
            setLanguageState('de')
          } else if (browserLanguage.startsWith('it')) {
            setLanguageState('it')
          } else if (browserLanguage.startsWith('pt')) {
            setLanguageState('pt')
          } else if (browserLanguage.startsWith('ru')) {
            setLanguageState('ru')
          } else if (browserLanguage.startsWith('zh')) {
            setLanguageState('zh')
          } else {
            setLanguageState('en')
          }
        }
      }
      
      setLoading(false)
    }

    loadLanguage()
  }, [session, status])

  // Update language preference
  const setLanguage = async (newLanguage: Language) => {
    setLoading(true)
    
    try {
      if (session?.user) {
        // Update in database for authenticated users
        const response = await fetch('/api/user/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: newLanguage }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update language preference')
        }
      } else {
        // Save to localStorage for non-authenticated users
        localStorage.setItem('language', newLanguage)
      }
      
      setLanguageState(newLanguage)
      
      // Update document direction for RTL languages
      document.documentElement.dir = ['fa', 'ar'].includes(newLanguage) ? 'rtl' : 'ltr'
      document.documentElement.lang = newLanguage
      
    } catch (error) {
      console.error('Error updating language preference:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Translation function
  const t = (key: string, fallback?: string): string => {
    const translation = translations[language]?.[key]
    return translation || fallback || key
  }

  // Set document direction and language on language change
  useEffect(() => {
    document.documentElement.dir = ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const value: LanguageContextType = {
    language,
    setLanguage,
    loading,
    translations: translations[language] || translations.en,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export type { Language }