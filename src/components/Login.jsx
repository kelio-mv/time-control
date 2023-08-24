import { useState } from "react";
import Input from "./Input";
import "./Login.scss";

function Login(props) {
  const [address, setAddress] = useState("");

  return (
    <div className="login">
      <header className="login__header">
        <img src="app-logo.ico" className="login__app-logo" />
        <h1 className="login__app-name">Time Control</h1>
      </header>
      <div className="login__body">
        <Input
          className="input-text input-text--lg"
          style={{ width: "16rem" }}
          placeholder="IP Address..."
          value={address}
          onChange={setAddress}
        />
        <button
          className="btn"
          onClick={() => props.connect(address)}
          disabled={props.connStatus === "connecting"}
        >
          Connect
        </button>
        <div className="login__conn-status">
          {props.connStatus === "connecting" && (
            <>
              <div className="login__loader" />
              <span style={{ color: "var(--clr-500)" }}>Connecting...</span>
            </>
          )}
          {props.connStatus === "error" && (
            <>
              <img src="error.png" alt="" style={{ width: "1rem" }} />
              <span style={{ color: "#f64950" }}>Connection error</span>
            </>
          )}
          {props.connStatus === "lost" && (
            <>
              <img src="error.png" alt="" style={{ width: "1rem" }} />
              <span style={{ color: "#f64950" }}>Connection lost</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
