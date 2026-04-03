'use client'

import { LucideIcon, Building, Users, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

const iconMap: Record<string, LucideIcon> = {
  building: Building,
  users: Users,
  clock: Clock,
  calendar: Calendar,
  check: CheckCircle2,
  x: XCircle,
}

interface StatsCardProps {
  title: string
  value: string | number
  icon: keyof typeof iconMap
  description?: string
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  const Icon = iconMap[icon] || Clock

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-none shadow-md bg-white/60 backdrop-blur-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
              {trend && (
                <div className={`flex items-center mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <span>{trend.value}</span>
                  <span className="ml-1 text-muted-foreground">vs bulan lalu</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
