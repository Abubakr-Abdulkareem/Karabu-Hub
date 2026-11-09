"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  fallbackHref = "/",
  label = "Back",
}: {
  fallbackHref?: string;
  label?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      onClick={goBack}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-foreground"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}