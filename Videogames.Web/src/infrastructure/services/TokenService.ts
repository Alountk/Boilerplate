/**
 * Centraliza la persistencia de credenciales de sesión en localStorage.
 * Elimina la duplicación de setItem/getItem en AuthService (4 métodos).
 */

import { User } from '../../domain/models/User';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const TokenService = {
  persist(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
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
