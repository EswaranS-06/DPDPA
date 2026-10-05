import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { connect } from 'node:net'
import { join } from 'node:path'

// Starts and stops the built web and API apps in the background, on Linux, macOS and Windows.
// Each process gets a pid file and a log in .run/.

export type AppName = 'api' | 'web'

const runDir = (root: string) => join(root, '.run')
const pidFile = (root: string, name: AppName) => join(runDir(root), `${name}.pid`)
export const logFile = (root: string, name: AppName) => join(runDir(root), `${name}.log`)

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const readPid = (root: string, name: AppName): number | null => {
  const file = pidFile(root, name)
  if (!existsSync(file)) return null
  const pid = Number(readFileSync(file, 'utf8').trim())
  return Number.isInteger(pid) && pid > 0 && isAlive(pid) ? pid : null
}

/** True when something answers on the port. */
export const portOpen = (port: number, host = '127.0.0.1') =>
  new Promise<boolean>((resolve) => {
    const socket = connect({ port, host })
    socket.setTimeout(1500)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(false))
  })

const command = (root: string, name: AppName, port: number): { cwd: string; args: string[] } => {
  if (name === 'api') {
    return {
      cwd: join(root, 'apps', 'backend'),
      args: [join(root, 'apps', 'backend', 'dist', 'main.js')],
    }
  }
  const web = join(root, 'apps', 'web')
  const next = createRequire(join(web, 'package.json')).resolve('next/dist/bin/next')
  return { cwd: web, args: [next, 'start', '-H', '0.0.0.0', '-p', String(port)] }
}

/** Starts one app unless it already runs; returns its pid. */
export const startApp = (root: string, name: AppName, port: number): number => {
  const running = readPid(root, name)
  if (running) return running
  mkdirSync(runDir(root), { recursive: true })
  const log = openSync(logFile(root, name), 'a')
  const { cwd, args } = command(root, name, port)
  const child = spawn(process.execPath, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'production' },
  })
  child.unref()
  writeFileSync(pidFile(root, name), String(child.pid ?? ''))
  return child.pid ?? 0
}

/** Stops one app (and its child processes); true when it was running. */
export const stopApp = (root: string, name: AppName): boolean => {
  const pid = readPid(root, name)
  rmSync(pidFile(root, name), { force: true })
  if (!pid) return false
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      process.kill(pid, 'SIGTERM')
    }
  }
  return true
}

export const appStatus = async (root: string, name: AppName, port: number) => ({
  name,
  pid: readPid(root, name),
  listening: await portOpen(port),
  log: logFile(root, name),
})
