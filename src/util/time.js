const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

function dateKeyUtc(d = new Date()) {
  return dayjs(d).utc().format("YYYY-MM-DD");
}

function msToHours(ms) {
  return ms / 1000 / 60 / 60;
}

function formatHours(ms, digits = 2) {
  const h = msToHours(ms);
  return h.toFixed(digits);
}

function nextUtcMidnightMsFromNow(now = new Date()) {
  const n = dayjs(now).utc();
  const next = n.add(1, "day").startOf("day");
  return Math.max(0, next.valueOf() - n.valueOf());
}

module.exports = { dateKeyUtc, msToHours, formatHours, nextUtcMidnightMsFromNow };
