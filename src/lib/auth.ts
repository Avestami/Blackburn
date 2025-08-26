import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import crypto from "crypto"
import bcrypt from "bcryptjs"

// Telegram login schema
const telegramLoginSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.string(),
  hash: z.string(),
})

// Verify Telegram login data
function verifyTelegramAuth(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...authData } = data
  
  // Create data-check-string
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n')
  
  // Create secret key
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  
  // Create hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')
  
  return calculatedHash === hash
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "ID", type: "text" },
        first_name: { label: "First Name", type: "text" },
        last_name: { label: "Last Name", type: "text" },
        username: { label: "Username", type: "text" },
        photo_url: { label: "Photo URL", type: "text" },
        auth_date: { label: "Auth Date", type: "text" },
        hash: { label: "Hash", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        
        try {
          // Validate input
          const validatedData = telegramLoginSchema.parse(credentials)
          
          // Verify Telegram auth
          const botToken = process.env.TELEGRAM_BOT_TOKEN!
          if (!verifyTelegramAuth(validatedData, botToken)) {
            return null
          }
          
          // Check if auth is recent (within 1 hour)
          const authDate = parseInt(validatedData.auth_date)
          const now = Math.floor(Date.now() / 1000)
          if (now - authDate > 3600) {
            return null
          }
          
          const telegramId = parseInt(validatedData.id)
          
          // Find or create user
          let user = await prisma.user.findUnique({
            where: { telegramId: telegramId.toString() }
          })

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                telegramId: telegramId.toString(),
                username: validatedData.username,
                firstName: validatedData.first_name,
                lastName: validatedData.last_name,
                email: validatedData.username ? `${validatedData.username}@telegram.user` : `${telegramId}@telegram.user`,
                role: "USER",
                isActive: true,
              }
            })
            
            // Create wallet for new user
            await prisma.wallet.create({
              data: {
                userId: user.id,
                balance: 0,
                currency: "IRT",
              }
            })
            
            // Create profile for new user
            await prisma.profile.create({
              data: {
                userId: user.id,
                profilePicture: validatedData.photo_url,
              }
            })
          }
          
          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim() || user.username,
            email: user.email,
            telegramId: user.telegramId || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error("Telegram auth error:", error)
          return null
        }
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        telegramId: { label: "Telegram ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        
        try {
          let user;
          
          // Check if it's Telegram ID login or email login
          if (credentials.telegramId) {
            // Telegram ID + password login
            user = await prisma.user.findUnique({
              where: { telegramId: credentials.telegramId }
            })
            
            if (!user || !user.password) {
              return null
            }
            
            const isValidPassword = await bcrypt.compare(credentials.password, user.password)
            if (!isValidPassword) {
              return null
            }
          } else {
            // Email + password login
            user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })
            
            if (!user || !user.password) {
              return null
            }
            
            const isValidPassword = await bcrypt.compare(credentials.password, user.password)
            if (!isValidPassword) {
              return null
            }
          }
          
          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim() || user.username,
            email: user.email,
            telegramId: user.telegramId || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error("Credentials auth error:", error)
          return null
        }
      },
    }),

  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.telegramId = user.telegramId
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.telegramId = token.telegramId as string
        session.user.role = token.role as string
        session.user.name = token.username as string
      }
      return session
    },
  },
}

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    telegramId?: string
    role?: string
    username?: string
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      telegramId?: string
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    telegramId?: string
    role?: string
    username?: string
  }
}