import Link from "next/link"
import { Github, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-red-500/30 bg-black/95 backdrop-blur-xl mt-auto shadow-2xl">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent">
                BlackBurn Fitness
              </span>
            </h3>
            <p className="text-gray-400 mb-4">
              Transform your body and mind with our comprehensive fitness programs. 
              Join thousands of members achieving their fitness goals.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 p-2 rounded-lg hover:bg-red-500/10">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 p-2 rounded-lg hover:bg-red-500/10">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 p-2 rounded-lg hover:bg-red-500/10">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 tracking-wide">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/programs" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/weight" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Weight Tracking
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 tracking-wide">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block py-1">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-red-500/30 mt-8 pt-8 text-center">
          <p className="text-gray-400 font-medium">
            © {new Date().getFullYear()} BlackBurn Fitness. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}