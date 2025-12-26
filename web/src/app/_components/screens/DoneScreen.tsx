"use client";

type Props = {
  onRestart: () => void;
  onQrAndPrint: () => void;
};

export function DoneScreen({ onRestart, onQrAndPrint }: Props) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onQrAndPrint}
            className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
          >
            Получить QR код и распечатать
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

