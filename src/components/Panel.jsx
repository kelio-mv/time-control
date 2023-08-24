import React from "react";
import Fieldset from "./Fieldset";
import Input from "./Input";
import Modal from "./Modal";
import TimeInput from "./TimeInput";
import "./Panel.scss";

class Panel extends React.Component {
  state = {
    state: {
      locked: null,
      uptime: null,
      bonusTime: null,
    },
    settings: {
      downtime: [null, null, null, null, null, null, null],
      dailyLimit: [null, null, null, null, null, null, null],
      wirelessNetworkName: "",
      updateInterval: "",
      lockInterval: "",
    },
    displayModal: null,
    selectedDay: null,
    downtime: ["", ""],
    dailyLimit: "",
    bonusTime: "",
  };
  savedSettings = JSON.stringify(this.state.settings);

  componentDidMount() {
    socket.emit("get", (data) => {
      this.savedSettings = JSON.stringify(data.settings);
      this.setState(data);
    });
    socket.on("set-state", (state) => this.setState({ state }));
  }

  componentDidUpdate(_, prevState) {
    const { settings } = this.state;

    if (settings !== prevState.settings && JSON.stringify(settings) !== this.savedSettings) {
      clearTimeout(this.saveSettingsTimer);
      this.savedSettings = null;

      this.saveSettingsTimer = setTimeout(() => {
        socket.emit("set_settings", settings, () => {
          this.savedSettings = JSON.stringify(settings);
          this.forceUpdate();
        });
      }, 1000);
    }
  }

  parseDailyLimit(dl) {
    const [h, m] = dl.split(":").map((v) => parseInt(v));
    return `${h ? h + " hr" : ""} ${m ? m + " min" : h ? "" : "0 min"}`;
  }

