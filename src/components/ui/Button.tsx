import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-docly-accent text-black font-medium hover:bg-red-400 active:scale-[0.98] shadow-[0_0_20px_rgba(255,42,42,0.25)]',
  ghost:
    'bg-white/5 border border-docly-border text-neutral-200 hover:bg-white/10 hover:border-red-500/40',
  danger: 'bg-red-950/80 text-red-200 border border-red-900 hover:bg-red-900/80',
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
