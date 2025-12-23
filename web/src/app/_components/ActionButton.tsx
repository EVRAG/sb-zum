"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    fullWidth?: boolean;
  }
>;

export function ActionButton({
  children,
  variant = "primary",
  fullWidth = true,
  className,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold transition-transform duration-150 active:scale-[0.98]";
  const styles: Record<Variant, string> = {
    primary:
      "bg-white text-black shadow-md shadow-white/25 hover:bg-white/90 disabled:opacity-60 disabled:shadow-none",
    secondary:
      "bg-white text-black border border-black/20 hover:bg-white/90 disabled:opacity-60",
    ghost: "bg-transparent text-white hover:bg-white/10",
  };

  return (
    <button
      className={clsx(base, styles[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

