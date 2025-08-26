# Blackburn Fitness Application - Project Documentation

## 🏋️ Project Overview

Blackburn Fitness is a comprehensive fitness management application built with Next.js 14, featuring user authentication, workout programs, social features, and financial management capabilities. The application provides both user and admin interfaces with modern UI/UX design.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React Icons
- **State Management**: React Context API
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **Database**: SQLite (Prisma ORM)
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js with Credentials Provider

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Database**: SQLite (containerized)
- **Web Server**: Nginx (reverse proxy)
- **SSL**: Let's Encrypt certificates

## 📱 Core Features Implemented

### 1. Authentication System
- **User Registration & Login**: Secure credential-based authentication
- **Session Management**: NextAuth.js session handling
- **Role-Based Access**: Admin and regular user roles
- **Password Security**: Bcrypt hashing

### 2. User Dashboard
- **Personal Dashboard**: Overview of user activities and stats
- **Profile Management**: User profile editing and preferences
- **Settings**: Theme (light/dark), language preferences
- **Responsive Design**: Mobile-first approach with hamburger menu

### 3. Workout Programs System
- **Program Catalog**: Browse available fitness programs
- **Difficulty Levels**: Beginner, Intermediate, Advanced classifications
- **Program Details**: Comprehensive program information
- **User Enrollment**: Join and track program progress

### 4. Social Features
- **Friends System**: Add and manage fitness buddies
- **Social Dashboard**: View friends' activities
- **Community Interaction**: Social engagement features

### 5. Financial Management

#### Wallet System
- **Digital Wallet**: User balance management
- **Deposit/Withdrawal**: Credit card integration
- **Transaction History**: Complete financial records
- **Admin Approval**: Secure transaction workflow
- **Payment Processing**: Secure financial operations

#### Referral System
- **Referral Codes**: Unique code generation for users
- **Signup Tracking**: Monitor referral-based registrations
- **Referral Statistics**: Analytics and performance metrics
- **Reward System**: Incentivize user referrals

### 6. Weight Tracking
- **Weight Logging**: Record and track weight changes
- **Progress Visualization**: Charts and progress indicators
- **Goal Setting**: Weight management objectives
- **Historical Data**: Long-term tracking capabilities

### 7. Admin Panel
- **User Management**: Admin oversight of user accounts
- **Program Management**: Create and manage fitness programs
- **Financial Oversight**: Transaction approvals and monitoring
- **System Analytics**: Platform usage statistics
- **Content Management**: Admin-only content creation

### 8. UI/UX Features
- **Responsive Design**: Mobile, tablet, and desktop optimization
- **Dark/Light Theme**: User preference-based theming
- **Multi-language Support**: Internationalization ready
- **Modern UI**: Clean, intuitive interface design
- **Accessibility**: WCAG compliance considerations

## 🗄️ Database Schema

### Core Tables
- **Users**: Authentication and profile data
- **Programs**: Fitness program information
- **Transactions**: Financial transaction records
- **Referrals**: Referral tracking and statistics
- **Weights**: User weight tracking data
- **Friends**: Social connections between users

## 🔧 Technical Implementation Details

### Authentication Flow
1. NextAuth.js configuration with credentials provider
2. Bcrypt password hashing
3. JWT session management
4. Role-based middleware protection

### API Architecture
- RESTful API design with Next.js API routes
- Prisma ORM for database operations
- Error handling and validation
- Authentication middleware for protected routes

### State Management
- React Context for theme and language preferences
- Custom hooks for data fetching and state management
- Server-side rendering for optimal performance

### Security Features
- CSRF protection
- SQL injection prevention (Prisma ORM)
- Secure session handling
- Input validation and sanitization

## 🐳 Docker Configuration

### Multi-Container Setup
- **App Container**: Next.js application
- **Database Container**: SQLite with persistent volumes
- **Nginx Container**: Reverse proxy and SSL termination

### Environment Configuration
- Production-ready environment variables
- Secure database connections
- SSL certificate management

## 🌐 Deployment Architecture

### VPS Deployment
- **Server**: 103.75.197.66
- **Port**: 4444
- **Domain**: burn.blckbrd.ir
- **SSL**: Let's Encrypt certificates
- **Reverse Proxy**: Nginx configuration

## 📊 Performance Optimizations

### Frontend Optimizations
- Next.js App Router for optimal routing
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Tailwind CSS purging for minimal bundle size

### Backend Optimizations
- Database query optimization with Prisma
- API response caching strategies
- Efficient session management

## 🔒 Security Measures

### Data Protection
- Encrypted password storage
- Secure session management
- HTTPS enforcement
- Input validation and sanitization

### Access Control
- Role-based permissions
- Protected API routes
- Admin-only functionality
- Secure financial transactions

## 🚀 Recent Implementations & Bug Fixes

### Major Features Added
1. **Complete Wallet System**: Deposit, withdrawal, and transaction management
2. **Referral Program**: Code generation, tracking, and analytics
3. **Mobile Responsiveness**: Hamburger menu and mobile-optimized UI
4. **Admin Dashboard**: Comprehensive administrative controls

### Critical Bug Fixes
1. **UI Dependencies**: Fixed missing Radix UI components
2. **Function Conflicts**: Resolved duplicate function definitions
3. **Type Errors**: Fixed TypeScript compilation issues
4. **Port Configuration**: Aligned development server ports
5. **React Hooks**: Fixed hooks order violations
6. **API Connectivity**: Resolved middleware and routing issues
7. **Navigation Errors**: Fixed client-side routing problems

## 📈 Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Mobile app development
- Integration with fitness wearables
- Advanced social features
- Subscription management system

### Technical Improvements
- Performance monitoring
- Advanced caching strategies
- Microservices architecture consideration
- Enhanced security measures

## 🛠️ Development Workflow

### Local Development
```bash
npm install
npm run dev
```

### Database Management
```bash
npx prisma generate
npx prisma db push
npx prisma studio
```

### Docker Development
```bash
docker-compose up --build
```

## 📝 Project Status

**Current Status**: ✅ Production Ready

- All core features implemented and tested
- Mobile responsiveness completed
- Security measures in place
- Docker configuration ready
- Deployment scripts prepared

**Next Steps**: 
1. Docker containerization with database
2. GitHub repository push
3. VPS deployment
4. SSL certificate configuration
5. Domain setup (burn.blckbrd.ir)

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Status: Ready for Production Deployment*