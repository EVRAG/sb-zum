"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton } from "./_components/ActionButton";
import { StatusBadge } from "./_components/StatusBadge";
import { CaptureScreen } from "./_components/screens/CaptureScreen";
import { DoneScreen } from "./_components/screens/DoneScreen";
import { GenderScreen } from "./_components/screens/GenderScreen";
import { IntroScreen } from "./_components/screens/IntroScreen";
import { LoadingScreen } from "./_components/screens/LoadingScreen";
import { LocationScreen } from "./_components/screens/LocationScreen";
import { ReviewScreen } from "./_components/screens/ReviewScreen";
import { RulesScreen } from "./_components/screens/RulesScreen";
import { getDefaultWsUrl, useWebSocket } from "./_hooks/useWebSocket";
import type { Gender, LocationCard, Step } from "./_types/flow";

const LOCATIONS: LocationCard[] = [
  {
    id: 1,
    title: "Валдай",
    subtitle: "Хвойные леса",
    color: "#60a5fa",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/1.png",
  },
  {
    id: 2,
    title: "Тверь",
    subtitle: "Исторический центр",
    color: "#f472b6",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/2.png",
  },
  {
    id: 4,
    title: "Торжок",
    subtitle: "Златошвей",
    color: "#a855f7",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/4.png",
  },
  {
    id: 5,
    title: "Калязин",
    subtitle: "Колокольня",
    color: "#22d3ee",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/5.png",
  },
  {
    id: 6,
    title: "Андреевский",
    subtitle: "Усадьба",
    color: "#fbbf24",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/6.png",
  },
  {
    id: 7,
    title: "Лихославль",
    subtitle: "Ремёсла",
    color: "#34d399",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/7.png",
  },
  {
    id: 8,
    title: "Ржев",
    subtitle: "Панорамы",
    color: "#fb7185",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/8.png",
  },
  {
    id: 9,
    title: "Локация 9",
    subtitle: "Новая точка маршрута",
    color: "#818cf8",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/9.png",
  },
  {
    id: 10,
    title: "Локация 10",
    subtitle: "Новая точка маршрута",
    color: "#f97316",
    image: "https://storage.yandexcloud.net/voting-ett/Zavidovo/10.png",
  },
];

type StepPayload = {
  step: Step;
  gender: Gender | null;
  locationId: number | null;
};

const STEP_PATHS: Step[] = [
  "intro",
  "rules",
  "gender",
  "location",
  "capture",
  "capture_done",
  "loading",
  "done",
  "qr",
];

