'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Zap, Trophy, Target, ArrowRight, Play, Users, TrendingUp, Activity, Calendar, Award } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Session } from "next-auth"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface DashboardContentProps {
  session: Session
}

export function DashboardContent({ session }: DashboardContentProps) {
  const { t } = useLanguage()
  const heroRef = useRef<HTMLDivElement>(null)
  const programsRef = useRef<HTMLDivElement>(null)
  const programsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Enhanced Hero section animations
    if (heroRef.current) {
      const tl = gsap.timeline()
      
      // Create floating particles
      const particles = []
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div')
        particle.className = 'hero-particle'
        particle.style.cssText = `
          position: absolute;
          width: ${Math.random() * 4 + 2}px;
          height: ${Math.random() * 4 + 2}px;
          background: rgba(239, 68, 68, ${Math.random() * 0.5 + 0.2});
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
        `
        heroRef.current.appendChild(particle)
        particles.push(particle)
        
        // Animate particles
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * 600 + 100
        })
        
        gsap.to(particle, {
          y: '-=100',
          x: `+=${Math.random() * 200 - 100}`,
          opacity: 0,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          ease: 'power2.out',
          delay: Math.random() * 2
        })
      }
      
      // Background gradient animation
      const bgGradient = heroRef.current.querySelector('.hero-bg-gradient')
      if (bgGradient) {
        gsap.to(bgGradient, {
          backgroundPosition: '200% 200%',
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }
      
      // Main hero animations with enhanced effects
      tl.fromTo(heroRef.current.querySelector('.hero-title'), 
        { opacity: 0, y: 80, scale: 0.8, rotationX: 45 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1.2, ease: 'power3.out' }
      )
      .fromTo(heroRef.current.querySelector('.hero-subtitle'),
        { opacity: 0, y: 50, x: -30 },
        { opacity: 1, y: 0, x: 0, duration: 1, ease: 'power3.out' }, '-=0.6'
      )
      .fromTo(heroRef.current.querySelectorAll('.hero-stat'),
        { opacity: 0, scale: 0.5, y: 40, rotationY: 45 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          rotationY: 0,
          duration: 0.8, 
          stagger: 0.15, 
          ease: 'back.out(2)'
        }, '-=0.4'
      )
      .fromTo(heroRef.current.querySelectorAll('.hero-button'),
        { opacity: 0, y: 30, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6, 
          stagger: 0.1, 
          ease: 'power3.out'
        }, '-=0.3'
      )
      
      // Add continuous floating animation to stats
      heroRef.current.querySelectorAll('.hero-stat').forEach((stat, index) => {
        gsap.to(stat, {
          y: Math.sin(index) * 10,
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.2
        })
      })
      
      // Add glow effect animation
       const glowElements = heroRef.current.querySelectorAll('.hero-glow')
       glowElements.forEach(element => {
         gsap.to(element, {
           boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)',
           duration: 2,
           repeat: -1,
           yoyo: true,
           ease: 'sine.inOut'
         })
       })
       
       // Add interactive hover animations for stats
       heroRef.current.querySelectorAll('.hero-stat').forEach((stat) => {
         const statElement = stat as HTMLElement
         
         statElement.addEventListener('mouseenter', () => {
           gsap.to(stat, {
             scale: 1.1,
             rotationY: 10,
             z: 20,
             boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
             duration: 0.3,
             ease: 'power2.out'
           })
         })
         
         statElement.addEventListener('mouseleave', () => {
           gsap.to(stat, {
             scale: 1,
             rotationY: 0,
             z: 0,
             boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
             duration: 0.3,
             ease: 'power2.out'
           })
         })
       })
     }

    // Featured Programs horizontal scroll animation
    if (programsContainerRef.current && programsRef.current) {
      const container = programsContainerRef.current
      const programsWrapper = programsRef.current
      const cards = programsWrapper.querySelectorAll('.program-card')
      
      // Set up horizontal scroll
      const totalWidth = cards.length * 320 + (cards.length - 1) * 24 // card width + gap
      
      gsap.set(programsWrapper, { width: totalWidth })
      
      // Animate cards on load
      gsap.fromTo(cards,
        { opacity: 0, x: 50, rotateY: 15 },
        { 
          opacity: 1, 
          x: 0, 
          rotateY: 0,
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'power3.out',
          delay: 0.5
        }
      )

      // Horizontal scroll trigger
      ScrollTrigger.create({
        trigger: container,
        start: 'top center',
        end: () => `+=${totalWidth - container.offsetWidth}`,
        scrub: 1,
        pin: false,
        onUpdate: (self) => {
          const progress = self.progress
          const maxScroll = totalWidth - container.offsetWidth
          gsap.set(programsWrapper, {
            x: -progress * maxScroll
          })
        }
      })

      // Add hover animations for cards
      cards.forEach((card) => {
        const cardElement = card as HTMLElement
        
        cardElement.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            rotateY: 5,
            z: 50,
            duration: 0.3,
            ease: 'power2.out'
          })
        })
        
        cardElement.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            rotateY: 0,
            z: 0,
            duration: 0.3,
            ease: 'power2.out'
          })
        })
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Professional Hero Section */}
      <div ref={heroRef} className="relative mb-16 overflow-hidden rounded-3xl" style={{ perspective: '1000px' }}>
        {/* Animated Background Gradient */}
        <div className="hero-bg-gradient absolute inset-0 bg-gradient-to-br from-red-600/15 via-purple-600/10 to-red-800/10 rounded-3xl" style={{ backgroundSize: '200% 200%' }} />
        
        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-black/20 rounded-3xl" />
        
        {/* Main Hero Content */}
        <div className="relative z-10 text-center py-16 px-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="hero-title text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                {t('dashboard.welcomeBack')},
                <br />
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  {session.user?.name?.split(' ')[0] || t('dashboard.champion')}
                </span>
              </h1>
              <p className="hero-subtitle text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                {t('dashboard.transformBody')}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="hero-stat bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-center mb-3">
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">2,847</div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Active Members</div>
              </div>
              <div className="hero-stat bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-center mb-3">
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">156</div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Days This Year</div>
              </div>
              <div className="hero-stat bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-center mb-3">
                  <Award className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">98%</div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Success Rate</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/programs">
                <Button className="hero-button hero-glow bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-2xl shadow-red-600/25 transition-all duration-300 hover:scale-105">
                  <Play className="h-6 w-6 mr-3" />
                  {t('dashboard.startWorkout')}
                </Button>
              </Link>
              <Link href="/programs">
                <Button variant="outline" className="hero-button border-2 border-white/20 text-white hover:bg-white/10 px-10 py-4 text-lg font-semibold rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-105">
                  <Target className="h-6 w-6 mr-3" />
                  {t('dashboard.viewPrograms')}
                </Button>
              </Link>
            </div>

            {/* Motivational Quote */}
            <div className="mt-12 animate-fade-in-delay-2">
              <blockquote className="text-lg text-gray-400 italic max-w-2xl mx-auto">
                "The groundwork for all happiness is good health."
              </blockquote>
              <cite className="text-red-400 text-sm mt-2 block">— Leigh Hunt</cite>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Featured Programs Section */}
      <div ref={programsContainerRef} className="mb-12 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Featured Programs</h2>
          <Link href="/programs">
            <Button variant="ghost" className="text-red-400 hover:text-white hover:bg-red-500/10">
              {t('dashboard.viewAll')} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="pb-4" style={{ perspective: '1000px' }}>
          <div ref={programsRef} className="flex gap-6" style={{ transformStyle: 'preserve-3d' }}>
            {/* Program Card 1 */}
            <Card className="program-card w-80 bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-md border-red-500/30 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-600 text-white">POPULAR</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm">4.9</span>
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Strength Builder Pro</CardTitle>
                <CardDescription className="text-gray-300">
                  Build muscle and increase strength with our comprehensive program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">2,847 enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">12-week program</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Advanced level</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">$99</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <Link href="/programs">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Program Card 2 */}
            <Card className="program-card w-80 bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border-green-500/30 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-600 text-white">NEW</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm">4.8</span>
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Fat Burn Accelerator</CardTitle>
                <CardDescription className="text-gray-300">
                  High-intensity workouts designed for maximum fat loss
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">1,923 enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">8-week program</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Intermediate level</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">$79</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <Link href="/programs">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Program Card 3 */}
            <Card className="program-card w-80 bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border-purple-500/30 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-purple-600 text-white">PREMIUM</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm">4.7</span>
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Athletic Performance</CardTitle>
                <CardDescription className="text-gray-300">
                  Elite training for serious athletes and competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">856 enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">16-week program</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Expert level</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">$149</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <Link href="/programs">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Program Card 4 */}
            <Card className="program-card w-80 bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border-blue-500/30 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-600 text-white">WELLNESS</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm">4.6</span>
                  </div>
                </div>
                <CardTitle className="text-white text-xl">Wellness & Mobility</CardTitle>
                <CardDescription className="text-gray-300">
                  Focus on flexibility, recovery, and overall wellness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">1,234 enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">6-week program</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Beginner level</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">$49</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <Link href="/programs">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Admin Panel Access */}
      {session.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role) && (
        <div className="mt-8">
          <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-400">Admin Panel</CardTitle>
              <CardDescription className="text-gray-300">
                Access administrative functions and manage the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="default" className="w-full">
                  Access Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}