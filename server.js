const { execSync } = require("child_process");
const fs = require("fs");

async function getCurrentTime() {
  const response = await fetch("http://time.windows.com");
  return new Date(response.headers.get("date"));
}

async function setSystemTime(date) {
  const format = (value) => `0${value}`.slice(-2);
  const dateArray = [date.getDate(), date.getMonth() + 1, date.getFullYear()];
  const timeArray = [date.getHours(), date.getMinutes()];
  const dateString = dateArray.map((v, i) => (i === 2 ? v : format(v))).join("-");
  const timeString = timeArray.map(format).join(":");
  execSync(`date ${dateString} && time ${timeString}`, { windowsHide: true });
}

function parseTime(now, time) {
  const [hours, minutes] = time.split(":");
  const date = new Date(now);
  date.setHours(hours);
  date.setMinutes(minutes);
  return date;
}

function isTimeWithinInterval(now, interval) {
  const [start, end] = interval.map((time) => parseTime(now, time));
  if (start < end) {
    return start <= now && now <= end;
  } else {
    return start <= now || now <= end;
  }
}

function getRemainingTime(now, intervalEnd) {
  const deltaTime = (parseTime(now, intervalEnd) - now) / 1000;
  return deltaTime < 0 ? deltaTime + 86400 : deltaTime;
}

function scheduleShutdown(timeout) {
  execSync(`shutdown /s /t ${timeout}`, { windowsHide: true });
}

function connectToWirelessNetwork() {
  execSync(`netsh wlan connect "${settings.wirelessNetworkName}"`);
}

async function run() {
  try {
    const now = await getCurrentTime();
    setSystemTime(now);

    const allowedIntervals = settings.allowedIntervals[now.getDay()];
    for (const interval of allowedIntervals) {
      if (isTimeWithinInterval(now, interval)) {
        scheduleShutdown(getRemainingTime(now, interval[1]));
        return;
      }
    }
    scheduleShutdown(0);
  } catch (e) {
    if (e.message !== "fetch failed") {
      throw e;
    }
    connectToWirelessNetwork();
    setTimeout(run, settings.attemptInterval);
  }
}

const settingsFileName = "server-settings.json";
const settings = {
  allowedIntervals: Array(7).fill([["00:00", "23:59"]]),
  wirelessNetworkName: "",
  attemptInterval: 15000,
};

try {
  const file = fs.readFileSync(settingsFileName);
  Object.assign(settings, JSON.parse(file));
} catch {
  fs.writeFileSync(settingsFileName, JSON.stringify(settings));
}

run();
