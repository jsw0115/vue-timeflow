export function liveEditors(entries, resource, now, ownClient) {
  return entries.filter(entry => entry.resource === resource && entry.clientId !== ownClient && entry.expiresAt > now && entry.expiresAt <= now + 30000 && typeof entry.name === 'string')
}
