const { execFile } = require("child_process");
const http = require("http");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const proc = execFile(edgePath, [
  "--headless=new",
  "--remote-debugging-port=9232",
  "--window-size=412,915",
  "http://localhost:5500/?to=Dato%27%20Sri%20Nazri%20%26%20Datin"
]);

setTimeout(async () => {
  try {
    const pages = await new Promise((res, rej) => {
      http.get("http://127.0.0.1:9232/json", r => {
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
          const pt = document.elementFromPoint(206, 910);
          const stage = document.getElementById("envelopeStage");
          const portal = document.getElementById("floralPortal");
          const allChildrenOfPortal = Array.from(portal.children).map(c => ({
            tag: c.tagName,
            id: c.id,
            className: c.className,
            rect: c.getBoundingClientRect(),
            style: {
              display: getComputedStyle(c).display,
              position: getComputedStyle(c).position,
              zIndex: getComputedStyle(c).zIndex,
              opacity: getComputedStyle(c).opacity,
              visibility: getComputedStyle(c).visibility
            }
          }));
          return JSON.stringify({
            ptAtBottom: pt ? { tag: pt.tagName, id: pt.id, className: pt.className } : null,
            portalRect: portal.getBoundingClientRect(),
            children: allChildrenOfPortal
          }, null, 2);
        })()`,
        returnByValue: true
      });
      console.log("PORTAL CHILDREN:\n", res.result.value);
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
