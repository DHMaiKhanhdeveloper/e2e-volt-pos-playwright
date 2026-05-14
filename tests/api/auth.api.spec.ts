import { test, expect } from '@fixtures/index';
import { env } from '@configs/env/loadEnv';
import { Tag } from '@/types/testTags';

test.describe(`API — auth ${Tag.API} ${Tag.SMOKE}`, () => {
  test('POST /auth/login returns access token for valid creds', async ({ authClient }) => {
    const session = await authClient.login({
      username: env.ADMIN_USER,
      password: env.ADMIN_PASS,
    });
    expect(session.accessToken).toBeTruthy();
    expect(session.tokenType).toBe('Bearer');
    expect(session.user.email).toBe(env.ADMIN_USER);
  });

  test('POST /auth/login rejects bad password', async ({ authClient }) => {
    await expect(
      authClient.login({ username: env.ADMIN_USER, password: 'definitely-wrong' }),
    ).rejects.toThrow(/Login failed/);
  });
});
