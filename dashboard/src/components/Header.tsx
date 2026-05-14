import { ChangeEvent } from 'react';
import { fmtDate } from '../utils/format';

interface Props {
  startedAt?: string;
  fileName: string | null;
  onReload: () => void;
  onLoadFile: (file: File) => void;
}

export const Header = ({ startedAt, fileName, onReload, onLoadFile }: Props) => {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onLoadFile(f);
    e.target.value = '';
  };

  return (
    <header className="app-header">
      <div>
        <h1>
          E2E Volt POS <span className="muted">— Test Dashboard</span>
        </h1>
        <p className="subtle">
          Source: <code>{fileName ?? '(none)'}</code> · Run started: {fmtDate(startedAt)}
        </p>
      </div>
      <div className="header-actions">
        <label className="btn btn-ghost">
          Open file…
          <input type="file" accept="application/json" onChange={handleFile} hidden />
        </label>
        <button className="btn" onClick={onReload}>
          ⟳ Reload
        </button>
      </div>
    </header>
  );
};
