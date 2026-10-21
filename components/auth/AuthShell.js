import Link from "next/link";

// Split-screen frame for /login, /signup, /forgot and /account/password.
// Left: brand panel with a small animated coverage plan. Right: the form.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand" aria-hidden="true">
        <Link href="/" className="logo auth-logo">
          PLOT-LV <span className="tag">FOV</span>
        </Link>
        <div className="auth-brand-body">
          <CoveragePlan />
          <h2 className="display">Your Plot-LV workspace</h2>
          <ul className="auth-points">
            <li>Launch FOV straight from your account</li>
            <li>Plans stay on your device, never uploaded</li>
            <li>Free while FOV is in preview</li>
          </ul>
        </div>
        <span className="auth-brand-foot mono">DWG-FOV-001 · GROUND FLOOR</span>
      </aside>

      <main className="auth-main">
        <Link href="/" className="logo auth-logo-mobile">
          PLOT-LV <span className="tag">FOV</span>
        </Link>
        <div className="auth-card">
          <h1 className="auth-title display">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="auth-footer">{footer}</div>}
      </main>
    </div>
  );
}

// A floor plan with two cameras whose coverage wedges sweep slowly.
function CoveragePlan() {
  return (
    <svg className="auth-plan" viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="planClip">
          <rect x="12" y="12" width="296" height="196" />
        </clipPath>
      </defs>
      <rect className="ap-room" x="12" y="12" width="296" height="196" />
      <g clipPath="url(#planClip)">
        <g className="ap-sweep ap-sweep-a">
          <path className="ap-wedge" d="M24,24 L250,70 A230,230 0 0 1 70,250 Z" />
        </g>
        <g className="ap-sweep ap-sweep-b">
          <path className="ap-wedge" d="M296,196 L80,170 A215,215 0 0 1 250,-10 Z" />
        </g>
      </g>
      <path className="ap-wall" d="M12,12 H308 V208 H12 Z" />
      <path className="ap-wall-thin" d="M168,12 V84 M168,124 V208" />
      <path className="ap-door" d="M168,84 A40,40 0 0 1 208,124" />
      <rect className="ap-obstacle" x="96" y="140" width="38" height="22" />
      <circle className="ap-cam" cx="24" cy="24" r="6" />
      <circle className="ap-cam" cx="296" cy="196" r="6" />
      <text className="ap-label" x="36" y="198">CAM 01 · 92%</text>
      <text className="ap-label" x="196" y="30">CAM 02 · 88%</text>
    </svg>
  );
}
