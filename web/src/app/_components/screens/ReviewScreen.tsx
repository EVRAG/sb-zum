"use client";

type Props = {
  onAccept: () => void;
  onRetry: () => void;
};

export function ReviewScreen({ onAccept, onRetry }: Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#BF5468]">
            Проверьте фото
          </h2>
          <p className="text-3xl font-bold text-black">Всё ли ок?</p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onAccept}
            className="rounded-xl bg-black px-10 py-4 text-lg font-bold text-white shadow-lg shadow-black/20 transition hover:bg-black/85 active:scale-95"
          >
            ДАЛЕЕ
          </button>
          <button
            onClick={onRetry}
            className="rounded-xl bg-black/10 px-10 py-4 text-lg font-bold text-black hover:bg-black/15 transition active:scale-95"
          >
            ЕЩЕ РАЗ
          </button>
        </div>
      </div>
    </div>
  );
}

