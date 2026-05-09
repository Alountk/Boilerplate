/**
 * Centraliza la persistencia de credenciales de sesión en localStorage.
 * Elimina la duplicación de setItem/getItem en AuthService (4 métodos).
 */

import { User } from '../../domain/models/User';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function isLikelyJwt(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.trim().length > 0);
}

function sanitizeToken(raw: string | null): string | null {
  if (!raw) return null;

  const normalized = raw.trim();
  if (!normalized) return null;

  if (normalized === 'undefined' || normalized === 'null') return null;

  return isLikelyJwt(normalized) ? normalized : null;
}

export const TokenService = {
  persist(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;

    const sanitized = sanitizeToken(localStorage.getItem(TOKEN_KEY));
    if (!sanitized) {
      localStorage.removeItem(TOKEN_KEY);
    }

    return sanitized;
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;

    // Un usuario en cache sin JWT válido es una sesión inconsistente.
    if (!this.getToken()) {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
