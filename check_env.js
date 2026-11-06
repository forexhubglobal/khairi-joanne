const { execFile } = require("child_process");
const http = require("http");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9230",
  "--window-size=412,915",
  "http://localhost:5500/?to=Dato%27%20Sri%20Nazri%20%26%20Datin"
]);

setTimeout(async () => {
  try {
    const pages = await new Promise((res, rej) => {
      http.get("http://127.0.0.1:9230/json", r => {
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
          const pt = document.elementFromPoint(200, 350);
          const env = document.getElementById("royalEnvelope3D");
          const flap = document.getElementById("envelopeTopFlap");
          const seal = document.getElementById("royalWaxSealBtn");
          const rEnv = env ? env.getBoundingClientRect() : {};
          const rFlap = flap ? flap.getBoundingClientRect() : {};
          const rSeal = seal ? seal.getBoundingClientRect() : {};
          return JSON.stringify({
            elementFromPoint: pt ? { tag: pt.tagName, id: pt.id, className: pt.className } : null,
            envRect: { x: rEnv.x, y: rEnv.y, w: rEnv.width, h: rEnv.height },
            flapRect: { x: rFlap.x, y: rFlap.y, w: rFlap.width, h: rFlap.height },
            sealRect: { x: rSeal.x, y: rSeal.y, w: rSeal.width, h: rSeal.height }
          }, null, 2);
        })()`,
        returnByValue: true
      });
      console.log("POINT CHECK:\n", res);
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
