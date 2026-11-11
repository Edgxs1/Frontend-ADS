import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { EditarEstimacionPageClient } from "@/components/estimaciones/EditarEstimacionPageClient";

export const instant = false;

export default function EditarEstimacionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </div>
      }
    >
      <EditarEstimacionPageClient />
    </Suspense>
  );
}
