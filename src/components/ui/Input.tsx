import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-docly-border bg-docly-surface/85 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-docly-accent focus:ring-1 focus:ring-docly-accent/40 ${className}`}
      {...props}
    />
  )
}
