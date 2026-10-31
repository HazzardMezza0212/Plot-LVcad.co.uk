// SVG path for a field-of-view wedge in a 100×60 box, camera at (50, 56),
// pointing up. Used by the camera library cards.
export function wedgePath(deg, r) {
  const h = ((Math.min(deg, 179) / 2) * Math.PI) / 180;
  const x1 = (50 - r * Math.sin(h)).toFixed(2);
  const y1 = (56 - r * Math.cos(h)).toFixed(2);
  const x2 = (50 + r * Math.sin(h)).toFixed(2);
  return `M50 56 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y1} Z`;
}
