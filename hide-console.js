require("create-nodew-exe")({
  src: "main.exe",
  dst: "server.exe",
});

require("fs").unlinkSync("main.exe");
