import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
