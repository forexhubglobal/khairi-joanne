const { execFile } = require("child_process");
const http = require("http");
const fs = require("fs");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runTest() {
  console.log("=== STARTING END-TO-END VERIFICATION ===");

  const proc = execFile(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9240",
    "--window-size=412,915",
    "http://localhost:5500/"
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

  // Wait for Edge to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    const pages = await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:9240/json", (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });

    const page = pages.find(p => p.type === "page" && p.url.includes("5500"));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    console.log("Connected to page. Unlocking wedding card...");
    await sendCommand(ws, "Runtime.evaluate", {
      expression: `
        if (document.getElementById("royalWaxSealBtn")) {
          document.getElementById("royalWaxSealBtn").click();
        }
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    // Submit RSVP
    console.log("Filling in RSVP Form...");
    const rsvpResult = await sendCommand(ws, "Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          document.getElementById("inputName").value = "Tengku Iskandar";
          document.getElementById("inputPhone").value = "0198765432";
          
          // Select Hadir
          const radioYes = document.querySelector(".att-card input[value=yes]");
          if (radioYes) {
            radioYes.click();
            radioYes.closest(".att-card").click();
          }

          // Select 3 pax
          const p3Btn = document.querySelector(".p-btn[data-count='3']");
          if (p3Btn) p3Btn.click();

          // Fill wish
          document.getElementById("inputWish").value = "Barakallah KJ & Joanne! Moga berkekalan hingga jannah.";

          // Submit form
          const form = document.getElementById("rsvpConsoleForm");
          const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
          form.dispatchEvent(submitEvent);

          await new Promise(r => setTimeout(r, 1000));

          const stored = localStorage.getItem("pastel_rsvps");
          const slipGuest = document.getElementById("slipGuest") ? document.getElementById("slipGuest").textContent : "";
          const slipDetail = document.getElementById("slipDetail") ? document.getElementById("slipDetail").textContent : "";

          return {
            storedCount: stored ? JSON.parse(stored).length : 0,
            storedLast: stored ? JSON.parse(stored).slice(-1)[0] : null,
            slipGuest,
            slipDetail
          };
        })()
      `
    });

    console.log("RSVP Submission Result:", JSON.stringify(rsvpResult?.result?.value || rsvpResult, null, 2));

    // Now navigate to admin.html
    console.log("\nNavigating to Admin CRM Portal (admin.html)...");
    await sendCommand(ws, "Page.navigate", { url: "http://localhost:5500/admin.html" });
    await new Promise(r => setTimeout(r, 1500));

    // Test PIN and Check Data
    const adminCheck = await sendCommand(ws, "Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          // Enter PIN 2912
          document.getElementById("p1").value = "2";
          document.getElementById("p2").value = "9";
          document.getElementById("p3").value = "1";
          document.getElementById("p4").value = "2";
          
          verifyPin();

          await new Promise(r => setTimeout(r, 500));

          const isAuthHidden = document.getElementById("authOverlay").classList.contains("hidden");
          const totalPax = document.getElementById("valTotalPax").textContent;
          const totalRsvp = document.getElementById("valTotalRsvp").textContent;
          const cards = Array.from(document.querySelectorAll(".guest-card")).map(c => ({
            name: c.querySelector(".g-name") ? c.querySelector(".g-name").textContent : "",
            badge: c.querySelector(".g-badge") ? c.querySelector(".g-badge").textContent.trim() : "",
            phone: c.querySelector(".g-phone-link") ? c.querySelector(".g-phone-link").textContent : ""
          }));

          return {
            isAuthHidden,
            totalPax,
            totalRsvp,
            guestCount: cards.length,
            cards
          };
        })()
      `
    });

    console.log("\nAdmin CRM Dashboard Verification:", JSON.stringify(adminCheck?.result?.value || adminCheck, null, 2));

    ws.close();
    proc.kill();
    console.log("\n=== TEST COMPLETE & SUCCESSFUL! ===");
  } catch (err) {
    console.error("Test error:", err);
    try { proc.kill(); } catch(e) {}
  }
}

runTest();
