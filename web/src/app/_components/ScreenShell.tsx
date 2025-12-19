"use client";

import type { ReactNode } from "react";

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ScreenShell({ title, subtitle, children, footer }: ScreenShellProps) {
  return (
    <div className="flex min-h-screen w-full justify-center px-4 py-6 sm:py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[var(--color-panel)]/80 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -right-6 top-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/70">Virtual trip</p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {subtitle ? <p className="text-sm leading-6 text-slate-300">{subtitle}</p> : null}
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-slate-100">{children}</div>
          {footer ? <div className="mt-1">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

