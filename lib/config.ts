// lib/config.ts
// AJUSTE 7: variáveis de ambiente para suportar múltiplos ambientes (dev/prod)
// sem precisar rebuildar. Configure no arquivo .env na raiz do projeto.
export const APP_CONFIG = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://portal.solucaocompras.com.br",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://fdkuynzlbhvdybckhouf.supabase.co",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka3V5bnpsYmh2ZHliY2tob3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzA5MjYsImV4cCI6MjA4OTYwNjkyNn0.PKf9JI43NnRnqAFxbEptSR9gPy67EIzs5OD31fic86U",
};
