'use client'

import { Badge } from '@/components/ui/badge'
import { useRole, useRoleMetadata } from '@/lib/rbac/hooks'
import { Shield, User, Eye, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Role } from '@/lib/rbac'

interface RoleBadgeProps {
  className?: string
  showIcon?: boolean
}

const ROLE_ICONS = {
  ADMIN: Shield,
  USER: User,
  GUEST: Eye,
  BLOCKED: Lock,
}

const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-800 hover:bg-red-100',
  USER: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  GUEST: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  BLOCKED: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
}

/**
 * Display the current user's role as a badge
 */
export function RoleBadge({ className, showIcon = true }: RoleBadgeProps) {
  const role = useRole()
  const metadata = useRoleMetadata()

  if (!role || !metadata) {
    return null
  }

  const Icon = ROLE_ICONS[role as Role]
  const colorClass = ROLE_COLORS[role]

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex w-fit items-center gap-1.5 px-3',
        colorClass,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {metadata.label}
    </Badge>
  )
}
