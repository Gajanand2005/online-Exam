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
