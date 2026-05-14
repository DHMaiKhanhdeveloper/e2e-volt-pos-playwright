import { BaseApiClient } from './BaseApiClient';
import { LoginRequest, LoginResponse } from '@api/models/Auth';

export class AuthApiClient extends BaseApiClient {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await this.post('/auth/login', { data: payload });
    if (!res.ok()) {
      throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
    }
    return (await res.json()) as LoginResponse;
  }

  async logout(): Promise<void> {
    const res = await this.post('/auth/logout');
    if (!res.ok() && res.status() !== 204) {
      throw new Error(`Logout failed: ${res.status()}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const res = await this.post('/auth/refresh', { data: { refreshToken } });
    if (!res.ok()) {
      throw new Error(`Refresh token failed: ${res.status()}`);
    }
    return (await res.json()) as LoginResponse;
  }
}
