import { IAuthService, LoginRequest, RegisterRequest, AuthResponse } from '../../domain/ports/IAuthService';
import { User } from '../../domain/models/User';
import { axiosInstance } from '../api/axiosInstance';

export class AuthService implements IAuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/Auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/Users/register', data);
    // Usually register also logs in, or returns success. Assuming it returns AuthResponse as per port.
    // If backend returns just user or 200 OK, we might need to adjust.
    // Based on AuthController, Register returns UserDto usually.
    // Let's assume for now it returns what we need or we handle it.
    // If it doesn't return token, we might need to login after register.
    // But for now implementing as per interface.
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
    }
    return null;
  }

  async updateUser(id: string, data: Partial<RegisterRequest>): Promise<User> {
    const response = await axiosInstance.put<User>(`/Users/${id}`, data);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  }
}
