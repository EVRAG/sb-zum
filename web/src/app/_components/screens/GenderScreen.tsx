"use client";

import clsx from "clsx";
import type { Gender } from "../../_types/flow";

type Props = {
  selectedGender: Gender | null;
  onSelect: (gender: Gender) => void;
  onNext: () => void;
};

export function GenderScreen({ selectedGender, onSelect, onNext }: Props) {
  const options: Array<{ key: string; label: string; badge: string; gender: Gender }> = [
    { key: "man", label: "Мужчина", badge: "М", gender: "male" },
    { key: "woman", label: "Женщина", badge: "Ж", gender: "female" },
    { key: "boy", label: "Мальчик", badge: "М", gender: "kid_male" },
    { key: "girl", label: "Девочка", badge: "Д", gender: "kid_female" },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Настройка генерации
          </h2>
          <p className="text-3xl font-bold text-white">Укажите пол</p>
        </div>

        <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:gap-6">
          {options.map((opt) => (
            <GenderCard
              key={opt.key}
              label={opt.label}
              badge={opt.badge}
              gender={opt.gender}
              active={selectedGender === opt.gender}
              onClick={() => onSelect(opt.gender)}
            />
          ))}
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
  badge,
  gender,
  active,
  onClick,
}: {
  label: string;
  badge: string;
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
        {badge}
      </div>
      <p className="text-lg font-bold text-black">{label}</p>
    </button>
  );
}

