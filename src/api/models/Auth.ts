export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: UserInfo;
}
