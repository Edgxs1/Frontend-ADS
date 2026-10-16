import Link from "next/link";
import { Send } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Send className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Obra Pública
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Administración y seguimiento de obra
        </p>
      </div>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-medium text-white transition hover:bg-slate-800"
      >
        Iniciar sesión
      </Link>
    </main>
  );
}
