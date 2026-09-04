import { cn } from "../lib/utils";

type BrandLogoProps = {
  showName?: boolean;
  name?: string;
  tone?: "light" | "dark";
  className?: string;
  markClassName?: string;
};

export function BrandLogo({ showName = true, name = "João Deniz", tone = "light", className, markClassName }: BrandLogoProps) {
  return <div className={cn("brand-logo group flex items-center gap-3", className)} aria-label={name}><BrandMark className={markClassName} />{showName && <span className={cn("brand-logo-wordmark text-lg font-bold tracking-[-0.02em]", tone === "dark" ? "text-white" : "text-slate-950")}>{name}</span>}</div>;
}

function BrandMark({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={cn("brand-logo-mark size-10 shrink-0", className)} viewBox="0 0 48 48" fill="none"><rect className="brand-logo-surface" x="1" y="1" width="46" height="46" rx="13" /><path className="brand-logo-j" fill="white" d="M28.4 9.5h-7v16.7c0 3.5-1.7 5.1-4.4 5.1-2 0-3.6-1-4.6-2.9l-5.3 3.1c1.9 3.7 5.3 5.7 9.9 5.7 7.1 0 11.4-4 11.4-11.2V9.5Z" /><path className="brand-logo-trail" d="M8.2 33.5c3.2 4.3 7.5 6.4 12.6 6.4 5.7 0 10.7-2.6 13.7-7.1" stroke="#bae6fd" strokeWidth="2.6" strokeLinecap="round" pathLength="1" /><path className="brand-logo-spark" d="M31.5 10.2h5.1" stroke="#e0f2fe" strokeWidth="2.6" strokeLinecap="round" /></svg>;
}
