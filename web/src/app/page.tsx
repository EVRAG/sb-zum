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
    id: "valday",
    title: "Валдай",
    subtitle: "Хвойные леса",
    color: "#60a5fa",
    image:
      "https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "tver",
    title: "Тверь",
    subtitle: "Исторический центр",
    color: "#f472b6",
    image:
      "https://images.unsplash.com/photo-1614926857083-7be149266cda?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "seliger",
    title: "Озеро Селигер",
    subtitle: "Водная гладь",
    color: "#38bdf8",
    image:
      "https://images.unsplash.com/photo-1614705827065-62c3dc488f40?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "torzhok",
    title: "Торжок",
    subtitle: "Златошвей",
    color: "#a855f7",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "kalyazin",
    title: "Калязин",
    subtitle: "Колокольня",
    color: "#22d3ee",
    image:
      "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "andreevskiy",
    title: "Андреевский",
    subtitle: "Усадьба",
    color: "#fbbf24",
    image:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "likhoslavl",
    title: "Лихославль",
    subtitle: "Ремёсла",
    color: "#34d399",
    image:
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=512&q=80",
  },
  {
    id: "rzev",
    title: "Ржев",
    subtitle: "Панорамы",
    color: "#fb7185",
    image:
      "https://images.unsplash.com/photo-1492724724894-7464c27d0ceb?auto=format&fit=crop&w=512&q=80",
  },
];

type StepPayload = {
  step: Step;
  gender: Gender | null;
  locationId: string | null;
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
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status, sendJson } = useWebSocket(WS_URL);

  const emitStep = (nextStep: Step) => {
    const payload: StepPayload = {
      step: nextStep,
      gender,
      locationId,
    };
    // User request: no meta/actions, just a step (plus timestamp)
    sendJson({ step: payload.step, ts: Date.now() });
  };

  // emit on every step change
  useEffect(() => {
    emitStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, gender, locationId]);

  const handleCapture = () => {
    if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    setIsCapturing(true);
    // re-emit capture when user actually presses the button
    emitStep("capture");

    captureTimerRef.current = setTimeout(() => {
      setIsCapturing(false);
      setStep("capture_done");
    }, 5000);
  };

  const handleLoading = () => {
    setStep("loading");
    setProgress(0);
    const duration = 15000;
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
    screen = <DoneScreen onRestart={resetFlow} />;
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
    step === "done"
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
