const { execFile } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotDir = "C:\\Users\\US\\.gemini\\antigravity\\scratch";

const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9235",
  "--window-size=412,915",
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
      http.get("http://127.0.0.1:9235/json", (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });

    const page = pages.find(p => p.type === "page" && p.url.includes("5500"));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    // 1. Initial settled state (Step 1)
    await new Promise(r => setTimeout(r, 1500));
    const shot1 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "final_step1.png"), Buffer.from(shot1.data, "base64"));
    console.log("Saved final_step1.png");

    // Click the seal button
    console.log("Clicking #royalWaxSealBtn...");
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `document.getElementById("royalWaxSealBtn").click();`
    });

    // 2. Step 2 (Envelope opens) at +550ms
    await new Promise(r => setTimeout(r, 550));
    const shot2 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "final_step2.png"), Buffer.from(shot2.data, "base64"));
    console.log("Saved final_step2.png");

    // 3. Step 3 (Card rising) at +800ms (1350ms total)
    await new Promise(r => setTimeout(r, 800));
    const shot3 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "final_step3.png"), Buffer.from(shot3.data, "base64"));
    console.log("Saved final_step3.png");

    // 4. Step 4 (Card fully elevated & RSVP ready) at +1000ms (2350ms total)
    await new Promise(r => setTimeout(r, 1000));
    const shot4 = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "final_step4.png"), Buffer.from(shot4.data, "base64"));
    console.log("Saved final_step4.png");

    // 5. Cinematic Storyline takes over at +2000ms (4350ms total)
    await new Promise(r => setTimeout(r, 2000));
    const shotCinema = await sendCommand(ws, "Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, "final_cinema.png"), Buffer.from(shotCinema.data, "base64"));
    console.log("Saved final_cinema.png");

    ws.close();
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    proc.kill();
    process.exit(1);
  }
}, 2500);
