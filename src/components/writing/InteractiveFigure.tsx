'use client'

import { useMemo } from 'react'
import { useTheme } from '@/hooks/useTheme'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter,
  Legend,
} from 'recharts'

interface ChartBase {
  type: 'bar' | 'line' | 'scatter' | 'stacked-bar'
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; color: string; label: string }[]
  xLabel?: string
  yLabel?: string
}

interface Props {
  config: ChartBase
  caption?: string
}

const THEME_COLORS = {
  light: {
    grid: '#e5e0d8',
    text: '#6b6258',
    tooltip: '#fff',
    tooltipBorder: '#e5e0d8',
  },
  dark: {
    grid: '#2a2420',
    text: '#8a8278',
    tooltip: '#1a1510',
    tooltipBorder: '#3a3430',
  },
}

export function InteractiveFigure({ config, caption }: Props) {
  const { theme } = useTheme()
  const colors = theme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light

  const chartConfig = useMemo(() => ({
    margin: { top: 8, right: 16, left: 0, bottom: 0 } as const,
    xTick: { fontSize: 11, fill: colors.text } as const,
    xLine: { stroke: colors.grid },
    yTick: { fontSize: 11, fill: colors.text } as const,
    yLine: { stroke: colors.grid },
    xLabel: config.xLabel ? { value: config.xLabel, position: 'insideBottom' as const, offset: -4, style: { fill: colors.text, fontSize: 11 } } : undefined,
    yLabel: config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft' as const, style: { fill: colors.text, fontSize: 11 } } : undefined,
  }), [config, colors])

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
      case 'stacked-bar':
        return (
          <BarChart data={config.data} margin={chartConfig.margin}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={config.xKey}
              tick={chartConfig.xTick}
              axisLine={chartConfig.xLine}
              tickLine={false}
              label={chartConfig.xLabel}
            />
            <YAxis
              tick={chartConfig.yTick}
              axisLine={chartConfig.yLine}
              tickLine={false}
              label={chartConfig.yLabel}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltip,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: colors.text,
              }}
            />
            {config.series.map(s => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                name={s.label}
                radius={[3, 3, 0, 0]}
                stackId={config.type === 'stacked-bar' ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        )
      case 'line':
        return (
          <LineChart data={config.data} margin={chartConfig.margin}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={config.xKey}
              tick={chartConfig.xTick}
              axisLine={chartConfig.xLine}
              tickLine={false}
              label={chartConfig.xLabel}
            />
            <YAxis
              tick={chartConfig.yTick}
              axisLine={chartConfig.yLine}
              tickLine={false}
              label={chartConfig.yLabel}
            />
            <Tooltip
              contentStyle={{
                background: colors.tooltip,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: colors.text,
              }}
            />
            {config.series.length > 1 && <Legend />}
            {config.series.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                name={s.label}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
              />
            ))}
          </LineChart>
        )
      case 'scatter':
        return (
          <ScatterChart data={config.data} margin={chartConfig.margin}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={config.xKey} tick={chartConfig.xTick} axisLine={chartConfig.xLine} tickLine={false} label={chartConfig.xLabel} />
            <YAxis tick={chartConfig.yTick} axisLine={chartConfig.yLine} tickLine={false} label={chartConfig.yLabel} />
            <Tooltip
              contentStyle={{
                background: colors.tooltip,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: colors.text,
              }}
            />
            {config.series.map(s => (
              <Scatter key={s.key} dataKey={s.key} fill={s.color} name={s.label} />
            ))}
          </ScatterChart>
        )
    }
  }

  return (
    <figure className="article-wide my-10 px-4 sm:px-6">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
