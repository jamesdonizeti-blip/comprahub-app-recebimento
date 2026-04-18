// lib/config.ts
// AJUSTE 7: variáveis de ambiente para suportar múltiplos ambientes (dev/prod)
// sem precisar rebuildar. Configure no arquivo .env na raiz do projeto.
export const APP_CONFIG = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://portal.solucaocompras.com.br",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://fdkuynzlbhvdybckhouf.supabase.co",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};