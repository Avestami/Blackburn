# Blackburn Fitness App - Pages and Components Documentation

## Overview
This document provides a comprehensive list of all pages, components, hooks, contexts, and API routes in the Blackburn Fitness application.

## 📱 Pages (User Interface)

### Public Pages
- **Home Page** - `src/app/page.tsx`
- **Sign In** - `src/app/auth/signin/page.tsx`
- **Sign Up** - `src/app/auth/signup/page.tsx`

### User Dashboard Pages
- **Dashboard** - `src/app/dashboard/page.tsx`
- **Profile** - `src/app/profile/page.tsx`
- **Weight Tracking** - `src/app/weight/page.tsx`
- **Wallet** - `src/app/wallet/page.tsx`
- **Payments** - `src/app/payments/page.tsx`
- **Referrals** - `src/app/referrals/page.tsx`
- **Settings** - `src/app/settings/page.tsx`
- **Programs** - `src/app/programs/` (directory exists but no page.tsx found)

### Admin Pages
- **Admin Dashboard** - `src/app/admin/page.tsx`
- **Admin Users Management** - `src/app/admin/users/page.tsx`
- **Admin Payments Management** - `src/app/admin/payments/page.tsx`
- **Admin Programs Management** - `src/app/admin/programs/page.tsx`

### Layout Components
- **Root Layout** - `src/app/layout.tsx`
- **Admin Layout** - `src/app/admin/layout.tsx`

## 🧩 Components

### UI Components (Shadcn/UI)
- **Alert** - `src/components/ui/alert.tsx`
- **Badge** - `src/components/ui/badge.tsx`
- **Button** - `src/components/ui/button.tsx`
- **Card** - `src/components/ui/card.tsx`
- **Dialog** - `src/components/ui/dialog.tsx`
- **Input** - `src/components/ui/input.tsx`
- **Label** - `src/components/ui/label.tsx`
- **Select** - `src/components/ui/select.tsx`
- **Separator** - `src/components/ui/separator.tsx`
- **Table** - `src/components/ui/table.tsx`
- **Tabs** - `src/components/ui/tabs.tsx`
- **Textarea** - `src/components/ui/textarea.tsx`
- **Toast** - `src/components/ui/toast.tsx`
- **Toaster** - `src/components/ui/toaster.tsx`
- **Use Toast Hook** - `src/components/ui/use-toast.ts`

### Layout Components
- **Navbar** - `src/components/layout/navbar.tsx`
- **Footer** - `src/components/layout/footer.tsx`

### Feature Components
- **Background Nodes** - `src/components/BackgroundNodes.tsx`
- **Language Selector** - `src/components/LanguageSelector.tsx`
- **Dashboard Content** - `src/components/dashboard/dashboard-content.tsx`
- **User Search** - `src/components/search/user-search.tsx`

### Authentication Components
- **Sign Out Button** - `src/components/auth/sign-out-button.tsx`

### Provider Components
- **Session Provider** - `src/components/providers/session-provider.tsx`

## 🎣 Custom Hooks
- **usePayments** - `src/hooks/use-payments.ts`
- **useProfile** - `src/hooks/use-profile.ts`
- **usePrograms** - `src/hooks/use-programs.ts`
- **useReferrals** - `src/hooks/use-referrals.ts`
- **useUserStats** - `src/hooks/use-user-stats.ts`
- **useWallet** - `src/hooks/use-wallet.ts`
- **useWeight** - `src/hooks/use-weight.ts`

## 🌐 Context Providers
- **Language Context** - `src/contexts/LanguageContext.tsx`
- **Theme Context** - `src/contexts/ThemeContext.tsx`

## 🔌 API Routes

### Authentication APIs
- **NextAuth** - `src/app/api/auth/[...nextauth]/route.ts`
- **Sign Up** - `src/app/api/auth/signup/route.ts`

### User APIs
- **User Profile** - `src/app/api/user/profile/route.ts`
- **User BMI** - `src/app/api/user/bmi/route.ts`
- **User Goals** - `src/app/api/user/goals/route.ts`
- **User Goal Progress** - `src/app/api/user/goals/[id]/route.ts`
- **User Language** - `src/app/api/user/language/route.ts`
- **User Nutrition** - `src/app/api/user/nutrition/route.ts`
- **User Nutrition by ID** - `src/app/api/user/nutrition/[id]/route.ts`
- **User Onboarding** - `src/app/api/user/onboarding/route.ts`
- **User Referrals** - `src/app/api/user/referrals/route.ts`
- **User Subscriptions** - `src/app/api/user/subscriptions/route.ts`
- **User Wallet** - `src/app/api/user/wallet/route.ts`
- **User Weight** - `src/app/api/user/weight/route.ts`
- **User Weight by ID** - `src/app/api/user/weight/[id]/route.ts`
- **User Workouts** - `src/app/api/user/workouts/route.ts`
- **User Workout by ID** - `src/app/api/user/workouts/[id]/route.ts`
- **User Workout Details** - `src/app/api/user/workouts/[workoutId]/route.ts`

### Admin APIs
- **Admin Users** - `src/app/api/admin/users/route.ts`
- **Admin Payments** - `src/app/api/admin/payments/route.ts`
- **Admin Programs** - `src/app/api/admin/programs/route.ts`
- **Admin Program Subscriptions** - `src/app/api/admin/programs/[programId]/subscriptions/route.ts`

### Public APIs
- **Programs** - `src/app/api/programs/route.ts`
- **Program by ID** - `src/app/api/programs/[id]/route.ts`
- **Payments** - `src/app/api/payments/route.ts`
- **Payment by ID** - `src/app/api/payments/[id]/route.ts`

### Utility APIs
- **Upload Receipt** - `src/app/api/upload/receipt/route.ts`

## 📁 File Structure Summary

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── [other-pages]/     # Feature pages
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/UI components
│   ├── layout/           # Layout components
│   ├── auth/             # Auth-related components
│   ├── dashboard/        # Dashboard components
│   ├── search/           # Search components
│   └── providers/        # Context providers
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
└── lib/                  # Utility libraries
```

## 🎨 Styling & UI Framework
- **CSS Framework**: Tailwind CSS
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Icons**: Lucide React
- **Styling**: CSS-in-JS with Tailwind classes

## 📱 Responsive Design Status
*To be analyzed in the next phase*

## 🔧 PWA Readiness Status
*To be implemented in the next phase*

---

**Last Updated**: January 2025
**Total Pages**: 12 user pages + 4 admin pages
**Total Components**: 25+ reusable components
**Total API Routes**: 30+ endpoints
**Total Hooks**: 7 custom hooks
**Total Contexts**: 2 context providers