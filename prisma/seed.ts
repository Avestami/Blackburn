import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminEmail = 'admin@blackburnfitness.com'
  const adminPassword = 'BlackburnAdmin2024!'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          isOnboarded: true,
        },
      },
      wallet: {
        create: {
          balance: 0,
          currency: 'IRT',
        },
      },
    },
  })

  console.log('✅ Admin user created:')
  console.log('📧 Email:', adminEmail)
  console.log('🔑 Password:', adminPassword)
  console.log('👤 Username:', 'admin')
  console.log('🆔 User ID:', adminUser.id)

  // Create some sample programs
  const programs = [
    {
      name: 'Strength Builder Pro',
      description: 'Build muscle and increase strength with our comprehensive program',
      price: 99000, // 99,000 IRT
      duration: 84, // 12 weeks
      category: 'Strength Training',
      features: JSON.stringify([
        'Personal trainer guidance',
        'Custom workout plans',
        'Progress tracking',
        'Nutrition guidance',
        '24/7 support'
      ]),
    },
    {
      name: 'Fat Burn Accelerator',
      description: 'High-intensity workouts designed for maximum fat loss',
      price: 79000, // 79,000 IRT
      duration: 56, // 8 weeks
      category: 'Weight Loss',
      features: JSON.stringify([
        'HIIT workouts',
        'Cardio programs',
        'Diet plans',
        'Weekly check-ins'
      ]),
    },
    {
      name: 'Athletic Performance',
      description: 'Elite training for serious athletes and competitors',
      price: 149000, // 149,000 IRT
      duration: 112, // 16 weeks
      category: 'Athletic Performance',
      features: JSON.stringify([
        'Sport-specific training',
        'Performance analytics',
        'Recovery protocols',
        'Mental coaching'
      ]),
    },
    {
      name: 'Wellness & Mobility',
      description: 'Focus on flexibility, recovery, and overall wellness',
      price: 49000, // 49,000 IRT
      duration: 42, // 6 weeks
      category: 'Wellness',
      features: JSON.stringify([
        'Yoga sessions',
        'Stretching routines',
        'Meditation guidance',
        'Stress management'
      ]),
    },
  ]

  for (const program of programs) {
    const existingProgram = await prisma.program.findFirst({
      where: { name: program.name },
    })
    
    if (!existingProgram) {
      await prisma.program.create({
        data: program,
      })
    }
  }

  console.log('✅ Sample programs created')
  console.log('🌱 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })