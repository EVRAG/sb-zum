"use client";

export function DoneScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#32A69A]">Готово!</h2>
          <p className="text-4xl font-bold text-black">Путешествие собрано</p>
        </div>
        <p className="max-w-md text-lg text-black/70">
          Ваше уникальное приключение готово. Хотите попробовать еще раз с другими настройками?
        </p>
        <button
          onClick={onRestart}
          className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
        >
          СГЕНЕРИРОВАТЬ ЕЩЕ
        </button>
      </div>
    </div>
  );
}

