const { execFile } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = execFile(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9250',
  'https://khairi-joanne.vercel.app'
]);

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

setTimeout(async () => {
  try {
    const pages = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9250/json', (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const page = pages.find(p => p.type === 'page' && p.url.includes('khairi-joanne'));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    console.log('Unlocking on Vercel...');
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: 'if (document.getElementById("royalWaxSealBtn")) document.getElementById("royalWaxSealBtn").click();'
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Submitting RSVP...');
    const sub = await sendCommand(ws, 'Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          document.getElementById('inputName').value = 'Ujian Verifikasi Live';
          document.getElementById('inputPhone').value = '0129998888';
          const radioYes = document.querySelector('.att-card input[value=yes]');
          if (radioYes) {
            radioYes.click();
            radioYes.closest('.att-card').click();
          }
          const p2 = document.querySelector('.p-btn[data-count="2"]');
          if (p2) p2.click();
          document.getElementById('inputWish').value = 'Semoga berbahagia selalu!';
          
          const form = document.getElementById('rsvpConsoleForm');
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

          await new Promise(r => setTimeout(r, 2500));
          return {
            localRsvps: localStorage.getItem('pastel_rsvps'),
            userRsvp: localStorage.getItem('kj_joanne_pastel_rsvp')
          };
        })()
      `
    });
    console.log('Submit result on Vercel:', JSON.stringify(sub?.result?.value, null, 2));

    console.log('Navigating to /admin on Vercel...');
    await sendCommand(ws, 'Page.navigate', { url: 'https://khairi-joanne.vercel.app/admin' });
    await new Promise(r => setTimeout(r, 2500));

    const adminCheck = await sendCommand(ws, 'Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          document.getElementById('p1').value = '2';
          document.getElementById('p2').value = '9';
          document.getElementById('p3').value = '1';
          document.getElementById('p4').value = '2';
          verifyPin();
          await new Promise(r => setTimeout(r, 500));
          return {
            totalPax: document.getElementById('valTotalPax').textContent,
            totalRsvp: document.getElementById('valTotalRsvp').textContent,
            guestCount: document.querySelectorAll('.guest-card').length,
            rawLocal: localStorage.getItem('pastel_rsvps')
          };
        })()
      `
    });
    console.log('Admin check on Vercel:', JSON.stringify(adminCheck?.result?.value, null, 2));

    ws.close();
    proc.kill();
  } catch(e) {
    console.error(e);
    try { proc.kill(); } catch(err) {}
  }
}, 3000);
