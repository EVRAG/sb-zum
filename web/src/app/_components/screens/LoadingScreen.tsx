"use client";

export function LoadingScreen({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Загрузка...
          </h2>
          <p className="text-3xl font-bold text-white">Переносим вас в мир</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#32A69A]/20 border-t-[#32A69A]" />
            <div
              className="absolute inset-3 animate-spin rounded-full border-4 border-[#F27272]/20 border-b-[#F27272]"
              style={{ animationDuration: "4s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
              {clamped}%
            </div>
          </div>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-gradient-to-r from-[#32A69A] via-[#F2B077] to-[#F27272] transition-all duration-300"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <p className="text-sm font-medium text-white/90">
            Пожалуйста, подождите около 30 секунд...
          </p>
        </div>
      </div>
    </div>
  );
}

