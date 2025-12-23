"use client";

import Image from "next/image";

export function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={160}
            height={160}
            style={{ width: '160px', height: '160px' }}
            priority
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
            Цирковое волшебство
          </h2>
          <p className="text-xl font-medium text-[#BF5468]">Фотозона с магией нейросети</p>
        </div>
        <p className="max-w-xl text-lg text-black/70">
          Окунитесь в мир иллюзий! Сделайте фото и нейросеть перенесёт вас в удивительные места Завидово или прямо на арену цирка. Увидьте магию искусственного интеллекта своими глазами.
        </p>
        <button
          onClick={onNext}
          className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
        >
          НАЧАТЬ
        </button>
      </div>
    </div>
  );
}

