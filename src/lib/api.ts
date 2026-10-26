import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 403) {
    const copia = response.clone();
    const body = (await copia.json().catch(() => null)) as
      | { error?: { details?: { code?: string } } }
      | null;

    if (body?.error?.details?.code === "CUENTA_DESACTIVADA") {
      await supabase.auth.signOut().catch(() => undefined);
      if (typeof window !== "undefined") {
        window.location.replace("/login?motivo=desactivada");
      }
    }
  }

  return response;
}

interface CuerpoError {
  error?: { message?: string };
}

export async function leerMensajeError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = (await response.json().catch(() => null)) as CuerpoError | null;
  return body?.error?.message ?? fallback;
}
