import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return <Sonner
    position="bottom-right"
    duration={4000}
    visibleToasts={3}
    closeButton={false}
    icons={{
      success: <CircleCheck aria-hidden="true" className="size-5 text-emerald-600" />,
      error: <CircleAlert aria-hidden="true" className="size-5 text-red-600" />,
      warning: <TriangleAlert aria-hidden="true" className="size-5 text-amber-600" />,
      info: <Info aria-hidden="true" className="size-5 text-sky-600" />,
      loading: <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-sky-600" />
    }}
    offset={{ bottom: "1rem", right: "1rem" }}
    mobileOffset={{ bottom: "5.5rem", left: "0.75rem", right: "0.75rem" }}
    toastOptions={{
      classNames: {
        toast: "border-sky-100 bg-white text-slate-950 shadow-[0_4px_8px_rgba(15,23,42,0.16)]",
        title: "text-sm font-semibold text-slate-950",
        description: "text-sm text-slate-600"
      }
    }}
  />;
}
