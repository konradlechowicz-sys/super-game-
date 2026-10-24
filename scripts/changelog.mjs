// CHANGELOG.md: what changed in every build and in every App Store release.
//
// Layout (newest first):
//   ## Następne wydanie                       summary of everything since the last release + "What's New" for the App Store
//   ## Build 23 · 2026-10-21                  one section per build, bullets tagged [Nowe] [Balans] [Poprawka] ...
//   ## v1.0.0 · build 21 · 2026-10-19 · App Store   written by npm run release from "Następne wydanie"
//   ## Build 21 · 2026-10-19
// npm run bump adds the build header; Claude fills in the bullets. review.mjs and release.mjs read it from git.
import { execSync } from 'node:child_process';

export const FILE = 'CHANGELOG.md';
export const NEXT = '## Następne wydanie';
export const PLACEHOLDER = '- (opis zmian do uzupełnienia)';
// Tags in the order a release summary lists them. [Narzędzia] are developer tools that players never see.
export const TAGS = ['Nowe', 'Zmiana', 'Balans', 'Poprawka', 'App Store', 'Narzędzia'];

const BUILD_RE = /^## Build (\d+) · (\S+)/;
const RELEASE_RE = /^## v(\d+\.\d+\.\d+) · build (\d+)/;

// Splits the file into its "## " sections.
export function parse(text) {
  const sections = [];
  let cur = null;
  for (const line of (text || '').split('\n')) {
    if (line.startsWith('## ')) {
      cur = { head: line, lines: [] };
      sections.push(cur);
      const b = line.match(BUILD_RE), r = line.match(RELEASE_RE);
      if (b) Object.assign(cur, { kind: 'build', build: +b[1], date: b[2] });
      else if (r) Object.assign(cur, { kind: 'release', version: r[1], build: +r[2] });
      else if (line.trim() === NEXT) cur.kind = 'next';
    } else if (cur) cur.lines.push(line);
  }
  for (const s of sections) {
    while (s.lines.length && !s.lines[s.lines.length - 1].trim()) s.lines.pop();
    s.bullets = s.lines.filter((l) => /^- /.test(l) && l !== PLACEHOLDER);
  }
  return sections;
}

// CHANGELOG.md as it is in a commit; '' if that version has none yet.
export function readAt(ref) {
  try {
    return execSync(`git show ${ref}:${FILE}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

// Build sections with from < build <= to, newest first.
export function buildsBetween(text, from, to) {
  return parse(text).filter((s) => s.kind === 'build' && s.build > from && s.build <= to).sort((a, b) => b.build - a.build);
}

// Text block for the terminal: each build with its bullets.
export function describe(builds, indent = '     ', maxPerBuild = Infinity) {
  if (!builds.length) return `${indent}(brak opisu zmian w CHANGELOG.md)`;
  return builds.map((b) => {
    const list = b.bullets.length ? b.bullets : ['- (bez opisu)'];
    const shown = list.slice(0, maxPerBuild).map((l) => `${indent}  ${l}`);
    if (list.length > maxPerBuild) shown.push(`${indent}  … i ${list.length - maxPerBuild} więcej`);
    return `${indent}Build ${b.build} (${b.date}):\n${shown.join('\n')}`;
  }).join('\n');
}

// Every bullet of these builds grouped by tag: the player-facing list of a release.
export function grouped(builds) {
  const groups = new Map(TAGS.map((t) => [t, []]));
  const other = [];
  for (const b of [...builds].reverse()) {
    for (const l of b.bullets) {
      const m = l.match(/^- \[([^\]]+)\]\s*(.*)$/);
      if (m && groups.has(m[1])) groups.get(m[1]).push(`- ${m[2]} (build ${b.build})`);
      else other.push(`${l} (build ${b.build})`);
    }
  }
  const out = [];
  for (const [tag, items] of groups) if (items.length) out.push(`**${tag}**`, ...items, '');
  if (other.length) out.push('**Inne**', ...other, '');
  return out.join('\n').trim();
}

// npm run bump: a new empty section for this build, right under "Następne wydanie".
export function addBuild(text, build, date) {
  if (parse(text).some((s) => s.kind === 'build' && s.build === build)) return text;
  const entry = `## Build ${build} · ${date}\n${PLACEHOLDER}\n\n`;
  const lines = text.split('\n');
  const at = lines.findIndex((l, i) => l.startsWith('## ') && l.trim() !== NEXT && i > 0);
  if (at < 0) return `${text.trimEnd()}\n\n${entry}`;
  lines.splice(at, 0, ...entry.split('\n').slice(0, -1));
  return lines.join('\n');
}

// npm run release: "Następne wydanie" becomes the release's section with a full summary of its builds,
// and a fresh empty "Następne wydanie" goes on top.
// note: an optional first line, e.g. that the same build was released before under another version.
export function stampRelease(text, { version, build, date, fromBuild, note }) {
  const sections = parse(text);
  const next = sections.find((s) => s.kind === 'next');
  const builds = buildsBetween(text, fromBuild, build);
  // Template notes (HTML comments) stay out of the release.
  const summary = next ? next.lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').trim() : '';
  const body = [
    note && `_${note}_`,
    summary,
    `### Wszystkie zmiany (buildy ${builds.length ? `${builds[builds.length - 1].build}–${builds[0].build}` : '—'})`,
    grouped(builds) || '- (brak opisanych zmian)',
  ].filter(Boolean).join('\n\n');
  const release = `## v${version} · build ${build} · ${date} · App Store\n\n${body}\n`;
  const fresh = `${NEXT}\n\n<!-- Podsumowanie zmian od v${version}; uzupełnia Claude przy każdym buildzie. -->\n\n### What's New (App Store)\n\n- \n`;
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === NEXT);
  if (start < 0) {
    const first = lines.findIndex((l) => l.startsWith('## '));
    lines.splice(first < 0 ? lines.length : first, 0, ...`${fresh}\n${release}`.split('\n'));
    return lines.join('\n');
  }
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end < 0) end = lines.length;
  // The release section goes above the newest build it includes, so the file stays in time order.
  const out = [...lines.slice(0, start), ...fresh.split('\n'), ...lines.slice(end)];
  const at = out.findIndex((l) => { const m = l.match(BUILD_RE); return m && +m[1] <= build; });
  out.splice(at < 0 ? out.length : at, 0, ...release.split('\n'));
  return out.join('\n');
}

// The "What's New" text of a section (for App Store Connect), or ''.
export function whatsNew(section) {
  if (!section) return '';
  const i = section.lines.findIndex((l) => /^### What's New/.test(l));
  if (i < 0) return '';
  const rest = section.lines.slice(i + 1);
  const end = rest.findIndex((l) => l.startsWith('### '));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim().replace(/^-\s*$/, '');
}
