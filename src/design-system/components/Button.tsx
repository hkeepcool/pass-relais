import type { ReactNode, ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:     ButtonVariant
  size?:        ButtonSize
  loading?:     boolean
  fullWidth?:   boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-ink text-bg border border-ink hover:bg-ink-2',
  accent:    'bg-accent text-on-accent border border-accent hover:bg-accent-2',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  ghost:     'bg-transparent text-ink border border-transparent hover:bg-surface-2',
  danger:    'bg-status-alert text-white border border-status-alert hover:bg-status-alert/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-4 text-sm',
  md: 'min-h-[56px] px-[22px] text-base',
  lg: 'min-h-[64px] px-8 text-lg',
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-[18px] h-[18px] rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2.5',
        'font-ui font-semibold tracking-[-0.005em]',
        'rounded-md',
        'transition-all duration-[var(--t-fast,100ms)]',
        'active:scale-[0.975]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
}
