// Simple logger for the mobile app — visible in Expo terminal / Metro bundler
// In production builds these are no-ops so there's no perf cost

const isDev = __DEV__

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
}

function ts() {
  return new Date().toTimeString().split(' ')[0] // HH:MM:SS
}

function format(level, tag, message, data) {
  const color = { INFO: COLORS.cyan, WARN: COLORS.yellow, ERROR: COLORS.red, ACTION: COLORS.green }[level] || ''
  const prefix = `${COLORS.gray}[${ts()}]${COLORS.reset} ${color}${level.padEnd(6)}${COLORS.reset} ${COLORS.bold}${tag}${COLORS.reset}`
  const suffix = data !== undefined ? `\n${COLORS.gray}${JSON.stringify(data, null, 2)}${COLORS.reset}` : ''
  return `${prefix} ${message}${suffix}`
}

export const logger = {
  info(tag, message, data) {
    if (!isDev) return
    console.log(format('INFO', tag, message, data))
  },
  warn(tag, message, data) {
    if (!isDev) return
    console.warn(format('WARN', tag, message, data))
  },
  error(tag, message, data) {
    if (!isDev) return
    console.error(format('ERROR', tag, message, data))
  },
  action(tag, message, data) {
    if (!isDev) return
    console.log(format('ACTION', tag, message, data))
  },
}
