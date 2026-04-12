"use client"

export function MiniLineChart() {
  return (
    <div className="w-24 h-12">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path
          d="M5,40 Q20,35 30,25 T50,20 T70,30 T95,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        <path
          d="M0,45 L100,45"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground"
        />
        <path
          d="M5,0 L5,45"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground"
        />
      </svg>
    </div>
  )
}

export function MiniPieChart({ value = 75 }: { value?: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  
  return (
    <div className="w-12 h-12">
      <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
    </div>
  )
}

export function MiniBarChart() {
  const bars = [30, 50, 40, 70, 60, 80, 75]
  
  return (
    <div className="w-16 h-10 flex items-end gap-0.5">
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-primary rounded-t"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

export function GaugeChart({ value = 75, label }: { value?: number; label?: string }) {
  const angle = (value / 100) * 180 - 90 // Convert percentage to angle (-90 to 90)
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-16 relative">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted"
          />
          {/* Value arc */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 126} 126`}
            className="text-primary"
          />
          {/* Needle */}
          <line
            x1="50"
            y1="50"
            x2={50 + 30 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 30 * Math.sin((angle * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-foreground"
          />
          <circle cx="50" cy="50" r="4" fill="currentColor" className="text-foreground" />
        </svg>
      </div>
      {label && (
        <span className="text-sm font-medium text-foreground mt-1">{label}</span>
      )}
    </div>
  )
}

export function TrendLineChart({ height = 120 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 20, 40, 60].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="200"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border"
          />
        ))}
        {/* Area fill */}
        <path
          d="M0,50 Q30,45 50,35 T100,25 T150,30 T200,15 L200,60 L0,60 Z"
          fill="url(#lineGradient)"
        />
        {/* Line */}
        <path
          d="M0,50 Q30,45 50,35 T100,25 T150,30 T200,15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        {/* Dots */}
        <circle cx="50" cy="35" r="3" fill="currentColor" className="text-primary" />
        <circle cx="100" cy="25" r="3" fill="currentColor" className="text-primary" />
        <circle cx="150" cy="30" r="3" fill="currentColor" className="text-primary" />
      </svg>
    </div>
  )
}

export function BarChartVertical({ height = 120 }: { height?: number }) {
  const bars = [40, 55, 45, 70, 60, 85, 75, 90]
  
  return (
    <div className="w-full flex items-end justify-between gap-1" style={{ height }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/80 hover:bg-primary rounded-t transition-colors"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}
