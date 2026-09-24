/**
 * Supabase Auth Service
 * Direct, lightweight, typed HTTP client for Supabase GoTrue Auth API
 * Project: ssnvzmylwnrzxqntxacg
 */

import { getSupabaseConfig, supabaseRequest } from "./index";

export interface SupabaseUserMetadata {
  full_name?: string;
  role?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface SupabaseUser {
  id: string;
  email: string;
  phone?: string;
  created_at: string;
  app_metadata: Record<string, any>;
  user_metadata: SupabaseUserMetadata;
  aud: string;
  role?: string;
}

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

export interface SupabaseAuthResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Sign In with Email & Password via Supabase Auth
 */
export async function supabaseSignIn(credentials: {
  email: string;
  password: string;
}): Promise<SupabaseAuthResponse<SupabaseSession>> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/token?grant_type=password`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.msg ||
        data?.error_description ||
        data?.message ||
        data?.error ||
        "Authentication failed";
      return { data: null, error: errorMsg, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error connecting to Supabase Auth", status: 500 };
  }
}

/**
 * Sign Up with Email & Password via Supabase Auth
 */
export async function supabaseSignUp(params: {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}): Promise<SupabaseAuthResponse<{ user: SupabaseUser; session: SupabaseSession | null }>> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/signup`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        password: params.password,
        data: {
          full_name: params.fullName || "Academic User",
          role: params.role || "STUDENT",
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.msg ||
        data?.error_description ||
        data?.message ||
        data?.error ||
        "Registration failed";
      return { data: null, error: errorMsg, status: res.status };
    }

    return {
      data: {
        user: data.user || data,
        session: data.session || null,
      },
      error: null,
      status: res.status,
    };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error connecting to Supabase Auth", status: 500 };
  }
}

/**
 * Send Magic Link / Passwordless OTP via Supabase Auth
 */
export async function supabaseSendMagicLink(params: {
  email: string;
  redirectTo?: string;
}): Promise<SupabaseAuthResponse<{ message: string }>> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/otp`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: params.redirectTo,
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.msg ||
        data?.error_description ||
        data?.message ||
        "Failed to send magic link";
      return { data: null, error: errorMsg, status: res.status };
    }

    return {
      data: { message: "Magic link sent to your email address" },
      error: null,
      status: res.status,
    };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error dispatching magic link", status: 500 };
  }
}

/**
 * Request Password Reset via Supabase Auth
 */
export async function supabaseRecoverPassword(params: {
  email: string;
  redirectTo?: string;
}): Promise<SupabaseAuthResponse<{ message: string }>> {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/recover`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: params.redirectTo,
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.msg ||
        data?.error_description ||
        data?.message ||
        "Failed to send password recovery email";
      return { data: null, error: errorMsg, status: res.status };
    }

    return {
      data: { message: "Password recovery instructions sent to your email" },
      error: null,
      status: res.status,
    };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error requesting password recovery", status: 500 };
  }
}
