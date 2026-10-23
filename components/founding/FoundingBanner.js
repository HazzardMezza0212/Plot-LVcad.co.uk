import Link from "next/link";
import { isFoundingOpen, seatsLeft } from "@/lib/founding";

// A strip pointing to /founding. Shows nothing until Founding 20 is open.
export default async function FoundingBanner() {
  if (!isFoundingOpen) return null;
  const left = await seatsLeft();
  if (left === 0) return null;
  return (
    <div className="founding-banner-wrap">
      <div className="founding-banner">
        <p>
          <strong>Founding 20 is open.</strong> FOV Pro for £99 + VAT a year, locked for as long as you stay.
          {left !== null && <> {left} of 20 seats left.</>}
        </p>
        <Link href="/founding" className="btn-primary small">See the offer →</Link>
      </div>
    </div>
  );
}
