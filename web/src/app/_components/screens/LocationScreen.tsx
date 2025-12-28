"use client";

import clsx from "clsx";
import type { LocationCard } from "../../_types/flow";

type Props = {
  locations: LocationCard[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNext: () => void;
};

export function LocationScreen({ locations, selectedId, onSelect, onNext }: Props) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Выберите локацию
          </h2>
          <p className="text-3xl font-bold text-white">Куда отправимся?</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              className={clsx(
                "group relative aspect-[10/7] overflow-hidden rounded-2xl border-2 transition-all",
                selectedId === loc.id
                  ? "border-[#32A69A] ring-4 ring-[#32A69A]/20"
                  : "border-transparent hover:border-black/10",
              )}
            >
              <img
                src={loc.image}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </button>
          ))}
        </div>

        <button
          disabled={!selectedId}
          onClick={onNext}
          className={clsx(
            "rounded-xl px-10 py-4 text-lg font-bold transition active:scale-95",
            selectedId
              ? "bg-white text-black shadow-lg shadow-white/20 hover:bg-white/90"
              : "bg-white/50 text-black/40 cursor-not-allowed",
          )}
        >
          ДАЛЕЕ
        </button>
      </div>
    </div>
  );
}

