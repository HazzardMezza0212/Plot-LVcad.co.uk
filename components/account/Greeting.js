"use client";

import { useEffect, useState } from "react";

// Time-of-day greeting in the visitor's own timezone.
export default function Greeting({ name }) {
  const [part, setPart] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPart(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  return (
    <h1 className="acct-greeting display">
      {part}
      {name ? `, ${name}` : ""}.
    </h1>
  );
}
