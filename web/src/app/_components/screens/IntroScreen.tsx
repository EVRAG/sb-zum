"use client";

export function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
            Виртуальное путешествие
          </h2>
          <p className="text-xl font-medium text-[#BF5468]">по Тверской области!</p>
        </div>
        <p className="max-w-xl text-lg text-black/70">
          Несколько шагов — и мы перенесем вас в уникальный мир. Нажмите «Начать», чтобы продолжить.
        </p>
        <button
          onClick={onNext}
          className="rounded-xl bg-black px-8 py-4 text-lg font-bold text-white shadow-lg shadow-black/20 transition hover:bg-black/85 active:scale-95"
        >
          НАЧАТЬ
        </button>
      </div>
    </div>
  );
}

