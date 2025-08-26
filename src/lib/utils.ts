import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// BMI calculation utility
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Number((weightKg / (heightM * heightM)).toFixed(1))
}

// BMI category utility
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal weight"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

// Format currency (Toman)
export function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

// Format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Generate referral code
export function generateReferralCode(telegramId: number): string {
  return `BF${telegramId.toString().slice(-6).padStart(6, '0')}`
}