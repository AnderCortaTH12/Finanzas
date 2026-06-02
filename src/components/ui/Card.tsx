import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Tarjeta base: fondo, esquinas redondeadas y sombra suave. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-card bg-white dark:bg-slate-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
