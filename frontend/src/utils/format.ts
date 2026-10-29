export function formatDate(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds)) return 'Unknown time'
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}
