# Blackburn Fitness App - Components Inventory

## Overview
This document provides a comprehensive inventory of all UI components, pages, and design elements in the Blackburn Fitness application for the upcoming theme redesign.

## Pages Structure

### Authentication Pages
- **Login Page** (`/auth/login`)
  - Login form with email/password fields
  - Social login buttons
  - "Remember me" checkbox
  - "Forgot password" link
  - Registration redirect link

- **Register Page** (`/auth/register`)
  - Registration form with multiple fields
  - Terms and conditions checkbox
  - Login redirect link

### Main Application Pages

#### Dashboard (`/dashboard`)
- **Main Dashboard Layout**
  - Welcome header with user greeting
  - Stats cards (weight, goals, progress)
  - Quick action buttons
  - Recent activity feed
  - Progress charts/graphs

#### User Profile (`/profile`)
- **Profile Management**
  - Profile picture upload
  - Personal information form
  - Settings toggles
  - Account preferences

#### Programs (`/programs`)
- **Programs Listing**
  - Program cards with images
  - Filter and search functionality
  - Category tabs
  - Enrollment buttons

#### Weight Tracking (`/weight`)
- **Weight Management**
  - Weight entry form
  - Weight history chart
  - Goal setting interface
  - Progress indicators

#### Payments (`/payments`)
- **Payment History**
  - Transaction list
  - Payment status indicators
  - Invoice download buttons
  - Payment method management

#### Wallet (`/wallet`)
- **Digital Wallet**
  - Balance display
  - Transaction history
  - Top-up interface
  - Withdrawal options

#### Referrals (`/referrals`)
- **Referral System**
  - Referral code display
  - Referral statistics
  - Earnings tracker
  - Social sharing buttons

#### Settings (`/settings`)
- **Application Settings**
  - Account settings form
  - Privacy preferences
  - Notification settings
  - Language selector
  - Theme toggle

#### Admin Panel (`/admin`)
- **Admin Dashboard**
  - Admin statistics overview
  - User management table
  - Program management interface
  - System settings

## UI Components Inventory

### Layout Components

#### Header/Navigation
- **Main Header** (`src/components/layout/Header.tsx`)
  - Logo/brand
  - Navigation menu
  - User avatar dropdown
  - Notifications bell
  - Search bar

- **Sidebar Navigation** (`src/components/layout/Sidebar.tsx`)
  - Navigation links
  - User profile section
  - Collapse/expand functionality
  - Active state indicators

#### Footer
- **Main Footer**
  - Copyright information
  - Legal links
  - Social media icons
  - Contact information

### Form Components

#### Input Elements
- **Text Input Fields**
  - Standard text inputs
  - Password inputs with visibility toggle
  - Email inputs with validation
  - Number inputs for measurements

- **Select Dropdowns**
  - Single select dropdowns
  - Multi-select options
  - Searchable selects

- **Checkboxes and Radio Buttons**
  - Standard checkboxes
  - Radio button groups
  - Toggle switches

- **Buttons**
  - Primary action buttons
  - Secondary buttons
  - Danger/warning buttons
  - Icon buttons
  - Loading state buttons

#### Form Layouts
- **Form Containers**
  - Card-based forms
  - Multi-step forms
  - Inline forms
  - Validation error displays

### Data Display Components

#### Cards
- **Info Cards**
  - Statistics cards
  - Program cards
  - User profile cards
  - Payment cards

- **Interactive Cards**
  - Clickable program cards
  - Expandable info cards
  - Action cards with buttons

#### Tables
- **Data Tables**
  - User management tables
  - Transaction history tables
  - Sortable columns
  - Pagination controls

#### Lists
- **Activity Lists**
  - Recent activity feeds
  - Notification lists
  - Menu lists

### Interactive Components

#### Modals and Dialogs
- **Confirmation Dialogs**
  - Delete confirmations
  - Action confirmations
  - Success/error messages

- **Content Modals**
  - Profile edit modals
  - Image upload modals
  - Settings modals

#### Notifications
- **Toast Notifications**
  - Success messages
  - Error alerts
  - Warning notifications
  - Info messages

- **Alert Banners**
  - System announcements
  - Maintenance notices
  - Feature updates

### Utility Components

#### Loading States
- **Spinners**
  - Page loading spinners
  - Button loading states
  - Content loading skeletons

#### Icons
- **Icon System**
  - Navigation icons
  - Action icons
  - Status indicators
  - Social media icons

#### Progress Indicators
- **Progress Bars**
  - Goal progress bars
  - Upload progress
  - Multi-step progress

- **Badges and Labels**
  - Status badges
  - Category labels
  - Notification counters

## Current Design Issues Identified

### Color Scheme Problems
- Inconsistent color usage across components
- Poor contrast ratios affecting accessibility
- Lack of cohesive brand colors
- Generic default styling

### Typography Issues
- Inconsistent font sizes and weights
- Poor hierarchy in text elements
- Lack of professional typography scale

### Component Styling Problems
- Generic button designs
- Inconsistent spacing and padding
- Lack of visual hierarchy
- Poor hover and active states

### Layout Issues
- Inconsistent component spacing
- Poor responsive design implementation
- Lack of visual balance
- Generic card and container designs

## Files to be Modified

### Global Styles
- `src/app/globals.css`
- `tailwind.config.ts`

### Layout Components
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/app/layout.tsx`

### UI Components
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/badge.tsx`
- All other UI components in `src/components/ui/`

### Page Components
- All dashboard components in `src/components/dashboard/`
- All auth components in `src/components/auth/`
- Individual page files in `src/app/`

### Context and Providers
- `src/contexts/ThemeContext.tsx`
- `src/components/providers/`

## Next Steps
1. Create detailed theme strategy document
2. Update global color palette and typography
3. Redesign core UI components
4. Apply new theme to layout components
5. Update all page-specific components
6. Test for consistency and accessibility

---
*Generated for Blackburn Fitness App Theme Redesign Project*