import type { ServiceInfo } from '@/types'

// Ports that are definitely not HTTP/web services (port 22/SSH handled separately)
const NON_HTTP_PORTS = new Set([
  21,             // FTP
  23,             // Telnet
  25, 465, 587,   // SMTP
  53,             // DNS
  110, 143, 993, 995,   // IMAP / POP3
  389, 636,       // LDAP
  445,            // SMB
  514,            // Syslog
  1433,           // MSSQL
  3306,           // MySQL
  5432,           // PostgreSQL
  5672,           // RabbitMQ AMQP
  6379,           // Redis
  9092,           // Kafka
  11211,          // Memcached
  27017, 27018,   // MongoDB
])

function parseHostForServiceUrl(host: string): { hostWithoutPort: string; existingPort?: number } | null {
  let normalized = host.trim()
  if (!normalized) return null

  normalized = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  normalized = normalized.split('/')[0].split('?')[0].split('#')[0]
  if (!normalized) return null

  if (normalized.startsWith('[')) {
    const closingBracketIndex = normalized.indexOf(']')
    if (closingBracketIndex !== -1) {
      const hostWithoutPort = normalized.slice(0, closingBracketIndex + 1)
      const rest = normalized.slice(closingBracketIndex + 1)
      const portMatch = rest.match(/^:(\d+)$/)
      const existingPort = portMatch ? Number(portMatch[1]) : undefined
      return existingPort ? { hostWithoutPort, existingPort } : { hostWithoutPort }
    }
  }

  const hasSingleColon = normalized.indexOf(':') === normalized.lastIndexOf(':')
  if (!hasSingleColon) {
    return { hostWithoutPort: normalized }
  }

  const portMatch = normalized.match(/:(\d+)$/)
  if (portMatch) {
    const hostWithoutPort = normalized.slice(0, normalized.length - portMatch[0].length)
    const existingPort = Number(portMatch[1])
    return existingPort ? { hostWithoutPort, existingPort } : { hostWithoutPort }
  }

  return { hostWithoutPort: normalized }
}

function normalizeServicePath(path: string | undefined): string {
  const trimmed = (path ?? '').trim()
  if (!trimmed) return ''
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function isValidServicePort(port: number | undefined): port is number {
  if (port == null) return false
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

export function getServiceUrl(svc: ServiceInfo, host?: string): string | null {
  if (!host) return null
  if (svc.protocol === 'udp') return null // UDP — not HTTP

  const port = svc.port
  const hasServicePort = isValidServicePort(port)
  const normalizedPath = normalizeServicePath(svc.path)
  if (!hasServicePort && !normalizedPath) return null

  if (hasServicePort && port === 22) return null // SSH — no browser
  if (hasServicePort && NON_HTTP_PORTS.has(port)) return null

  const name = svc.service_name.toLowerCase()
  const isHttps =
    name.includes('https') || name.includes('ssl') || name.includes('tls') ||
    (hasServicePort && (port === 443 || port === 8443))

  const parsedHost = parseHostForServiceUrl(host)
  if (!parsedHost?.hostWithoutPort) return null

  const authority = hasServicePort
    ? `${parsedHost.hostWithoutPort}:${port}`
    : parsedHost.existingPort
      ? `${parsedHost.hostWithoutPort}:${parsedHost.existingPort}`
      : parsedHost.hostWithoutPort

  return `${isHttps ? 'https' : 'http'}://${authority}${normalizedPath}`
}
