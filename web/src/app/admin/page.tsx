"use client";

import { useEffect, useState } from "react";
import { getDefaultWsUrl, useWebSocket } from "../_hooks/useWebSocket";

export default function AdminPage() {
  const [showPrintButton, setShowPrintButton] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const WS_URL = getDefaultWsUrl();
  const { sendJson, status } = useWebSocket(WS_URL);
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { showPrintButton?: boolean };
        if (typeof data.showPrintButton === "boolean") {
          setShowPrintButton(data.showPrintButton);
          window.localStorage.setItem("showPrintButton", data.showPrintButton ? "true" : "false");
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const broadcast = (value: boolean) => {
    const payload = {
      type: "admin_print_toggle",
      showPrintButton: value,
      ts: Date.now(),
    };
    const ok = sendJson(payload);
    if (!ok) setPendingToggle(value);
  };

  // retry pending toggle once WS becomes open
  useEffect(() => {
    if (pendingToggle === null) return;
    if (status === "open") {
      broadcast(pendingToggle);
      setPendingToggle(null);
    }
  }, [pendingToggle, status]);

  const toggle = (value: boolean) => {
    setShowPrintButton(value);
    window.localStorage.setItem("showPrintButton", value ? "true" : "false");
    setIsSaving(true);
    setError(null);
    fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showPrintButton: value }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { showPrintButton?: boolean };
        if (typeof data.showPrintButton === "boolean") {
          setShowPrintButton(data.showPrintButton);
          window.localStorage.setItem("showPrintButton", data.showPrintButton ? "true" : "false");
          broadcast(data.showPrintButton);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Не удалось сохранить. Попробуйте ещё раз.");
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-xl">
        <h1 className="text-2xl font-bold">Админка</h1>
        <p className="text-sm text-white/70">
          Переключает, показывать ли кнопку печати на последнем шаге. Значение сохраняется в localStorage и подхватится
          на главном экране после обновления.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">Кнопка печати:</span>
          <button
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black shadow hover:bg-white/90 active:scale-95"
            onClick={() => toggle(true)}
            aria-pressed={showPrintButton}
            disabled={isSaving}
          >
            Включить
          </button>
          <button
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black shadow hover:bg-white/90 active:scale-95"
            onClick={() => toggle(false)}
            aria-pressed={!showPrintButton}
            disabled={isSaving}
          >
            Выключить
          </button>
        </div>
        {error && <div className="text-sm text-red-300">{error}</div>}
        {isSaving && <div className="text-sm text-white/70">Сохраняем...</div>}
        <div className="text-sm text-white/80">
          Текущее значение:{" "}
          <span className="font-bold">{showPrintButton ? "показывать «Получить QR код и распечатать»" : "показывать «Скачать по QR коду»"}</span>
        </div>
      </div>
    </main>
  );
}




