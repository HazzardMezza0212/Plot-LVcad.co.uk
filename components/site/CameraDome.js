// A ceiling dome camera, drawn in SVG, for the 3D hero scenes.
export default function CameraDome({ className = "cam3d", style }) {
  return (
    <div className={className} style={style} aria-hidden="true">
      <svg viewBox="0 0 160 130" width="100%" height="100%">
        <defs>
          <linearGradient id="cdPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#C9D0DE" />
          </linearGradient>
          <radialGradient id="cdDome" cx="38%" cy="30%" r="80%">
            <stop offset="0" stopColor="#5A6A8C" stopOpacity=".55" />
            <stop offset=".55" stopColor="#1B2540" stopOpacity=".9" />
            <stop offset="1" stopColor="#0B1122" />
          </radialGradient>
          <radialGradient id="cdLens" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#7C8CFF" />
            <stop offset=".45" stopColor="#1B2445" />
            <stop offset="1" stopColor="#04060C" />
          </radialGradient>
        </defs>
        <rect x="18" y="8" width="124" height="26" rx="13" fill="url(#cdPlate)" stroke="#AEB7C9" />
        <rect x="30" y="28" width="100" height="12" rx="4" fill="#E3E7F0" stroke="#AEB7C9" />
        <path d="M34 40 h92 a46 46 0 0 1 -92 0 z" fill="url(#cdDome)" stroke="#0B1122" />
        <circle cx="80" cy="66" r="17" fill="#0B1122" />
        <circle cx="80" cy="66" r="12" fill="url(#cdLens)" />
        <circle cx="75" cy="61" r="3.2" fill="#fff" opacity=".85" />
        <g fill="#FF7A45" opacity=".9"><circle cx="58" cy="58" r="2" /><circle cx="102" cy="58" r="2" /><circle cx="62" cy="76" r="2" /><circle cx="98" cy="76" r="2" /></g>
        <path d="M44 46 q20 -6 34 -4" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
