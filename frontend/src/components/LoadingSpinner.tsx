export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner"/>{label}</div>
}
