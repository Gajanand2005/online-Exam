const MINUTE = 60 * 1000;

// "7 Oct 2026, 10:00 am" in the viewer's locale/time zone
export const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, { timeStyle: "short" });

// ISO date -> value for <input type="datetime-local"> in local time
export const toLocalInput = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * MINUTE).toISOString().slice(0, 16);
};

// Paper slot of a scheduled exam: starts at startAt, ends startAt + duration.
export const examSlot = (exam, now = Date.now()) => {
  if (!exam.startAt) return null;
  const start = new Date(exam.startAt).getTime();
  const end = start + exam.duration * MINUTE;
  return { start, end, state: now < start ? "upcoming" : now < end ? "live" : "ended" };
};

// 4500000 -> "1h 15m", 245000 -> "4m 05s", 9000 -> "0m 09s"
export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
};
