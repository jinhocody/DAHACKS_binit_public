import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`border-2 border-emerald-900 bg-white p-5 shadow-md sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
