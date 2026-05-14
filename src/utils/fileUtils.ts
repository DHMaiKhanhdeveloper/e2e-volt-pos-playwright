import * as fs from 'fs';
import * as path from 'path';

export const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

export const readJson = <T>(filePath: string): T => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

export const writeJson = (filePath: string, data: unknown, pretty = true): void => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, pretty ? 2 : 0), 'utf-8');
};

export const exists = (filePath: string): boolean => fs.existsSync(filePath);
