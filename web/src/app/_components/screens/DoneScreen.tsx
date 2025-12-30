"use client";

type Props = {
  onRestart: () => void;
  primaryLabel: string;
  onPrimary: () => void;
};

export function DoneScreen({ onRestart, primaryLabel, onPrimary }: Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Готово!</h2>
          <p className="text-4xl font-bold text-white">Путешествие собрано</p>
        </div>
        <p className="max-w-md text-lg text-white/90">
          Если фото получилось неудачным — просто попробуйте сгенерировать ещё раз!
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onPrimary}
            className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
          >
            {primaryLabel}
          </button>
          <button
            onClick={onRestart}
            className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
          >
            Сгенерировать еще
          </button>
        </div>
      </div>
    </div>
  );
}

