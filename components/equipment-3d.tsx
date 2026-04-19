"use client"

export function Equipment3DViewer({ equipmentId }: { equipmentId?: string }) {
  const isHCU = equipmentId === "equipment-b"
  const isPump = equipmentId === "equipment-c"

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-4">
      {/* 3D Equipment Render */}
      {isPump ? <PumpSVG /> : isHCU ? <HCUSVG /> : <CokeDrumSVG />}

      <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
        3D DIGITAL TWIN VIEWER
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Interactive equipment model preview
      </p>
    </div>
  )
}

function CokeDrumSVG() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full max-h-48 object-contain">
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

      <ellipse cx="50" cy="20" rx="25" ry="10" fill="url(#vesselGradient)" />
      <rect x="35" y="8" width="6" height="12" fill="#94a3b8" rx="1" />
      <rect x="59" y="8" width="6" height="12" fill="#94a3b8" rx="1" />
      <circle cx="38" cy="8" r="3" fill="#64748b" />
      <circle cx="62" cy="8" r="3" fill="#64748b" />

      <rect x="25" y="20" width="50" height="100" fill="url(#vesselGradient)" />
      
      {[30, 50, 70, 90, 110].map((y) => (
        <rect key={y} x="23" y={y} width="54" height="4" fill="url(#ringGradient)" rx="1" />
      ))}

      <rect x="75" y="55" width="12" height="6" fill="#94a3b8" rx="1" />
      <circle cx="87" cy="58" r="4" fill="#64748b" />
      <circle cx="72" cy="45" r="3" fill="#22c55e" />

      <polygon points="25,120 75,120 70,145 30,145" fill="url(#vesselGradient)" />
      
      <rect x="28" y="145" width="44" height="5" fill="#64748b" rx="1" />
      <rect x="30" y="150" width="4" height="8" fill="#475569" />
      <rect x="66" y="150" width="4" height="8" fill="#475569" />

      <g transform="translate(15, 145)">
        <line x1="0" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" />
        <line x1="0" y1="0" x2="0" y2="-12" stroke="#22c55e" strokeWidth="2" />
        <line x1="0" y1="0" x2="6" y2="6" stroke="#3b82f6" strokeWidth="2" />
      </g>
    </svg>
  )
}

function HCUSVG() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full max-h-48 object-contain">
      <defs>
        <linearGradient id="hcuGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Main Reactor Column */}
      <ellipse cx="40" cy="15" rx="15" ry="6" fill="url(#hcuGradient)" />
      <rect x="25" y="15" width="30" height="120" fill="url(#hcuGradient)" />
      <polygon points="25,135 55,135 45,150 35,150" fill="url(#hcuGradient)" />
      
      {/* Side Exchanger */}
      <ellipse cx="75" cy="40" rx="10" ry="4" fill="url(#hcuGradient)" />
      <rect x="65" y="40" width="20" height="70" fill="url(#hcuGradient)" />
      <ellipse cx="75" cy="110" rx="10" ry="4" fill="url(#hcuGradient)" />

      {/* Piping connecting them */}
      <path d="M55 50 L65 50" stroke="#94a3b8" strokeWidth="4" fill="none" />
      <path d="M55 100 L65 100" stroke="#94a3b8" strokeWidth="4" fill="none" />
      
      {/* Platform */}
      <rect x="15" y="80" width="80" height="2" fill="#475569" />
      <line x1="15" y1="80" x2="15" y2="150" stroke="#475569" strokeWidth="1" />
      <line x1="95" y1="80" x2="95" y2="150" stroke="#475569" strokeWidth="1" />

      {/* Base */}
      <rect x="20" y="150" width="70" height="5" fill="#334155" />

      {/* Status LED */}
      <circle cx="40" cy="30" r="3" fill="#3b82f6" />
      <circle cx="75" cy="45" r="2" fill="#22c55e" />
    </svg>
  )
}

function PumpSVG() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full max-h-48 object-contain">
      <defs>
        <linearGradient id="pumpMotor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="pumpVolute" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
      </defs>

      {/* Baseplate */}
      <rect x="10" y="110" width="80" height="8" fill="#475569" rx="1" />
      
      {/* Motor */}
      <rect x="15" y="70" width="30" height="30" fill="url(#pumpMotor)" rx="4" />
      {/* Motor fins */}
      {[72, 77, 82, 87, 92].map((y) => (
        <line key={y} x1="15" y1={y} x2="45" y2={y} stroke="#1e3a8a" strokeWidth="1" />
      ))}
      <rect x="20" y="65" width="20" height="5" fill="#3b82f6" rx="1" />

      {/* Coupling */}
      <rect x="45" y="78" width="10" height="14" fill="#94a3b8" />
      
      {/* Pump Volute */}
      <circle cx="70" cy="85" r="18" fill="url(#pumpVolute)" />
      
      {/* Discharge flange */}
      <rect x="64" y="55" width="12" height="15" fill="#64748b" />
      <rect x="62" y="50" width="16" height="5" fill="#475569" />

      {/* Suction flange */}
      <rect x="85" y="79" width="10" height="12" fill="#64748b" />
      <rect x="95" y="77" width="5" height="16" fill="#475569" />

      {/* Piping connected to discharge */}
      <path d="M70 50 L70 30" stroke="#94a3b8" strokeWidth="8" fill="none" />
      <path d="M70 30 Q70 20 80 20" stroke="#94a3b8" strokeWidth="8" fill="none" />
      <line x1="80" y1="20" x2="95" y2="20" stroke="#94a3b8" strokeWidth="8" />

      {/* Status LED */}
      <circle cx="70" cy="85" r="3" fill="#22c55e" />
    </svg>
  )
}
