const urls = [
  'https://khairi-joanne.vercel.app/',
  'https://khairi-joanne.vercel.app/admin',
  'https://khairi-joanne.vercel.app/jemputan',
  'https://khairi-joanne.vercel.app/config.js',
  'https://khairi-joanne.vercel.app/app.js',
  'https://khairi-joanne.vercel.app/style.css',
  'https://khairi-joanne.vercel.app/sw.js',
  'https://khairi-joanne.vercel.app/manifest.json',
  'https://khairi-joanne.vercel.app/audio/wedding_medley.mp3'
];

async function checkAll() {
  console.log('=== AUDIT STATUS LIVE VERCEL ===');
  let allPass = true;
  for (const u of urls) {
    const start = Date.now();
    try {
      const res = await fetch(u, { method: 'GET' });
      const duration = Date.now() - start;
      const pass = res.status === 200;
      if (!pass) allPass = false;
      console.log((pass ? '✅' : '❌') + ' [' + res.status + '] ' + u + ' (' + duration + 'ms)');
    } catch (e) {
      allPass = false;
      console.error('❌ Error fetching ' + u + ' : ' + e.message);
    }
  }
  console.log('=================================');
  console.log('KESELURUHAN: ' + (allPass ? 'SEMUA SISTEM 100% ONLINE & STABIL' : 'ADA RALAT'));
}
checkAll();
