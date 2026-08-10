import type { ButtonHTMLAttributes, ReactElement } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'google' | 'ghost' }

/** Shadcn-style, source-owned button primitive customized for the pastel theme. */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps): ReactElement {
  return <button type={type} className={`${variant === 'primary' ? 'primary-button' : variant === 'google' ? 'google-button' : 'icon-button'} ${className}`.trim()} {...props} />;
}
