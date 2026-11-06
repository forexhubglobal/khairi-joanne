const { execFile } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotDir = "C:\\Users\\US\\.gemini\\antigravity\\scratch";

const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9241",
  "http://localhost:5500/?to=Dato%27%20Sri%20Nazri%20%26%20Datin"
]);

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

setTimeout(async () => {
  try {
    const pages = await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:9241/json", (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });

    const page = pages.find(p => p.type === "page" && p.url.includes("5500"));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // Emulate Mobile Device (390 x 844)
    await sendCommand(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click button
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `document.getElementById("royalWaxSealBtn").click();`
    });

    // Capture Step 3 (card sliding up) at 1400ms
    await new Promise(r => setTimeout(r, 1400));
    const shot3 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "mobile_fitted_step3.png"), Buffer.from(shot3.data, "base64"));
    console.log("Saved mobile_fitted_step3.png");

    // Capture Step 4 at 2300ms
    await new Promise(r => setTimeout(r, 900));
    const shot4 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "mobile_fitted_step4.png"), Buffer.from(shot4.data, "base64"));
    console.log("Saved mobile_fitted_step4.png");

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    proc.kill();
    process.exit(1);
  }
}, 2500);
