import { useState } from "react";
import Login from "./components/Login";
import Panel from "./components/Panel";

function App() {
  const [display, setDisplay] = useState("Login");
  const [connStatus, setConnStatus] = useState(null);

  function connect(addr) {
    setConnStatus("connecting");
    window.socket = io(`ws://${addr}:3000`);

    socket.on("connect", () => {
      setConnStatus(null);
      setDisplay("Panel");
    });
    socket.on("connect_error", () => {
      socket.close();
      setConnStatus("error");
    });
    socket.on("disconnect", () => {
      socket.close();
      setConnStatus("lost");
      setDisplay("Login");
    });
  }

  switch (display) {
    case "Login":
      return <Login {...{ connStatus, connect }} />;

    case "Panel":
      return <Panel />;
  }
}

export default App;
