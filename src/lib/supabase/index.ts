/**
 * Supabase Cloud Client & REST Adapter for CLASSROOM ERP
 * Project ID: ssnvzmylwnrzxqntxacg
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://ssnvzmylwnrzxqntxacg.supabase.co",
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "sb_publishable_dUs3cvRvIIa1HZeOKd9RWQ_JOSjEoQR",
    projectId:
      process.env.SUPABASE_PROJECT_ID ||
      "ssnvzmylwnrzxqntxacg",
  };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && cfg.projectId);
}

/**
 * Universal fetch wrapper for Supabase REST and Auth endpoints
 */
export async function supabaseRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      return {
        data: null,
        error: (data && data.message) || (data && data.error) || `HTTP ${res.status}`,
        status: res.status,
      };
    }

    return { data, error: null, status: res.status };
  } catch (err: any) {
    return { data: null, error: err.message || "Failed to fetch from Supabase", status: 500 };
  }
}

/**
 * Checks connectivity to the Supabase backend service
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  projectId: string;
  url: string;
  latencyMs: number;
  authProviders?: string[];
  error?: string;
}> {
  const config = getSupabaseConfig();
  const start = Date.now();
  const res = await supabaseRequest<any>("/auth/v1/settings");
  const latencyMs = Date.now() - start;

  if (res.status === 200 && res.data) {
    const providers = Object.keys(res.data.external || {}).filter(
      (k) => res.data.external[k] === true
    );
    return {
      connected: true,
      projectId: config.projectId,
      url: config.url,
      latencyMs,
      authProviders: providers,
    };
  }

  return {
    connected: false,
    projectId: config.projectId,
    url: config.url,
    latencyMs,
    error: res.error || `Received HTTP ${res.status}`,
  };
}
