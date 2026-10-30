"use client";

import dynamic from "next/dynamic";

// three.js stays out of the main bundle; the CSS glow behind it is the fallback.
export default dynamic(() => import("./HeroField"), { ssr: false });
