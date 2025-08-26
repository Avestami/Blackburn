import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/programs - Get available programs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const includeInactive = searchParams.get("includeInactive") === "true"

    const whereClause: {
      isActive?: boolean
      category?: string
      level?: string
    } = {}
    
    if (!includeInactive) {
      whereClause.isActive = true
    }
    
    if (category) {
      whereClause.category = category
    }
    
    if (level) {
      whereClause.level = level
    }

    const programs = await prisma.program.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: "desc" }
      ],
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.program.count({
      where: whereClause
    })

    const programsWithSubscriptionStatus = programs

    return NextResponse.json({
      programs: programsWithSubscriptionStatus,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Programs fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}