const { execSync } = require("child_process");
const { Server } = require("socket.io");
const fs = require("fs");
const dns = require("dns");
const os = require("os");
const path = require("path");
const io = new Server(3000, { cors: { origin: "*" } });

class App {
  constructor() {
    this.dataFile = "server_data.json";
    this.userFile = path.join(os.homedir(), "Desktop", "time_control.txt");
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
      const file = fs.readFileSync(this.dataFile);
      Object.assign(this, JSON.parse(file));
    } catch {
      this.saveData();
    }

    io.on("connection", (socket) => {
      socket.on("get", (callback) => {
        callback({ state: this.state, settings: this.settings });
      });
      socket.on("set_settings", (settings, callback) => {
        Object.assign(this.settings, settings);
        this.saveData();
        callback();
      });
      socket.on("set_bonus_time", (bonusTime) => {
        const [h, m] = bonusTime.split(":").map((v) => parseInt(v));
        this.state.bonusTime = (h * 3600 + m * 60) * 1000;
        this.saveData();
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
      this.saveData();
      this.run();
    }, this.settings.updateInterval);
  }

  async syncSystemTime() {
    const format = (number) => `0${number}`.slice(-2);
    const response = await fetch("http://time.windows.com");
    const date = new Date(response.headers.get("date"));
    const dateArray = [date.getDate(), date.getMonth() + 1, date.getFullYear()];
    const timeArray = [date.getHours(), date.getMinutes()];
    const dateString = dateArray.map((n, i) => (i === 2 ? n : format(n))).join("-");
    const timeString = timeArray.map((n) => format(n)).join(":");
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
    if (interval === null) return false;

    const [start, end] = interval.map((time) => {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return date;
    });

    if (start < end) {
      return start <= now && now <= end;
    } else {
      return start <= now || now <= end;
    }
  }

  isDailyLimitReached() {
    const now = new Date();
    const dailyLimit = this.settings.dailyLimit[now.getDay()];
    if (dailyLimit === null) return false;

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

  sendStateToClient() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("set_state", this.state);
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

  saveData() {
    // App data
    const state = { ...this.state };
    const settings = this.settings;
    delete state.locked;
    fs.writeFileSync(this.dataFile, JSON.stringify({ state, settings }));
    // User data
    const day = new Date().getDay();
    const userData = {
      downtime: this.settings.downtime[day] && this.settings.downtime[day].join(" - "),
      dailyLimit: this.parseDailyLimit(this.settings.dailyLimit[day]),
      uptime: this.parseMilliseconds(this.state.uptime),
      bonusTime: this.parseMilliseconds(this.state.bonusTime),
      lastUpdatedOn: this.state.lastUpdatedOn,
    };
    fs.writeFileSync(
      this.userFile,
      Object.entries(userData)
        .map(([key, value]) => key + ": " + value)
        .join("\n")
    );
  }

  parseDailyLimit(dl) {
    if (!dl) return;
    const [h, m] = dl.split(":").map((v) => parseInt(v));
    return `${h ? h + " hr" : ""} ${m ? m + " min" : h ? "" : "0 min"}`;
  }

  parseMilliseconds(ms) {
    const totalMinutes = ms / 60000;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${h ? h + " hr" : ""} ${m ? m + " min" : h ? "" : "0 min"}`.trim();
  }

  exec(cmd) {
    execSync(cmd, { windowsHide: true });
  }
}

const app = new App();
app.run();
