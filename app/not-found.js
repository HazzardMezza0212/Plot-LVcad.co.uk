import Link from "next/link";

export const metadata = {
  title: "404 — Zone Not Found | Plot-LV",
};

export default function NotFound() {
  return (
    <>
      <div className="grid-bg"></div>
      <div className="notfound">
        <div className="notfound-frame">
          <div className="frame-label">
            <span>DWG-404 · UNKNOWN ZONE</span>
            <span className="status fault">
              <span className="fault-dot"></span> FAULT
            </span>
          </div>
          <div className="notfound-code display">404</div>
          <h1>This zone isn&apos;t on the drawing.</h1>
          <p>
            The page you&apos;re looking for has been moved, renamed, or never
            existed on this floor plan.
          </p>
          <Link href="/" className="btn-primary">
            ← Back to the floor plan
          </Link>
        </div>
      </div>
    </>
  );
}
