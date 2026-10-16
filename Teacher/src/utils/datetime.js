const MINUTE = 60 * 1000;

export const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { timeStyle: "short" });

export const toLocalInput = (value) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * MINUTE)
    .toISOString()
    .slice(0, 16);
};

export const examSlot = (exam, now = Date.now()) => {
  if (!exam.startAt) return null;
  const start = new Date(exam.startAt).getTime();
  const end = start + exam.duration * MINUTE;
  return { start, end, state: now < start ? "upcoming" : now < end ? "live" : "ended" };
};