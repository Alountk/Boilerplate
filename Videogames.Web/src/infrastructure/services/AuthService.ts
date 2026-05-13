import {
  IAuthService,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegistrationCodeConfirmResponse,
} from '../../domain/ports/IAuthService';
import { User } from '../../domain/models/User';
import { axiosInstance } from '../api/axiosInstance';
import { TokenService } from './TokenService';

export class AuthService implements IAuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/Auth/login', credentials);
    if (data.token) TokenService.persist(data.token, data.user);
    return data;
  }

  async register(req: RegisterRequest): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/Users', req);
    if (data.token) TokenService.persist(data.token, data.user);
    return data;
  }

  async sendRegistrationCode(email: string): Promise<void> {
    await axiosInstance.post('/Auth/register-email/send-code', { email });
  }

  async confirmRegistrationCode(email: string, code: string): Promise<RegistrationCodeConfirmResponse> {
    const { data } = await axiosInstance.post<RegistrationCodeConfirmResponse>('/Auth/register-email/confirm', {
      email,
      code,
    });
    return data;
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/Auth/google', { idToken });
    if (data.token) TokenService.persist(data.token, data.user);
    return data;
  }

  async loginWithApple(idToken: string): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/Auth/apple', { idToken });
    if (data.token) TokenService.persist(data.token, data.user);
    return data;
  }

  logout(): void {
    TokenService.clear();
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    return TokenService.getUser();
  }

  async updateUser(id: string, data: Partial<RegisterRequest>): Promise<User> {
    const { data: updated } = await axiosInstance.put<User>(`/Users/${id}`, data);
    if (updated) TokenService.updateUser(updated);
    return updated;
  }
}
