// Generates docs/test-commands.md: every test case + the exact command to run it,
// grouped by spec file, plus commands to run a whole file/suite/tag/everything.
// Regenerate any time test cases are added/removed:
//   node scripts/generate-test-commands.mjs
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT_FILE = 'docs/test-commands.md';

function listTests() {
  const raw = execSync('npx playwright test --list --reporter=list', {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 32,
  });
  const lines = raw.split(/\r?\n/).filter((l) => l.includes(' › ') && l.includes(':'));
  const byFile = new Map();

  for (const line of lines) {
    // format: [project] › path\to\file.spec.ts:LINE:COL › describe › ... › title
    const m = line.match(/^\s*\[([^\]]+)\]\s*›\s*(\S+):(\d+):\d+\s*›\s*(.+)$/);
    if (!m) continue;
    const [, project, rawPath, lineNo, rest] = m;
    const filePath = rawPath.replace(/\\/g, '/');
    const parts = rest.split(' › ').map((p) => p.trim());
    const title = parts.join(' › ');

    if (!byFile.has(filePath)) byFile.set(filePath, { project, tests: [] });
    byFile.get(filePath).tests.push({ line: lineNo, title });
  }
  return byFile;
}

function buildMarkdown(byFile) {
  const files = [...byFile.keys()].sort();
  let totalTests = 0;
  let md = `# Test Commands\n\n`;
  md += `> Tự động sinh bởi \`node scripts/generate-test-commands.mjs\` (skill \`test-commands-sync\`). Không sửa tay — chạy lại script để cập nhật.\n\n`;
  md += `## Chạy toàn bộ / theo nhóm\n\n`;
  md += '```bash\n';
  md += `npx playwright test                      # chạy tất cả test case\n`;
  md += `npm run test                              # alias (ENV=local)\n`;
  md += `npm run test:smoke                        # chỉ tag @smoke\n`;
  md += `npm run test:regression                   # chỉ tag @regression\n`;
  md += `npm run test:api                          # chỉ project api\n`;
  md += `npm run test:e2e                          # chỉ thư mục tests/e2e\n`;
  md += '```\n\n';
  md += `## Theo từng file / từng test case\n\n`;

  for (const filePath of files) {
    const { project, tests } = byFile.get(filePath);
    md += `### \`${filePath}\` _(project: ${project})_\n\n`;
    md += `Chạy cả file:\n\n`;
    md += '```bash\n';
    md += `npx playwright test ${filePath}\n`;
    md += '```\n\n';
    md += `| # | Test case | Command |\n`;
    md += `|---|-----------|---------|\n`;
    tests.forEach((t, i) => {
      totalTests++;
      md += `| ${i + 1} | ${t.title.replace(/\|/g, '\\|')} | \`npx playwright test ${filePath}:${t.line}\` |\n`;
    });
    md += `\n`;
  }

  md = md.replace(
    '> Tự động sinh',
    `> Tổng: **${totalTests} test case** trong **${files.length} file**.\n>\n> Tự động sinh`,
  );
  return md;
}

const byFile = listTests();
const md = buildMarkdown(byFile);
mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, md, 'utf-8');
console.log(`Wrote ${OUT_FILE}`);
