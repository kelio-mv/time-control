const { execSync } = require("child_process");
const { Server } = require("socket.io");
const fs = require("fs");
const dns = require("dns");
const io = new Server(3000, { cors: { origin: "*" } });

class App {
  constructor() {
    this.appDataFile = "server_data.json";
    this.settings = {
      downtime: [null, null, null, null, null, null, null],
      dailyLimit: [null, null, null, null, null, null, null],
      wirelessNetworkName: "",
      updateInterval: 60000,
      lockInterval: 2000,
    };
    this.state = {
      locked: false,
      uptime: 0,
      bonusTime: 0,
      lastUpdatedOn: new Date().toDateString(),
    };

    try {
      const file = fs.readFileSync(this.appDataFile);
      Object.assign(this, JSON.parse(file));
    } catch {
      this.saveAppData();
    }

    io.on("connection", (socket) => {
      socket.on("get", (callback) => {
        callback({ state: this.state, settings: this.settings });
      });
      socket.on("set_settings", (settings, callback) => {
        Object.assign(this.settings, settings);
        this.saveAppData();
        callback();
      });
      socket.on("set_bonusTime", (bonusTime) => {
        const [h, m] = bonusTime.split(":").map((v) => parseInt(v));
        this.state.bonusTime = (h * 3600 + m * 60) * 1000;
        this.saveAppData();
        this.sendStateToClient();
      });
      this.socket = socket;
    });
  }

  async run() {
    try {
      await this.syncSystemTime();
    } catch {
      this.checkConnection();
    }

    const lock = (this.isDowntime() || this.isDailyLimitReached()) && this.state.bonusTime === 0;
    this.setLocked(lock);
    this.sendStateToClient();

    setTimeout(() => {
      this.updateState();
      this.saveAppData();
      this.run();
    }, this.settings.updateInterval);
  }

  async syncSystemTime() {
    const response = await fetch("http://time.windows.com");
    const date = new Date(response.headers.get("date"));
    const [dateString, timeString] = this.parseDateObject(date);

    this.exec(`date ${dateString} && time ${timeString}`);
  }

  checkConnection() {
    dns.resolve("www.google.com", (err) => {
      if (err) {
        this.exec(`netsh wlan connect "${this.settings.wirelessNetworkName}"`);
      }
    });
  }

  isDowntime() {
    const now = new Date();
    const interval = this.settings.downtime[now.getDay()];
    if (interval === null) {
      return false;
    }
    const [start, end] = this.parseInterval(interval);

    if (start < end) {
      return start <= now && now <= end;
    } else {
      return start <= now || now <= end;
    }
  }

  isDailyLimitReached() {
    const now = new Date();
    const dailyLimit = this.settings.dailyLimit[now.getDay()];
    if (dailyLimit === null) {
      return false;
    }
    const [h, m] = dailyLimit.split(":").map((v) => parseInt(v));
    return this.state.uptime >= (h * 3600 + m * 60) * 1000;
  }

  setLocked(state) {
    if (this.state.locked === state) {
      return;
    }
    if (state) {
      const callback = () => this.exec("rundll32.exe user32.dll,LockWorkStation");
      this.lockTimer = setInterval(callback, this.settings.lockInterval);
      this.state.locked = true;
    } else {
      clearInterval(this.lockTimer);
      this.state.locked = false;
    }
  }

  updateState() {
    const date = new Date().toDateString();
    const useBonusTime = this.isDowntime() || this.isDailyLimitReached();

    if (date === this.state.lastUpdatedOn) {
      if (!this.state.locked) {
        this.state.uptime += this.settings.updateInterval;

        if (useBonusTime) {
          this.state.bonusTime -= this.settings.updateInterval;

          if (this.state.bonusTime < 0) {
            this.state.bonusTime = 0;
          }
        }
      }
    } else {
      this.state.uptime = 0;
      this.state.bonusTime = 0;
      this.state.lastUpdatedOn = date;
    }
  }

  saveAppData() {
    const state = { ...this.state };
    const settings = this.settings;
    delete state.locked;
    fs.writeFileSync(this.appDataFile, JSON.stringify({ state, settings }));
  }

  sendStateToClient() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("set-state", this.state);
    }
  }

  parseDateObject(date) {
    const format = (number) => `0${number}`.slice(-2);
    const dateArray = [date.getDate(), date.getMonth() + 1, date.getFullYear()];
    const timeArray = [date.getHours(), date.getMinutes()];
    const dateString = dateArray.map((n, i) => (i === 2 ? n : format(n))).join("-");
    const timeString = timeArray.map((n) => format(n)).join(":");

    return [dateString, timeString];
  }

  exec(cmd) {
    execSync(cmd, { windowsHide: true });
  }

  parseInterval(interval) {
    return interval.map((time) => {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return date;
    });
  }
}

const app = new App();
app.run();
