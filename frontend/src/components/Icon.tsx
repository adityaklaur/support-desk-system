import type { ReactNode, SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { name: string; size?: number }

const shapes: Record<string, ReactNode> = {
  'arrow-left': <><path d="m15 18-6-6 6-6"/><path d="M20 12H9"/></>,
  'arrow-right': <><path d="m9 18 6-6-6-6"/><path d="M4 12h11"/></>,
  'check': <path d="m5 12 4 4L19 6"/>,
  'close': <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  'edit': <><path d="m16 5 3 3"/><path d="M4 20l4-.8 11-11a2 2 0 0 0-3-3l-11 11L4 20Z"/></>,
  'message': <path d="M20 11a8 8 0 0 1-8 8 9 9 0 0 1-4-.8L4 20l1-4a8 8 0 1 1 15-5Z"/>,
  'send': <><path d="m21 3-8 18-3-7-7-3Z"/><path d="M10 14 21 3"/></>,
  'activity': <><path d="M3 12h4l3-7 4 14 3-7h4"/></>,
  'plus': <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  'tickets': <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h7"/></>,
  'dashboard': <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  'refresh': <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12-3"/></>,
  'search': <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  'clock': <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  'filter': <><path d="M4 5h16l-6.5 8v6l-3 2v-8Z"/></>,
  'alert': <><path d="M12 3 2 21h20Z"/><path d="M12 10v4M12 17h.01"/></>,
}

export default function Icon({ name, size = 18, ...rest }: Props) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {shapes[name] ?? shapes.tickets}
  </svg>
}
