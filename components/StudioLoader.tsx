"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/40">
      <span className="mr-2 inline-block h-3 w-3 animate-ping rounded-full bg-cyan-400" /> Loading studio…
    </div>
  ),
});

export default function StudioLoader() {
  return <Studio />;
}
