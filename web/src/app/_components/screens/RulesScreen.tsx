"use client";

import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Исключи жесты и руки в кадре",
    description: "Смотри прямо, не закрывай лицо руками или жестами.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Сними очки, головные уборы и маски",
    description: "Максимальная ясность черт лица для точной обработки.",
    icon: LockClosedIcon,
  },
  {
    name: "В кадре только ты",
    description: "Селфи/портрет одного человека без посторонних.",
    icon: ArrowPathIcon,
  },
  {
    name: "Держи лицо в контуре",
    description: "Расположи лицо так, чтобы оно помещалось в рамку.",
    icon: FingerPrintIcon,
  },
];

export function RulesScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#BF5468]">
            Важно перед съемкой
          </h2>
          <p className="text-3xl font-bold text-black sm:text-4xl">Несколько простых правил</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 text-left sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.name} className="flex gap-4 rounded-2xl bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#32A69A] text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-black">{f.name}</p>
                <p className="text-sm text-black/60">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="mt-4 rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
        >
          НАЧАТЬ
        </button>
      </div>
    </div>
  );
}

