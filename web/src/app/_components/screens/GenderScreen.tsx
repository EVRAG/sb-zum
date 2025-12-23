"use client";

import clsx from "clsx";
import type { Gender } from "../../_types/flow";

type Props = {
  selectedGender: Gender | null;
  onSelect: (gender: Gender) => void;
  onNext: () => void;
};

export function GenderScreen({ selectedGender, onSelect, onNext }: Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-black sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#BF5468]">
            Настройка генерации
          </h2>
          <p className="text-3xl font-bold text-black">Укажите пол</p>
        </div>

        <div className="grid w-full max-w-xl grid-cols-2 gap-6">
          <GenderCard
            label="М"
            gender="male"
            active={selectedGender === "male"}
            onClick={() => onSelect("male")}
          />
          <GenderCard
            label="Ж"
            gender="female"
            active={selectedGender === "female"}
            onClick={() => onSelect("female")}
          />
        </div>

        <button
          disabled={!selectedGender}
          onClick={onNext}
          className={clsx(
            "rounded-xl px-10 py-4 text-lg font-bold transition active:scale-95",
            selectedGender
              ? "bg-white text-black shadow-lg shadow-white/20 hover:bg-white/90"
              : "bg-white/50 text-black/40 cursor-not-allowed",
          )}
        >
          Далее
        </button>
      </div>
    </div>
  );
}

function GenderCard({
  label,
  gender,
  active,
  onClick,
}: {
  label: string;
  gender: Gender;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all",
        active
          ? "border-black bg-white shadow-inner"
          : "border-black/5 bg-white hover:border-black/10",
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F2B077] to-[#F27272] text-3xl font-bold text-white">
        {label}
      </div>
      <p className="text-lg font-bold text-black">{gender === "male" ? "Мужской" : "Женский"}</p>
    </button>
  );
}

