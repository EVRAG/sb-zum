"use client";

type Props = {
  onRestart: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  imageBase64?: string | null;
};

export function DoneScreen({ onRestart, primaryLabel, onPrimary, imageBase64 }: Props) {
  const imageSrc = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Готово!</h2>
          <p className="text-4xl font-bold text-white">Путешествие собрано</p>
        </div>
        <div className="flex w-full flex-col items-center gap-4">
          <p className="max-w-md text-lg text-white/90">
            Если фото получилось неудачным — просто попробуйте сгенерировать ещё раз!
          </p>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Сгенерированное фото"
              className="max-h-[480px] w-full max-w-xl rounded-2xl border border-white/10 object-contain shadow-xl shadow-black/30"
            />
          ) : (
            <p className="text-sm text-white/70">Ожидаем изображение…</p>
          )}
        </div>
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

