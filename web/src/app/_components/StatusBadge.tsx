"use client";

type Status = "connecting" | "open" | "closed";

const statusCopy: Record<Status, string> = {
  connecting: "Подключаемся...",
  open: "Онлайн",
  closed: "Оффлайн",
};

const statusColor: Record<Status, string> = {
  connecting: "bg-[#F2B077]",
  open: "bg-[#32A69A]",
  closed: "bg-[#F27272]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs text-white shadow-sm backdrop-blur">
      <span className={`h-2.5 w-2.5 rounded-full ${statusColor[status]}`} />
      {statusCopy[status]}
    </div>
  );
}