  parseMilliseconds(ms) {
    const totalMinutes = ms / 60000;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${h ? h + " hr" : ""} ${m ? m + " min" : h ? "" : "0 min"}`;
  }

  parseInt(str) {
    return parseInt("0" + str.replace(/\D/g, ""));
  }

  setSettings(settings) {
    this.setState({ settings: { ...this.state.settings, ...settings } });
  }

  closeModal() {
    // This function will also update the settings state when called from
    // the buttons "Done" and "Apply for all".
    this.setState({
      settings: { ...this.state.settings },
      displayModal: null,
      selectedDay: null,
      downtime: ["", ""],
      dailyLimit: "",
      bonusTime: "",
    });
  }

  render() {
    const { state, settings, displayModal, selectedDay } = this.state;
    const { downtime, dailyLimit, bonusTime } = this.state;
    const isSettingsSaved = JSON.stringify(settings) === this.savedSettings;
    const isDowntimeValid = [0, 10].includes(downtime.join("").length);
    const isDailyLimitValid = [0, 5].includes(dailyLimit.length);
    const isBonusTimeValid = bonusTime.length === 5 && bonusTime !== "00:00";

    return (
      <div className="panel">
        {/* Status */}
        <Fieldset legend="Status" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
          <div className="panel__status">
            <div>
              <div className="panel__status-icon-bg">
                <img
                  src={state.locked ? "lock.png" : "unlock.png"}
                  className="panel__status-icon"
                />
              </div>
              <p>{state.locked ? "Locked" : "Unlocked"}</p>
            </div>

            <div>
              <div className="panel__status-icon-bg">
                <img src="uptime.png" className="panel__status-icon" />
              </div>
              <p>{this.parseMilliseconds(state.uptime)}</p>
            </div>

            <div>
              <div className="panel__status-icon-bg">
                <img src="time.png" className="panel__status-icon" />
              </div>
              {state.bonusTime > 0 ? (
                <button
                  className="panel__status-btn"
                  onClick={() => {
                    socket.emit("set_bonusTime", "00:00");
                  }}
                >
                  {this.parseMilliseconds(state.bonusTime)} &#x2715;
                </button>
              ) : (
                <button
                  className="panel__status-btn"
                  onClick={() => {
                    this.setState({
                      displayModal: "bonusTime",
                    });
                  }}
                >
                  + Bonus time
                </button>
              )}
            </div>

            <div>
              <div className="panel__status-icon-bg">
                <img
                  src={isSettingsSaved ? "updated.png" : "update.png"}
                  className="panel__status-icon"
                  style={isSettingsSaved ? {} : { animation: "spin 1s linear infinite" }}
                />
              </div>
              <p>{isSettingsSaved ? "All changes saved" : "Saving changes..."}</p>
            </div>
          </div>
        </Fieldset>

        <div style={{ display: "flex", gap: "1.5rem" }}>
          {/* Downtime */}
          <Fieldset legend="Downtime" style={{ padding: "0.5rem 0" }}>
            {settings.downtime.map((dt, i) => (
              <div
                key={i}
                className="panel__section-item"
                onClick={() => {
                  this.setState({
                    displayModal: "downtime",
                    selectedDay: i,
                    downtime: settings.downtime[i] ? settings.downtime[i] : ["", ""],
                  });
                }}
              >
                <p className="panel__day-of-week">{daysOfWeek[i]}</p>
                <p>{dt === null ? "No downtime" : dt.join(" - ")}</p>
              </div>
            ))}
          </Fieldset>

          {/* Daily Limit */}
          <Fieldset legend="Daily limit" style={{ padding: "0.5rem 0" }}>
            {settings.dailyLimit.map((dl, i) => (
              <div
                key={i}
                className="panel__section-item"
                onClick={() => {
                  this.setState({
                    displayModal: "dailyLimit",
                    selectedDay: i,
                    dailyLimit: settings.dailyLimit[i] ? settings.dailyLimit[i] : "",
                  });
                }}
              >
                <p className="panel__day-of-week">{daysOfWeek[i].slice(0, 3)}</p>
                <p>{dl === null ? "No limit" : this.parseDailyLimit(dl)}</p>
              </div>
            ))}
          </Fieldset>

          {/* Other */}
          <Fieldset legend="Other" style={{ padding: "1rem" }}>
            <div className="panel__other-label">
              <img src="wifi.png" className="panel__other-icon" />
              <span>Wireless Network Name</span>
            </div>
            <Input
              className="panel__other-input input-text"
              value={settings.wirelessNetworkName}
              onChange={(v) => this.setSettings({ wirelessNetworkName: v })}
            />
            <div className="panel__other-label">
              <img src="update.png" className="panel__other-icon" />
              <span>Update Interval</span>
            </div>
            <Input
              className="panel__other-input input-text"
              value={settings.updateInterval}
              onChange={(v) => this.setSettings({ updateInterval: this.parseInt(v) })}
            />
            <div className="panel__other-label">
              <img src="lock.png" className="panel__other-icon" />
              <span>Lock Interval</span>
            </div>
            <Input
              className="panel__other-input input-text"
              value={settings.lockInterval}
              onChange={(v) => this.setSettings({ lockInterval: this.parseInt(v) })}
            />
          </Fieldset>
        </div>

        {/* Downtime Modal */}
        <Modal
          header={`Downtime • ${daysOfWeek[selectedDay]}`}
          footer={
            <>
              <button
                className="btn"
                onClick={() => {
                  const isEmpty = downtime.join("").length === 0;
                  settings.downtime = Array(7).fill(isEmpty ? null : downtime);
                  this.closeModal();
                }}
                disabled={!isDowntimeValid}
              >
                Apply to all
              </button>
              <button
                className="btn"
                onClick={() => {
                  const isEmpty = downtime.join("").length === 0;
                  settings.downtime[selectedDay] = isEmpty ? null : downtime;
                  this.closeModal();
                }}
                disabled={!isDowntimeValid}
              >
                Done
              </button>
            </>
          }
          open={displayModal === "downtime"}
          close={() => this.closeModal()}
        >
          <TimeInput
            value={downtime[0]}
            onChange={(v) => this.setState({ downtime: [v, downtime[1]] })}
          />
          <span className="panel__time-input-separator">⇄</span>
          <TimeInput
            value={downtime[1]}
            onChange={(v) => this.setState({ downtime: [downtime[0], v] })}
          />
        </Modal>

        {/* Daily limit Modal */}
        <Modal
          header={`Daily limit • ${daysOfWeek[selectedDay]}`}
          footer={
            <>
              <button
                className="btn"
                onClick={() => {
                  settings.dailyLimit = Array(7).fill(dailyLimit ? dailyLimit : null);
                  this.closeModal();
                }}
                disabled={!isDailyLimitValid}
              >
                Apply to all
              </button>
              <button
                className="btn"
                onClick={() => {
                  settings.dailyLimit[selectedDay] = dailyLimit ? dailyLimit : null;
                  this.closeModal();
                }}
                disabled={!isDailyLimitValid}
              >
                Done
              </button>
            </>
          }
          open={displayModal === "dailyLimit"}
          close={() => this.closeModal()}
        >
          <TimeInput
            value={dailyLimit}
            onChange={(v) => this.setState({ dailyLimit: v })}
            hideSeparator
          />
        </Modal>

        {/* Bonus time Modal */}
        <Modal
          header="Bonus time"
          footer={
            <button
              className="btn"
              onClick={() => {
                socket.emit("set_bonusTime", bonusTime);
                this.closeModal();
              }}
              disabled={!isBonusTimeValid}
            >
              Done
            </button>
          }
          open={displayModal === "bonusTime"}
          close={() => this.closeModal()}
        >
          <TimeInput
            value={bonusTime}
            onChange={(v) => this.setState({ bonusTime: v })}
            hideSeparator
          />
        </Modal>
      </div>
    );
  }
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default Panel;
