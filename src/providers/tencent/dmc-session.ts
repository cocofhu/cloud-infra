/** In-process DMC login only. Never persist to overlay or disk. */

export interface DmcSession {
  instanceId: string
  region: string
  host: string
  port: number
  user: string
  password: string
  database?: string
}

export interface PublicDmcSession {
  instanceId: string
  region: string
  user: string
  host: string
  port: number
  database?: string
}

const sessions = new Map<string, DmcSession>()

export function dmcSessionKey(instanceId: string, region = ''): string {
  return `${region}:${instanceId}`
}

export function putDmcSession(session: DmcSession): PublicDmcSession {
  sessions.set(dmcSessionKey(session.instanceId, session.region), session)
  return toPublicDmc(session)
}

export function getDmcSession(instanceId: string, region = ''): DmcSession | undefined {
  return sessions.get(dmcSessionKey(instanceId, region))
}

export function deleteDmcSession(instanceId: string, region = ''): void {
  sessions.delete(dmcSessionKey(instanceId, region))
}

export function clearDmcSessions(): void {
  sessions.clear()
}

export function toPublicDmc(session: DmcSession): PublicDmcSession {
  return {
    instanceId: session.instanceId,
    region: session.region,
    user: session.user,
    host: session.host,
    port: session.port,
    database: session.database,
  }
}