function parseStepFromPath(pathname: string): Step {
  const raw = pathname.replace(/^\//, "").split("/")[0] || "intro";
  // Backwards compat: old route `/review`
  const segment = raw === "review" ? "capture_done" : raw;
  if (STEP_PATHS.includes(segment as Step)) return segment as Step;
  return "intro";
}

export default function Home() {
  const WS_URL = getDefaultWsUrl();
  const [step, setStep] = useState<Step>("intro");
  const [gender, setGender] = useState<Gender | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPrintButton, setShowPrintButton] = useState<boolean>(true);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status, sendJson } = useWebSocket(WS_URL);

  // admin toggle stored in localStorage: showPrintButton = "true"/"false"
  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const raw = window.localStorage.getItem("showPrintButton");
      if (raw === "true") setShowPrintButton(true);
      else if (raw === "false") setShowPrintButton(false);
    };
    read();
    const handler = () => read();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const emitStep = (nextStep: Step) => {
    const payload: StepPayload = {
      step: nextStep,
      gender,
      locationId,
    };
    sendJson({ ...payload, ts: Date.now() });
  };

  // emit on every step change
  useEffect(() => {
    emitStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, gender, locationId]);

  const handleCapture = () => {
    if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    setIsCapturing(true);
    // explicit event when user clicks "Сделать фото"
    sendJson({
      step: "capture-make-photo",
      gender,
      locationId,
      ts: Date.now(),
    });
    // re-emit capture when user actually presses the button
    emitStep("capture");

    captureTimerRef.current = setTimeout(() => {
      setIsCapturing(false);
      setStep("capture_done");
    }, 6000);
  };

  const handleLoading = () => {
    setStep("loading");
    setProgress(0);
    const duration = 30000;
    const started = Date.now();
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);

    loadingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const nextProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(nextProgress);
      if (elapsed >= duration) {
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
        setStep("done");
      }
    }, 150);
  };

  // Sync step from URL on first render (middleware keeps URL)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathStep = parseStepFromPath(window.location.pathname);
    if (pathStep !== step) setStep(pathStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when step changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = step === "intro" ? "/" : `/${step}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [step]);

  // cleanup timers on unmount
  useEffect(
    () => () => {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    },
    [],
  );

  const resetFlow = () => {
    setGender(null);
    setLocationId(null);
    setProgress(0);
    setIsCapturing(false);
    setStep("intro");
  };

  const restartGeneration = () => {
    sendJson({
      step: "intro",
      gender: null,
      locationId: null,
      command: "restart",
      ts: Date.now(),
    });
    resetFlow();
  };

  let screen = null;

  if (step === "intro") {
    screen = <IntroScreen onNext={() => setStep("rules")} />;
  } else if (step === "rules") {
    screen = <RulesScreen onNext={() => setStep("gender")} />;
  } else if (step === "gender") {
    screen = (
      <GenderScreen
        selectedGender={gender}
        onSelect={setGender}
        onNext={() => setStep("location")}
      />
    );
  } else if (step === "location") {
    screen = (
      <LocationScreen
        locations={LOCATIONS}
        selectedId={locationId}
        onSelect={setLocationId}
        onNext={() => locationId && setStep("capture")}
      />
    );
  } else if (step === "capture") {
    screen = <CaptureScreen isCapturing={isCapturing} onCapture={handleCapture} />;
  } else if (step === "capture_done") {
    screen = (
      <ReviewScreen
        onAccept={handleLoading}
        onRetry={() => {
          if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
          setIsCapturing(false);
          setStep("capture");
        }}
      />
    );
  } else if (step === "loading") {
    screen = <LoadingScreen progress={progress} />;
  } else if (step === "done") {
    screen = (
      <DoneScreen
        primaryLabel={showPrintButton ? "Получить QR код и распечатать" : "Скачать по QR коду"}
        onPrimary={() => {
          sendJson({
            step: showPrintButton ? "create-qr-and-print" : "create-qr",
            gender,
            locationId,
            ts: Date.now(),
          });
          setStep("qr");
        }}
        onRestart={restartGeneration}
      />
    );
  } else if (step === "qr") {
    screen = (
      <div className="flex min-h-screen w-full items-center justify-center px-6 py-16 text-white sm:py-20 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Ваш QR код для скачивания фото</h2>
            <p className="text-lg text-white/90">Появится на экране. Пока можете начать заново.</p>
          </div>
          <button
            onClick={restartGeneration}
            className="rounded-xl bg-white px-10 py-4 text-lg font-bold text-black shadow-lg shadow-white/20 transition hover:bg-white/90 active:scale-95"
          >
            Сгенерировать еще
          </button>
        </div>
      </div>
    );
  }

  // Intro: render full-screen without chrome
  if (
    step === "intro" ||
    step === "rules" ||
    step === "gender" ||
    step === "location" ||
    step === "capture" ||
    step === "capture_done" ||
    step === "loading" ||
    step === "done" ||
    step === "qr"
  ) {
    return <main>{screen}</main>;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="flex w-full justify-center px-4 pt-4">
        <div className="flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">
              Virtual Trip
            </span>
            <span className="text-sm text-white">Тверская область</span>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      <main>{screen}</main>

      <footer className="mx-auto mb-6 flex w-full max-w-md items-center justify-between px-6 text-xs text-slate-400">
        <span>Шаг: {step}</span>
        <ActionButton
          variant="ghost"
          fullWidth={false}
          className="text-xs font-semibold"
          onClick={() => emitStep(step)}
        >
          Отправить в WS
        </ActionButton>
      </footer>
    </div>
  );
}
