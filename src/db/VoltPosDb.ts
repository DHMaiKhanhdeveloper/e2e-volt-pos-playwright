import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Read-only accessor for the local VoltPOS SQLite database (the Tauri app's
 * `%APPDATA%/VoltPOS/Databases/<merchant>/Main/<uuid>` file). Used to RE-DERIVE
 * report numbers from raw tables (orders / order_item / compensation / …) — the
 * "Cách 2" approach ported from `volt-pos/.dbwork/report-tool.cjs`.
 *
 * This is a LOCAL-ONLY data source: it exists only on a dev machine that runs
 * the desktop app. Tests must `VoltPosDb.tryOpen()` and skip when it returns
 * `null` so CI (no app, no DB) stays green.
 */
export class VoltPosDb {
  private constructor(
    private readonly db: DatabaseSync,
    private readonly tempFiles: string[],
  ) {}

  /** Merchant timezone offset used by the app (UTC+7, no DST) as a SQLite modifier. */
  static readonly TZ_SQL = '+7 hours';

  /**
   * Copy the live DB (+ WAL/SHM) to a temp location and open it read-only, so we
   * never touch the running app's files. Returns `null` when the DB can't be
   * found (e.g. CI) — callers should `test.skip` on null.
   */
  static tryOpen(merchant = process.env.VOLTPOS_MERCHANT ?? '14'): VoltPosDb | null {
    const appData = process.env.APPDATA;
    if (!appData) return null;
    const mainDir = path.join(appData, 'VoltPOS', 'Databases', merchant, 'Main');
    let dbid: string | undefined;
    try {
      dbid = fs.readdirSync(mainDir).find((f) => /^[0-9a-f-]{36}$/.test(f));
    } catch {
      return null;
    }
    if (!dbid) return null;

    const tmpBase = path.join(os.tmpdir(), `voltpos-rederive-${process.pid}.db`);
    const tempFiles: string[] = [];
    for (const [src, dst] of [
      [dbid, tmpBase],
      [`${dbid}-wal`, `${tmpBase}-wal`],
      [`${dbid}-shm`, `${tmpBase}-shm`],
    ]) {
      try {
        fs.copyFileSync(path.join(mainDir, src), dst);
        tempFiles.push(dst);
      } catch {
        /* WAL/SHM may not exist — fine */
      }
    }
    if (!tempFiles.includes(tmpBase)) return null;

    try {
      const db = new DatabaseSync(tmpBase, { readOnly: true });
      return new VoltPosDb(db, tempFiles);
    } catch {
      for (const f of tempFiles) {
        try {
          fs.unlinkSync(f);
        } catch {
          /* ignore */
        }
      }
      return null;
    }
  }

  /** First row of a query (or `undefined`). */
  one<T = Record<string, number | string | null>>(sql: string, params: unknown[] = []): T {
    return this.db.prepare(sql).get(...(params as never[])) as T;
  }

  /** All rows of a query. */
  all<T = Record<string, number | string | null>>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }

  /** Close the connection and delete the temp copies. */
  close(): void {
    try {
      this.db.close();
    } catch {
      /* ignore */
    }
    for (const f of this.tempFiles) {
      try {
        fs.unlinkSync(f);
      } catch {
        /* ignore */
      }
    }
  }
}
