// Copies the playbook into a folder that runs on its own on a Windows (or any) computer with
// Node.js 22.18 or later and Chrome or Edge: node src/bundle.ts <folder>
// The folder gets the site, the runtime sources, a package.json with only the browser driver,
// and "Start playbook.cmd", which installs the driver once and opens http://localhost:53001.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const out = resolve(process.argv[2] ?? 'playbook')
const RUNTIME = [
  'types.ts',
  'catalog.ts',
  'controls.ts',
  'locate.ts',
  'overlay.ts',
  'runner.ts',
  'browser.ts',
  'search.ts',
  'server.ts',
]

const manifest = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>
}

mkdirSync(join(out, 'src'), { recursive: true })
for (const file of RUNTIME) cpSync(join(here, file), join(out, 'src', file))
cpSync(join(here, 'site'), join(out, 'src', 'site'), { recursive: true })

writeFileSync(
  join(out, 'package.json'),
  `${JSON.stringify(
    {
      name: 'duatf-playbook',
      private: true,
      type: 'module',
      scripts: { start: 'node src/server.ts' },
      dependencies: manifest.dependencies,
    },
    null,
    2,
  )}\n`,
)

const cmd = [
  '@echo off',
  'rem DUATF Playbook: installs the browser driver the first time, then opens http://localhost:53001.',
  'rem Set DUATF_URL to guide another DUATF address (default http://192.168.0.110:53000).',
  'cd /d "%~dp0"',
  'where node >nul 2>nul || (echo Node.js 22.18 or later is needed: https://nodejs.org & pause & exit /b 1)',
  'if not exist node_modules\\playwright-core (',
  '  echo Installing the browser driver, once...',
  '  call npm install --no-audit --no-fund || (pause & exit /b 1)',
  ')',
  'start "" http://localhost:53001',
  'node src\\server.ts',
  'pause',
  '',
].join('\r\n')
writeFileSync(join(out, 'Start playbook.cmd'), cmd)

writeFileSync(
  join(out, 'README.txt'),
  [
    'DUATF Playbook',
    '',
    'Double-click "Start playbook.cmd". The playbook opens at http://localhost:53001.',
    'Pick a task and press "Show me" or "Guide me": a Chrome window opens DUATF and walks',
    'through the task. Sign in there with your own DUATF account the first time; the window',
    'keeps its sign-in. Steps that save or send something always wait for you.',
    '',
    'Needs Node.js 22.18 or later and Google Chrome (or Microsoft Edge).',
    'Generated from tools/playbook in the DUATF repository; edit the tours there.',
    '',
  ].join('\r\n'),
)
console.log(`Playbook copied to ${out}`)
