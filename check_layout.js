const { execFile } = require("child_process");
const http = require("http");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9224",
  "--window-size=412,915",
  "http://localhost:5500/?to=Dato%27%20Sri%20Nazri%20%26%20Datin"
]);

setTimeout(async () => {
  try {
    const pages = await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:9224/json", (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });

    const page = pages.find(p => p.type === "page" && p.url.includes("5500"));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: `JSON.stringify({
            window: { w: window.innerWidth, h: window.innerHeight },
            portal: document.getElementById("floralPortal") ? document.getElementById("floralPortal").getBoundingClientRect() : null,
            portalComputed: document.getElementById("floralPortal") ? {
              display: getComputedStyle(document.getElementById("floralPortal")).display,
              justifyContent: getComputedStyle(document.getElementById("floralPortal")).justifyContent,
              alignItems: getComputedStyle(document.getElementById("floralPortal")).alignItems,
              padding: getComputedStyle(document.getElementById("floralPortal")).padding
            } : null,
            stage: document.getElementById("envelopeStage") ? document.getElementById("envelopeStage").getBoundingClientRect() : null,
            stageComputed: document.getElementById("envelopeStage") ? {
              marginTop: getComputedStyle(document.getElementById("envelopeStage")).marginTop,
              height: getComputedStyle(document.getElementById("envelopeStage")).height
            } : null,
            env: document.getElementById("royalEnvelope3D") ? document.getElementById("royalEnvelope3D").getBoundingClientRect() : null,
            steps: document.querySelector(".envelope-four-steps-bar") ? document.querySelector(".envelope-four-steps-bar").getBoundingClientRect() : null
          }, null, 2)`
        }
      }));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log("LAYOUT DEBUG RESULT:\n" + msg.result.result.value);
        ws.close();
        proc.kill();
        process.exit(0);
      }
    };
  } catch(e) {
    console.error(e);
    proc.kill();
    process.exit(1);
  }
}, 2500);
