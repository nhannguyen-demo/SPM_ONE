"use client"

export function Equipment3DViewer() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-4">
      {/* 3D Equipment Render - Stylized pressure vessel / coker drum */}
      <svg viewBox="0 0 100 160" className="w-40 h-auto">
        <defs>
          <linearGradient id="vesselGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Top dome/head */}
        <ellipse cx="50" cy="20" rx="25" ry="10" fill="url(#vesselGradient)" />
        
        {/* Top nozzles */}
        <rect x="35" y="8" width="6" height="12" fill="#94a3b8" rx="1" />
        <rect x="59" y="8" width="6" height="12" fill="#94a3b8" rx="1" />
        <circle cx="38" cy="8" r="3" fill="#64748b" />
        <circle cx="62" cy="8" r="3" fill="#64748b" />

        {/* Main cylindrical body */}
        <rect x="25" y="20" width="50" height="100" fill="url(#vesselGradient)" />
        
        {/* Horizontal ring sections */}
        {[30, 50, 70, 90, 110].map((y) => (
          <rect key={y} x="23" y={y} width="54" height="4" fill="url(#ringGradient)" rx="1" />
        ))}

        {/* Side nozzle */}
        <rect x="75" y="55" width="12" height="6" fill="#94a3b8" rx="1" />
        <circle cx="87" cy="58" r="4" fill="#64748b" />

        {/* Indicator light */}
        <circle cx="72" cy="45" r="3" fill="#22c55e" />

        {/* Bottom cone/skirt */}
        <polygon points="25,120 75,120 70,145 30,145" fill="url(#vesselGradient)" />
        
        {/* Base ring */}
        <rect x="28" y="145" width="44" height="5" fill="#64748b" rx="1" />
        
        {/* Support legs */}
        <rect x="30" y="150" width="4" height="8" fill="#475569" />
        <rect x="66" y="150" width="4" height="8" fill="#475569" />

        {/* RGB coordinate axes */}
        <g transform="translate(15, 145)">
          <line x1="0" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="-12" stroke="#22c55e" strokeWidth="2" />
          <line x1="0" y1="0" x2="6" y2="6" stroke="#3b82f6" strokeWidth="2" />
        </g>
      </svg>

      <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
        3D DIGITAL TWIN VIEWER
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Interactive equipment model preview
      </p>
    </div>
  )
}
