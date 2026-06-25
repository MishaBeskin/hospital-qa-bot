'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyCount } from '@/types'

interface DailyChartProps {
  data: DailyCount[]
}

function formatTick(dateStr: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const [, month, day] = dateStr.split('-')
  return `${parseInt(day)}/${parseInt(month)}`
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = new Date(label + 'T12:00:00')
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">
        {d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <p className="text-muted-foreground mt-0.5">{payload[0].value} שאלות</p>
    </div>
  )
}

export function DailyChart({ data }: DailyChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const peak = Math.max(...data.map((d) => d.count))

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base">שאלות לפי יום — 30 ימים אחרונים</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground shrink-0">
            <span>
              סה״כ <span className="font-semibold text-foreground">{total.toLocaleString('he-IL')}</span>
            </span>
            <span>
              שיא יומי <span className="font-semibold text-foreground">{peak.toLocaleString('he-IL')}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* dir=ltr: recharts is inherently LTR (time axis L→R); Hebrew labels still work */}
        <div dir="ltr" className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -28 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.92 0.005 215)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickFormatter={formatTick}
                tick={{ fontSize: 10, fill: 'oklch(0.52 0 0)' }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'oklch(0.52 0 0)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(0.96 0 0)' }} />
              <Bar
                dataKey="count"
                fill="oklch(0.59 0.12 215)"
                radius={[3, 3, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
