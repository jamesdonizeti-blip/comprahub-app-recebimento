// lib/api.ts
import axios from "axios";
import { APP_CONFIG } from "./config";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Injeta o Bearer token em TODAS as requisições
api.interceptors.request.use(async (config) => {
  try {
    // Sempre tenta renovar o token antes de usar
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Ignora erro de leitura de sessão — deixa a request ir sem token
    // O interceptor de resposta vai lidar com o 401
  }

  return config;
});

// Interceptor de resposta: renova token uma vez em caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Evita loop infinito — só tenta refresh uma vez por request
    if (error?.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      if (isRefreshing) {
        // Já está renovando — aguarda e repete com o novo token
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api.request(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data?.session?.access_token) {
          // Refresh falhou — não faz redirect aqui, deixa o chamador decidir
          isRefreshing = false;
          return Promise.reject(error);
        }

        const newToken = data.session.access_token;
        onRefreshed(newToken);
        isRefreshing = false;

        // Repete a request original com o novo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api.request(originalRequest);
      } catch {
        isRefreshing = false;
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
