'use client'

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ 
  variant = "outline", 
  size = "default", 
  className,
  children = "Sign Out"
}: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Button 
      variant={variant}
      size={size}
      className={`border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400 ${className}`}
      onClick={handleSignOut}
    >
      {children}
    </Button>
  )
}