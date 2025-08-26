import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/50 to-black opacity-95" />
        <div className="relative container mx-auto px-4 py-32 text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight">
            Transform Your Body,
            <br />
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Transform Your Life</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Professional fitness programs, personalized coaching, and comprehensive tracking tools to help you achieve your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-10 py-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-105">
                Get Started Today
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300 hover:scale-105">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-950/95">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-16 text-white tracking-tight">
            Why Choose <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">BlackBurn Fitness</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Professional Programs</CardTitle>
                <CardDescription className="text-gray-400">
                  Expert-designed fitness programs tailored to your goals and fitness level
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Weight Tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive weight and BMI tracking with detailed progress analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Referral Rewards</CardTitle>
                <CardDescription className="text-gray-400">
                  Earn cashback by referring friends and building your fitness community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Secure Payments</CardTitle>
                <CardDescription className="text-gray-400">
                  Safe and secure payment processing with receipt verification
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Telegram Integration</CardTitle>
                <CardDescription className="text-gray-400">
                  Seamless login and notifications through Telegram for convenience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-black/90 border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Personal Dashboard</CardTitle>
                <CardDescription className="text-gray-400">
                  Centralized hub for all your fitness data, progress, and programs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-red-600 to-red-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-8 text-white tracking-tight">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-xl mb-12 text-red-100 max-w-2xl mx-auto">
            Join thousands of users who have transformed their lives with BlackBurn Fitness
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="text-lg px-10 py-6 bg-white text-red-600 hover:bg-gray-100 font-semibold rounded-xl shadow-2xl transition-all duration-300 hover:scale-105">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-red-500/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-lg">
            © 2024 <span className="text-red-500 font-semibold">BlackBurn Fitness</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
