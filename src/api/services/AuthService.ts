import { AuthApiClient } from '@api/clients/AuthApiClient';
import { LoginResponse } from '@api/models/Auth';
import { Logger } from '@utils/logger';

/**
 * Business-level wrapper. Tests should generally talk to services, not raw clients,
 * so we can change endpoints / payloads in one place.
 */
export class AuthService {
  private readonly logger = Logger.child({ module: 'AuthService' });

  constructor(private readonly client: AuthApiClient) {}

  async loginAs(username: string, password: string): Promise<LoginResponse> {
    this.logger.info(`Login as ${username}`);
    const session = await this.client.login({ username, password });
    this.client.setToken(session.accessToken);
    return session;
  }

  async logout(): Promise<void> {
    await this.client.logout();
  }
}
