import { useMemo } from 'react'
import { differenceInDays, differenceInCalendarWeeks, startOfWeek, endOfWeek, isWithinInterval, startOfQuarter, endOfQuarter } from 'date-fns'
import type { Product, Milestone } from '@/lib/types'

export interface DashboardMetrics {
  // Basic counts
  totalProducts: number
  inProgressCount: number
  demoOkCount: number
  liveCount: number
  plannedCount: number

  // New KPIs
  completionRate: number // (LIVE + DEMO_OK) / Total * 100
  averageDuration: number // Average days between startDate and endDate
  milestoneCompletionRate: number // COMPLETED / Total milestones * 100
  averageCycleTime: number // Average days from PLANNED to LIVE

  // Timeline Health
  timelineHealth: {
    onTime: number
    delayed: number
    upcoming: number
  }

  // Velocity metrics
  weeklyThroughput: Array<{
    week: string
    completed: number
    started: number
  }>

  // Team productivity
  teamProductivityScore: number // Ratio of completed vs planned for current quarter
}

export function useDashboardMetrics(products: Product[]): DashboardMetrics {
  return useMemo(() => {
    const now = new Date()
    const currentQuarterStart = startOfQuarter(now)
    const currentQuarterEnd = endOfQuarter(now)

    // Basic counts
    const totalProducts = products.length
    const plannedCount = products.filter((p) => p.status === 'PLANNED').length
    const inProgressCount = products.filter((p) => p.status === 'IN_PROGRESS').length
    const demoOkCount = products.filter((p) => p.status === 'DEMO_OK').length
    const liveCount = products.filter((p) => p.status === 'LIVE').length

    // Completion Rate: (LIVE + DEMO_OK) / Total * 100
    const completionRate = totalProducts > 0
      ? ((liveCount + demoOkCount) / totalProducts) * 100
      : 0

    // Average Duration: Average days between startDate and endDate
    const averageDuration = totalProducts > 0
      ? products.reduce((sum, p) => sum + differenceInDays(p.endDate, p.startDate), 0) / totalProducts
      : 0

    // Milestone Completion Rate
    const allMilestones: Milestone[] = products.flatMap((p) => p.milestones || [])
    const totalMilestones = allMilestones.length
    const completedMilestones = allMilestones.filter((m) => m.status === 'COMPLETED').length
    const milestoneCompletionRate = totalMilestones > 0
      ? (completedMilestones / totalMilestones) * 100
      : 0

    // Average Cycle Time: Average days from creation to LIVE status
    const liveProducts = products.filter((p) => p.status === 'LIVE' && p.createdAt)
    const averageCycleTime = liveProducts.length > 0
      ? liveProducts.reduce((sum, p) => {
          const createdDate = p.createdAt || p.startDate
          return sum + differenceInDays(now, createdDate)
        }, 0) / liveProducts.length
      : 0

    // Timeline Health: on-time vs delayed vs upcoming
    const timelineHealth = products.reduce(
      (acc, p) => {
        const isCompleted = p.status === 'LIVE' || p.status === 'DEMO_OK'
        const isPastDue = p.endDate < now && !isCompleted
        const isFuture = p.startDate > now

        if (isPastDue) {
          acc.delayed++
        } else if (isFuture) {
          acc.upcoming++
        } else if (!isPastDue && !isFuture) {
          acc.onTime++
        }

        return acc
      },
      { onTime: 0, delayed: 0, upcoming: 0 }
    )

    // Weekly Throughput: Last 12 weeks
    const weeklyThroughput = Array.from({ length: 12 }, (_, i) => {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000))
      const weekEnd = endOfWeek(weekStart)

      const completed = products.filter((p) => {
        const completedStatuses = ['LIVE', 'DEMO_OK']
        return (
          completedStatuses.includes(p.status) &&
          p.endDate &&
          isWithinInterval(p.endDate, { start: weekStart, end: weekEnd })
        )
      }).length

      const started = products.filter((p) => {
        return (
          p.startDate &&
          isWithinInterval(p.startDate, { start: weekStart, end: weekEnd })
        )
      }).length

      return {
        week: weekStart.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        completed,
        started,
      }
    }).reverse()

    // Team Productivity Score: Completed vs Planned for current quarter
    const quarterProducts = products.filter((p) => {
      return isWithinInterval(p.startDate, { start: currentQuarterStart, end: currentQuarterEnd })
    })

    const quarterCompleted = quarterProducts.filter((p) => p.status === 'LIVE' || p.status === 'DEMO_OK').length
    const quarterTotal = quarterProducts.length

    const teamProductivityScore = quarterTotal > 0
      ? (quarterCompleted / quarterTotal) * 100
      : 0

    return {
      totalProducts,
      inProgressCount,
      demoOkCount,
      liveCount,
      plannedCount,
      completionRate,
      averageDuration,
      milestoneCompletionRate,
      averageCycleTime,
      timelineHealth,
      weeklyThroughput,
      teamProductivityScore,
    }
  }, [products])
}
