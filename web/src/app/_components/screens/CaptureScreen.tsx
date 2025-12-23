"use client";

import clsx from "clsx";

type Props = {
  isCapturing: boolean;
  onCapture: () => void;
};

export function CaptureScreen({ isCapturing, onCapture }: Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#BF5468]">
            Сделайте фото
          </h2>
          <p className="text-3xl font-bold text-black">Смотрите в камеру</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onCapture}
            disabled={isCapturing}
            className={clsx(
              "rounded-xl px-10 py-5 text-xl font-bold transition active:scale-95",
              isCapturing
                ? "bg-white/50 text-black/40 cursor-not-allowed"
                : "bg-white text-black shadow-lg shadow-white/20 hover:bg-white/90",
            )}
          >
            {isCapturing ? "ОБРАБОТКА..." : "СДЕЛАТЬ ФОТО"}
          </button>
          <p className="max-w-xs text-sm font-medium text-black/60">
            Держите лицо в рамке и нажмите кнопку. Обработка займёт около 5 секунд.
          </p>
        </div>
      </div>
    </div>
  );
}

