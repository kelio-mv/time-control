import { useEffect, useRef } from "react";
import "./TimeInput.scss";

function TimeInput(props) {
  const [hours, minutes] = props.value ? props.value.split(":") : ["", ""];
  const hoursRef = useRef();
  const minutesRef = useRef();
  const setHours = (h) => props.onChange((h || minutes) && h + ":" + minutes);
  const setMinutes = (m) => props.onChange((hours || m) && hours + ":" + m);
  const parseValue = (v) => v.replace(/\D/g, "");

  function onHoursChange(e) {
    const value = parseValue(e.target.value);

    switch (value.length) {
      case 0:
        setHours("");
        break;

      case 1:
        if (parseInt(value) <= 2) {
          setHours(value);
        } else {
          setHours("0" + value);
          minutesRef.current.focus();
        }
        break;

      case 2:
        if (
          ["0", "1"].includes(value[0]) ||
          (value[0] === "2" && ["0", "1", "2", "3"].includes(value[1]))
        ) {
          setHours(value);
          minutesRef.current.focus();
        }
        break;
    }
  }

  function onMinutesChange(e) {
    const value = parseValue(e.target.value);

    switch (value.length) {
      case 0:
        setMinutes("");
        break;

      case 1:
        const fill = ["6", "7", "8", "9"].includes(value[0]);
        setMinutes(fill ? "0" + value : value);
        break;

      case 2:
        setMinutes(value);
        break;
    }
  }

  return (
    <div className="time-input">
      <input
        ref={hoursRef}
        className="time-input__input"
        placeholder="hh"
        value={hours}
        onChange={onHoursChange}
        onBlur={(e) => {
          if (["0", "1", "2"].includes(e.target.value)) {
            setHours("0" + hours);
          }
        }}
      />
      <span
        className="time-input__separator"
        style={props.hideSeparator ? { visibility: "hidden" } : {}}
      >
        :
      </span>
      <input
        ref={minutesRef}
        className="time-input__input"
        placeholder="mm"
        value={minutes}
        onChange={onMinutesChange}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && minutes === "") {
            hoursRef.current.focus();
          }
        }}
        onBlur={(e) => {
          if (["0", "1", "2", "3", "4", "5"].includes(e.target.value)) {
            setMinutes("0" + minutes);
          }
        }}
      />
    </div>
  );
}

export default TimeInput;
