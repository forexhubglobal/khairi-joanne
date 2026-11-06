const { execFile } = require("child_process");
const http = require("http");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9238",
  "--window-size=412,915",
  "http://localhost:5500/?to=Dato%27%20Sri%20Nazri%20%26%20Datin"
]);

setTimeout(async () => {
  try {
    const pages = await new Promise((res, rej) => {
      http.get("http://127.0.0.1:9238/json", r => {
        let d = "";
        r.on("data", c => d += c);
        r.on("end", () => res(JSON.parse(d)));
      }).on("error", rej);
    });
    const page = pages.find(p => p.type === "page" && p.url.includes("5500"));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = async () => {
      const send = (method, params = {}) => new Promise(r => {
        const id = Math.floor(Math.random() * 10000);
        const h = e => {
          const m = JSON.parse(e.data);
          if (m.id === id) { ws.removeEventListener("message", h); r(m.result); }
        };
        ws.addEventListener("message", h);
        ws.send(JSON.stringify({ id, method, params }));
      });

      const res = await send("Runtime.evaluate", {
        expression: `(() => {
          const points = [];
          for (let y = 800; y < 823; y += 2) {
            const el = document.elementFromPoint(246, y);
            points.push({ y, tag: el ? el.tagName : null, id: el ? el.id : null, cls: el ? el.className : null });
          }
          return JSON.stringify(points, null, 2);
        })()`,
        returnByValue: true
      });
      console.log("POINTS ALONG CENTER BOTTOM:\n", res.result.value);
      ws.close();
      proc.kill();
      process.exit(0);
    };
  } catch(e) {
    console.error(e);
    proc.kill();
    process.exit(1);
  }
}, 2500);
