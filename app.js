/* ==========================================================================
   MAHLIGAI KASIH · CONTROLLER & GUGURAN KELOPAK BUNGA (APP.JS)
   TENGKU AHMAD KHAIRI (KJ) & JOANNE HANNAH QALIEYSHA
   ========================================================================== */

(() => {
  "use strict";

  const C = window.WEDDING_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* --------------------------------------------------------------------------
     1. PERSONALISED GUEST URL HANDLER (?to=...)
     -------------------------------------------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
  const rawParam = params.get("vip") || params.get("to") || params.get("nama") || params.get("tetamu") || hashParams.get("vip") || hashParams.get("to") || hashParams.get("nama") || "";
  const rawGuest = decodeURIComponent(rawParam.replace(/\+/g, " ")).trim().slice(0, 100);
  const guestName = rawGuest || "Tetamu Terhormat Kami";

  if ($("#portalGuestName")) $("#portalGuestName").textContent = guestName;
  if ($("#mainGuestName")) $("#mainGuestName").textContent = guestName;
  if ($("#envFrontGuestName")) $("#envFrontGuestName").textContent = guestName;
  if ($("#cineGuestHeroName")) $("#cineGuestHeroName").textContent = guestName;
  if ($("#inputName")) $("#inputName").value = rawGuest;
  if (rawGuest) {
    document.title = `Jemputan Mahligai Kasih · ${rawGuest} · Tengku Khairi & Joanne`;
  }

  /* --------------------------------------------------------------------------
     2. SUPABASE INITIALIZATION / FALLBACK
     -------------------------------------------------------------------------- */
  const hasDb = Boolean(C.supabaseUrl && C.supabaseAnonKey && window.supabase);
  const db = hasDb ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;

  /* --------------------------------------------------------------------------
     3. GUGURAN KELOPAK BUNGA PASTEL (PETAL PHYSICS CANVAS - 60/120FPS)
     -------------------------------------------------------------------------- */
  const canvas = $("#petalCanvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;
  const petals = [];
  const MAX_PETALS = 32; // Lean & ultra smooth 60fps

  // Warna-warna kelopak dan bunga sakura pastel lembut
  const sakuraColors = [
    { fill: "#FFB7C5", stroke: "#FFA6B6", center: "#FF758F" }, // Classic Sakura Pink
    { fill: "#FFC2CD", stroke: "#FFB0BD", center: "#FF859D" }, // Soft Blush Sakura
    { fill: "#FFE4E8", stroke: "#FFD3D9", center: "#FFA5B5" }, // Pale White-Pink Sakura
    { fill: "#FFF0F2", stroke: "#FFE0E5", center: "#FFB7C5" }  // Misty Pearl Petal
  ];

  function initPetals() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    petals.length = 0;
    for (let i = 0; i < MAX_PETALS; i++) {
      petals.push(createPetal(true));
    }
  }

  function createPetal(randomY) {
    const col = sakuraColors[Math.floor(Math.random() * sakuraColors.length)];
    const isWholeFlower = Math.random() < 0.22; // 22% peluang kuntum bunga sakura penuh
    return {
      x: Math.random() * (W + 100) - 50,
      y: randomY ? Math.random() * H : -25,
      size: isWholeFlower ? Math.random() * 8 + 14 : Math.random() * 7 + 9,
      isWholeFlower: isWholeFlower,
      speedY: Math.random() * 0.7 + 0.5,
      speedX: Math.random() * 0.4 + 0.2, // Tiupan angin ke kanan perlahan
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.012,
      swayWidth: Math.random() * 1.8 + 1.0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.025,
      flip: Math.random() * Math.PI,
      flipSpeed: Math.random() * 0.03 + 0.012,
      color: col
    };
  }

  function drawSakuraFlower(p) {
    // Lukis 5 kelopak bunga sakura mekar
    const r = p.size / 2;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.6, -r * 0.7, -r * 0.5, -r * 1.2, -r * 0.15, -r * 1.35);
      // Lekuk takik bunga sakura (sakura petal cleft)
      ctx.lineTo(0, -r * 1.15);
      ctx.lineTo(r * 0.15, -r * 1.35);
      ctx.bezierCurveTo(r * 0.5, -r * 1.2, r * 0.6, -r * 0.7, 0, 0);

      ctx.fillStyle = p.color.fill;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.strokeStyle = p.color.stroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
    // Pusat bunga (pistil / stamen)
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = p.color.center;
    ctx.fill();
  }

  function drawSakuraPetal(p) {
    // Lukis kelopak sakura tunggal dengan lekuk notch di hujung
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.6, -s * 0.5, -s * 1.2, -s * 0.15, -s * 1.4);
    ctx.lineTo(0, -s * 1.25); // Notched cleft
    ctx.lineTo(s * 0.15, -s * 1.4);
    ctx.bezierCurveTo(s * 0.5, -s * 1.2, s * 0.6, -s * 0.6, 0, 0);

    ctx.fillStyle = p.color.fill;
    ctx.globalAlpha = 0.82;
    ctx.fill();
    ctx.strokeStyle = p.color.stroke;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function burstPetals(originX, originY, count = 28) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 4.8 + 2.2;
      const col = sakuraColors[Math.floor(Math.random() * sakuraColors.length)];
      const isWholeFlower = Math.random() < 0.28;
      petals.push({
        x: originX,
        y: originY,
        size: isWholeFlower ? Math.random() * 8 + 14 : Math.random() * 7 + 9,
        isWholeFlower: isWholeFlower,
        speedY: Math.sin(angle) * speed * 0.8 + 0.3,
        speedX: Math.cos(angle) * speed,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.015,
        swayWidth: Math.random() * 2.2 + 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.04 + 0.02,
        color: col,
        isBurst: true
      });
    }
  }

  function renderPetals() {
    ctx.clearRect(0, 0, W, H);

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.y += p.speedY;
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * p.swayWidth + p.speedX;
      p.rotation += p.rotSpeed;
      p.flip += p.flipSpeed;

      // Burst petals that leave screen get removed gracefully
      if (p.isBurst && (p.y > H + 40 || p.x > W + 80 || p.x < -80)) {
        petals.splice(i, 1);
        continue;
      }

      if (p.y > H + 30 || p.x > W + 60) {
        Object.assign(p, createPetal(false));
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.flip)); // 3D flip

      if (p.isWholeFlower) {
        drawSakuraFlower(p);
      } else {
        drawSakuraPetal(p);
      }

      ctx.restore();
    }

    requestAnimationFrame(renderPetals);
  }

  window.addEventListener("resize", initPetals, { passive: true });
  initPetals();
  renderPetals();

  /* --------------------------------------------------------------------------
     4. ALUNAN MUZIK INSTRUMENTAL: WEDDING MEDLEY BY MILD NAWIN
     -------------------------------------------------------------------------- */
  const audioSuite = (() => {
    let bgAudio = $("#bgMusicTrack");
    if (!bgAudio) {
      bgAudio = new Audio("audio/wedding_medley.mp3");
      bgAudio.loop = true;
      bgAudio.preload = "auto";
    }
    bgAudio.volume = 0.85;

    let isPlaying = false;
    let chimeCtx = null;

    function getChimeCtx() {
      if (!chimeCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) chimeCtx = new AudioCtx();
      }
      return chimeCtx;
    }

    bgAudio.addEventListener("play", () => {
      isPlaying = true;
      updateUi();
    });
    bgAudio.addEventListener("pause", () => {
      isPlaying = false;
      updateUi();
    });
    bgAudio.addEventListener("ended", () => {
      isPlaying = false;
      updateUi();
    });

    return {
      play() {
        const p = bgAudio.play();
        if (p !== undefined) {
          p.then(() => {
            isPlaying = true;
            updateUi();
          }).catch((err) => {
            console.log("Audio autoplay waiting for user interaction:", err);
          });
        }
      },
      pause() {
        bgAudio.pause();
        isPlaying = false;
        updateUi();
      },
      toggle() {
        if (bgAudio.paused) {
          this.play();
        } else {
          this.pause();
        }
      },
      playChime() {
        try {
          const actx = getChimeCtx();
          if (!actx) return;
          if (actx.state === "suspended") actx.resume();
          const now = actx.currentTime;
          const notes = [72, 76, 79, 84]; // C6, E6, G6, C7
          const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
          notes.forEach((midi, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(midiToFreq(midi), now + idx * 0.08);
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 1.3);
          });
        } catch (e) {}
      },
      isActive() {
        return !bgAudio.paused;
      }
    };
  })();

  function updateUi() {
    const bars = $("#eqVisualizer");
    const label = $("#eqText");
    const active = audioSuite.isActive();
    if (bars) bars.classList.toggle("active", active);
    if (label) label.textContent = active ? "Alunan Kasih" : "Muzik Dihenti";
  }

  const audioToggleBtn = $("#audioToggleBtn");
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", () => audioSuite.toggle());
  }

  /* --------------------------------------------------------------------------
     5. 3D ENVELOPE CEREMONY & CINEMATIC STORYLINE THEATRE
     -------------------------------------------------------------------------- */
  const unlockBtn = $("#unlockExperienceBtn");
  const waxSealBtn = $("#royalWaxSealBtn");
  const proceedBtn = $("#btnProceedInside");
  const btnLaunchCinemaFront = $("#btnLaunchCinemaFront");
  const portal = $("#floralPortal");
  const envelope3D = $("#royalEnvelope3D");
  const stage3D = $("#envelopeStage");

  // Cinematic Theatre Elements
  const theatre = $("#cinematicTheatre");
  const cineScenes = $$(".cine-scene");
  const reelBars = [$("#cineReel0"), $("#cineReel1"), $("#cineReel2"), $("#cineReel3")];
  const cineCurrentBabakTxt = $("#cineCurrentBabakTxt");
  const cinePrevBtn = $("#cinePrevBtn");
  const cineNextBtn = $("#cineNextBtn");
  const cineSkipBtn = $("#cineSkipBtn");
  const btnCineEnterGrand = $("#btnCineEnterGrand");
  const btnFloatingCinema = $("#btnFloatingCinema");
  const btnFooterReplayCinema = $("#btnFooterReplayCinema");
  const cineTapLeft = $("#cineTapLeft");
  const cineTapRight = $("#cineTapRight");

  const babakTitles = ["BABAK I", "BABAK II", "BABAK III", "BABAK IV"];
  const cineVideos = [
    $("#cineVid0"),
    $("#cineVid1"),
    $("#cineVid2"),
    $("#cineVid3")
  ];

  const SCENE_DURATION = 7500; // 7.5 saat per babak
  let currentSceneIdx = 0;
  let sceneTimer = null;
  let sceneProgressInterval = null;
  let sceneStartTime = 0;
  let isStorylineActive = false;
  let envelopeOpened = false;

  // Mobile Device & Low-Bandwidth Detection
  const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function initVideoSrc(vid) {
    if (!vid) return;
    if (vid.dataset.loaded === "true") return;
    const mobSrc = vid.getAttribute("data-mob");
    const deskSrc = vid.getAttribute("data-src");
    const target = isMobile ? (mobSrc || deskSrc) : (deskSrc || mobSrc);
    if (target) {
      vid.src = target;
      vid.dataset.loaded = "true";
      vid.load();
    }
  }

  // Pre-load all 4 background videos early for seamless playback
  cineVideos.forEach(v => {
    if (v) initVideoSrc(v);
  });

  // Mobile Autoplay Policy Primer (Synchronously unlocks ALL 4 video elements within user gesture)
  function primeMobileVideos() {
    cineVideos.forEach((vid, i) => {
      if (!vid) return;
      initVideoSrc(vid);
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("webkit-playsinline", "true");
      vid.setAttribute("x5-playsinline", "true");

      const p = vid.play();
      if (p !== undefined) {
        p.then(() => {
          if (i !== 0) {
            vid.pause();
            vid.currentTime = 0;
          }
        }).catch(() => {});
      }
    });
  }

  // Seamless Multi-Track Crossfade Switcher (Mobile High Performance & Zero-Stutter)
  function switchCineVideo(idx) {
    const targetVid = cineVideos[idx];
    if (!targetVid) return;

    targetVid.muted = true;
    targetVid.defaultMuted = true;
    targetVid.playsInline = true;

    // Reset video time to ensure smooth forward playback
    if (targetVid.currentTime > 9.5) {
      targetVid.currentTime = 0;
    }

    const p = targetVid.play();
    if (p !== undefined) {
      p.then(() => {
        targetVid.classList.add("active");
        cineVideos.forEach((vid, i) => {
          if (i !== idx && vid) {
            vid.classList.remove("active");
            setTimeout(() => {
              if (!vid.classList.contains("active")) {
                vid.pause();
              }
            }, 600);
          }
        });
      }).catch(() => {
        targetVid.classList.add("active");
        cineVideos.forEach((vid, i) => {
          if (i !== idx && vid) {
            vid.classList.remove("active");
            vid.pause();
          }
        });
      });
    } else {
      targetVid.classList.add("active");
      cineVideos.forEach((vid, i) => {
        if (i !== idx && vid) {
          vid.classList.remove("active");
          vid.pause();
        }
      });
    }
  }

  // 4D Parallax Tilt & Gyroscope Effect on Cursor / Device Motion
  if (stage3D && envelope3D) {
    const glare = $("#envGlare");

    function apply4DTilt(rotX, rotY, normX, normY) {
      if (envelopeOpened) return;
      envelope3D.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
      if (glare) {
        const gx = Math.round((normX + 0.5) * 100);
        const gy = Math.round((normY + 0.5) * 100);
        glare.style.setProperty("--glare-x", `${gx}%`);
        glare.style.setProperty("--glare-y", `${gy}%`);
      }
    }

    // Pointer / Mouse move (Desktop & Touch screen drag)
    if (portal) {
      portal.addEventListener("pointermove", (e) => {
        if (envelopeOpened) return;
        const rect = portal.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        const rotY = normX * 22; // -11 to +11 deg
        const rotX = -normY * 18; // -9 to +9 deg
        apply4DTilt(rotX, rotY, normX, normY);
      });

      portal.addEventListener("pointerleave", () => {
        if (envelopeOpened) return;
        envelope3D.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0px)";
      });
    }

    // Mobile DeviceOrientation (Gyroscope Tilt)
    window.addEventListener("deviceorientation", (e) => {
      if (envelopeOpened || !e.gamma || !e.beta) return;
      const clampedGamma = Math.max(-25, Math.min(25, e.gamma));
      const clampedBeta = Math.max(15, Math.min(65, e.beta)) - 40;
      const rotY = (clampedGamma / 25) * 16;
      const rotX = -(clampedBeta / 25) * 14;
      apply4DTilt(rotX, rotY, rotY / 32, -rotX / 28);
    }, { passive: true });
  }

  /* --------------------------------------------------------------------------
     CINEMATIC ENGINE METHODS
     -------------------------------------------------------------------------- */
  function setScene(idx) {
    if (idx < 0) idx = 0;
    if (idx >= cineScenes.length) {
      exitCinematicToMain();
      return;
    }

    currentSceneIdx = idx;
    clearInterval(sceneProgressInterval);
    clearTimeout(sceneTimer);

    // Tukar paparan kad babak
    cineScenes.forEach((sc, i) => {
      sc.classList.toggle("active", i === currentSceneIdx);
    });

    // Reset dan kemas kini progress bar
    reelBars.forEach((bar, i) => {
      if (!bar) return;
      if (i < currentSceneIdx) {
        bar.style.transition = "none";
        bar.style.width = "100%";
      } else if (i > currentSceneIdx) {
        bar.style.transition = "none";
        bar.style.width = "0%";
      } else {
        bar.style.transition = "none";
        bar.style.width = "0%";
      }
    });

    // Kemas kini penunjuk & butang navigasi
    if (cineCurrentBabakTxt) {
      cineCurrentBabakTxt.textContent = babakTitles[currentSceneIdx] || `BABAK ${currentSceneIdx + 1}`;
    }
    if (cinePrevBtn) {
      cinePrevBtn.disabled = currentSceneIdx === 0;
    }
    if (cineNextBtn) {
      cineNextBtn.textContent = currentSceneIdx === cineScenes.length - 1 ? "Masuk ❯" : "Seterusnya ❯";
    }

    // Tukar video sinematik mengikut babak
    switchCineVideo(currentSceneIdx);

    // Alunkan nada kristal
    audioSuite.playChime();

    // Animasi pergerakan bar progress masa kini
    const currentBar = reelBars[currentSceneIdx];
    sceneStartTime = Date.now();
    sceneProgressInterval = setInterval(() => {
      if (!isStorylineActive) {
        clearInterval(sceneProgressInterval);
        return;
      }
      const elapsed = Date.now() - sceneStartTime;
      const pct = Math.min(100, (elapsed / SCENE_DURATION) * 100);
      if (currentBar) currentBar.style.width = `${pct}%`;

      if (elapsed >= SCENE_DURATION) {
        clearInterval(sceneProgressInterval);
      }
    }, 40);

    // Auto maju ke babak seterusnya jika tiada interaksi manual
    sceneTimer = setTimeout(() => {
      if (currentSceneIdx < cineScenes.length - 1) {
        setScene(currentSceneIdx + 1);
      }
    }, SCENE_DURATION);
  }

  function launchCinematicStoryline() {
    isStorylineActive = true;
    if (theatre) {
      theatre.classList.add("theatre-active");
      theatre.setAttribute("aria-hidden", "false");
    }

    // Pastikan semua video latar muted & sedia berputar
    cineVideos.forEach(v => {
      if (v) {
        v.muted = true;
        v.playsInline = true;
      }
    });

    // Mainkan muzik latar alunan kasih secara automatik
    audioSuite.play();

    // Tebaran bunga sakura di dalam pawagam sinematik
    burstPetals(window.innerWidth / 2, window.innerHeight * 0.45, 30);

    setScene(0);
  }

  function exitCinematicToMain() {
    isStorylineActive = false;
    clearInterval(sceneProgressInterval);
    clearTimeout(sceneTimer);

    cineVideos.forEach(v => {
      if (v) {
        v.pause();
        v.classList.remove("active");
      }
    });

    if (theatre) {
      theatre.classList.remove("theatre-active");
      theatre.setAttribute("aria-hidden", "true");
    }

    finalizeEntrance();
  }

  /* --------------------------------------------------------------------------
     UPACARA SAMPUL DIRAJA 4-LANGKAH (SEBIJIK MENGIKUT GAMBAR RUJUKAN)
     1. PRESS THE BUTTON
     2. THE ENVELOPE OPENS
     3. INVITATION APPEARS
     4. RSVP FORM READY -> TERUS KE KISAH SINEMATIK
     -------------------------------------------------------------------------- */
  const stepCol1 = document.getElementById("stepCol1");
  const stepCol2 = document.getElementById("stepCol2");
  const stepCol3 = document.getElementById("stepCol3");
  const stepCol4 = document.getElementById("stepCol4");
  const btnCardConfirm = document.getElementById("btnCardConfirm");

  function setEnvelopeStep(stepNum) {
    [stepCol1, stepCol2, stepCol3, stepCol4].forEach((col, idx) => {
      if (col) col.classList.toggle("active", idx + 1 === stepNum);
    });
  }

  function triggerEnvelopeCeremony() {
    // Prime and unlock all video elements synchronously within user gesture
    primeMobileVideos();

    if (envelopeOpened) {
      launchCinematicStoryline();
      return;
    }
    envelopeOpened = true;

    // LANGKAH 1: Butang Ditekan (Audio Chime & Muzik Mula Bermain)
    setEnvelopeStep(1);
    audioSuite.playChime();
    audioSuite.play();

    // LANGKAH 2: THE ENVELOPE OPENS (Penutup Terbuka 180 Darjah & Cahaya Emas Memancar)
    setTimeout(() => {
      setEnvelopeStep(2);
      if (envelope3D) {
        envelope3D.classList.add("step-opens");
        envelope3D.style.transform = "rotateX(0deg) rotateY(0deg)";
      }
    }, 280);

    // LANGKAH 3: INVITATION APPEARS (Kad Undangan Diraja Meluncur Keluar Dari Sampul)
    setTimeout(() => {
      setEnvelopeStep(3);
      if (envelope3D) {
        envelope3D.classList.add("step-card-up");
      }
      burstPetals(window.innerWidth / 2, window.innerHeight * 0.40, 30);
    }, 1100);

    // LANGKAH 4: RSVP FORM READY (Kad Terbuka Sepenuhnya & Butang Pengesahan Sedia)
    setTimeout(() => {
      setEnvelopeStep(4);
      if (envelope3D) {
        envelope3D.classList.add("opened");
      }
    }, 2000);
    // Nota: Transisi ke video sinematik HANYA berlaku apabila tetamu menekan butang 'CONFIRM ATTENDANCE >'
  }

  function finalizeEntrance() {
    portal.classList.add("portal-open");
    document.body.classList.remove("locked-entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
    burstPetals(window.innerWidth / 2, window.innerHeight / 2, 40);
  }

  // Event Listeners bagi Butang Cap Mohor / Kad
  if (waxSealBtn) {
    waxSealBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerEnvelopeCeremony();
    });
  }
  if (envelope3D) {
    envelope3D.addEventListener("click", () => {
      if (!envelopeOpened) triggerEnvelopeCeremony();
    });
  }
  if (btnCardConfirm) {
    btnCardConfirm.addEventListener("click", (e) => {
      e.stopPropagation();
      audioSuite.play();
      audioSuite.playChime();
      burstPetals(window.innerWidth / 2, window.innerHeight * 0.45, 25);
      primeMobileVideos();
      launchCinematicStoryline();
    });
  }
  if (unlockBtn) unlockBtn.addEventListener("click", triggerEnvelopeCeremony);
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      primeMobileVideos();
      launchCinematicStoryline();
    });
  }

  // Event Listeners bagi Navigasi Sinematik
  if (cineNextBtn) {
    cineNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentSceneIdx < cineScenes.length - 1) {
        setScene(currentSceneIdx + 1);
      } else {
        exitCinematicToMain();
      }
    });
  }

  if (cinePrevBtn) {
    cinePrevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentSceneIdx > 0) {
        setScene(currentSceneIdx - 1);
      }
    });
  }

  if (cineSkipBtn) {
    cineSkipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exitCinematicToMain();
    });
  }

  if (btnCineEnterGrand) {
    btnCineEnterGrand.addEventListener("click", (e) => {
      e.stopPropagation();
      exitCinematicToMain();
    });
  }

  // Sentuhan skrin kiri & kanan (Mobile Tap-to-Navigate)
  if (cineTapLeft) {
    cineTapLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentSceneIdx > 0) setScene(currentSceneIdx - 1);
    });
  }

  if (cineTapRight) {
    cineTapRight.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentSceneIdx < cineScenes.length - 1) {
        setScene(currentSceneIdx + 1);
      } else {
        exitCinematicToMain();
      }
    });
  }



  // Trek Progress Bersegmen Boleh Diklik
  $$(".cine-reel-track[data-jump]").forEach((trk) => {
    trk.addEventListener("click", (e) => {
      e.stopPropagation();
      const jumpIdx = parseInt(trk.getAttribute("data-jump"), 10);
      if (!isNaN(jumpIdx)) setScene(jumpIdx);
    });
  });

  // Butang Tonton Semula Sinematik
  if (btnFloatingCinema) {
    btnFloatingCinema.addEventListener("click", () => {
      primeMobileVideos();
      launchCinematicStoryline();
    });
  }

  if (btnFooterReplayCinema) {
    btnFooterReplayCinema.addEventListener("click", () => {
      primeMobileVideos();
      launchCinematicStoryline();
    });
  }

  // Auto-resume video on any mobile touch inside theatre (Low-Power Mode & Policy Fallback)
  if (theatre) {
    ["touchstart", "pointerdown", "click"].forEach(evtName => {
      theatre.addEventListener(evtName, () => {
        const curVid = cineVideos[currentSceneIdx];
        if (curVid && curVid.paused) {
          curVid.muted = true;
          curVid.defaultMuted = true;
          curVid.playsInline = true;
          curVid.play().catch(() => {});
        }
      }, { passive: true });
    });
  }

  /* --------------------------------------------------------------------------
     6. ITINERARY LIST GENERATOR
     -------------------------------------------------------------------------- */
  const timelineList = $("#timelineList");
  if (timelineList && Array.isArray(C.itinerary)) {
    timelineList.innerHTML = C.itinerary.map((item) => `
      <div class="timeline-slot">
        <div class="slot-time">${item.time}</div>
        <div class="slot-body">
          <h4 class="slot-title">${item.title}</h4>
          <p class="slot-desc">${item.desc}</p>
        </div>
      </div>
    `).join("");
  }

  /* --------------------------------------------------------------------------
     7. COUNTDOWN & ADD TO CALENDAR
     -------------------------------------------------------------------------- */
  const targetTime = new Date(C.eventStart || "2026-12-29T10:00:00+08:00").getTime();
  const tDays = $("#tDays"), tHours = $("#tHours"), tMins = $("#tMins"), tSecs = $("#tSecs");

  function runCountdown() {
    const now = Date.now();
    const diff = Math.max(0, targetTime - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if (tDays) tDays.textContent = String(d).padStart(2, "0");
    if (tHours) tHours.textContent = String(h).padStart(2, "0");
    if (tMins) tMins.textContent = String(m).padStart(2, "0");
    if (tSecs) tSecs.textContent = String(s).padStart(2, "0");

    if (diff > 0) setTimeout(runCountdown, 1000);
  }
  runCountdown();

  // Calendar
  const calStart = new Date(C.eventStart || "2026-12-29T10:00:00+08:00");
  const calEnd = new Date(C.eventEnd || "2026-12-29T14:00:00+08:00");
  const formatIcs = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const btnGoogleCal = $("#btnGoogleCal");
  if (btnGoogleCal) {
    const title = encodeURIComponent("Walimatul Urus Tengku Khairi & Joanne");
    const loc = encodeURIComponent(`${C.venueName}, ${C.venueAddress}`);
    const details = encodeURIComponent("Walimatul Urus Tengku Ahmad Khairi & Joanne Hannah Qalieysha di Jawhara Crystal Pavilion, Kuching.");
    btnGoogleCal.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatIcs(calStart)}/${formatIcs(calEnd)}&details=${details}&location=${loc}&ctz=Asia/Kuching`;
  }

  const btnAppleCal = $("#btnAppleCal");
  if (btnAppleCal) {
    btnAppleCal.addEventListener("click", () => {
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Tengku Khairi Joanne Wedding//MY",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:tengku-khairi-joanne-${Date.now()}@walimah`,
        `DTSTAMP:${formatIcs(new Date())}`,
        `DTSTART:${formatIcs(calStart)}`,
        `DTEND:${formatIcs(calEnd)}`,
        "SUMMARY:Walimatul Urus Tengku Khairi & Joanne",
        `LOCATION:${C.venueName}\\, ${C.venueAddress}`,
        "DESCRIPTION:Walimatul Urus Tengku Ahmad Khairi & Joanne Hannah Qalieysha.",
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        "DESCRIPTION:Peringatan: Esok Majlis Walimatul Urus Tengku Khairi & Joanne!",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Tengku-Khairi-Joanne-Wedding.ics";
      a.click();
      showToast("📅 Acara telah dimuat turun untuk telefon anda!");
    });
  }


  /* --------------------------------------------------------------------------
     8. TEBAR KELOPAK RESTU INTERAKTIF & CHIME HARP
     -------------------------------------------------------------------------- */
  const btnShower = $("#btnPetalShower");
  const liveBlessingCountEl = $("#liveBlessingCount");
  let blessingCount = parseInt(localStorage.getItem("kj_blessings_count") || "1288", 10);
  if (liveBlessingCountEl) liveBlessingCountEl.textContent = blessingCount.toLocaleString("ms-MY");

  if (btnShower) {
    btnShower.addEventListener("click", (e) => {
      const rect = btnShower.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      burstPetals(x, y, 28);
      audioSuite.playChime();

      blessingCount++;
      localStorage.setItem("kj_blessings_count", blessingCount);
      if (liveBlessingCountEl) liveBlessingCountEl.textContent = blessingCount.toLocaleString("ms-MY");

      // Floating Badge Pop
      const pop = document.createElement("div");
      pop.className = "floating-blessing-pop";
      pop.textContent = "🌸 +1 Restu Kasih 💕";
      pop.style.left = `${x}px`;
      pop.style.top = `${y}px`;
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 1600);
    });
  }

  /* --------------------------------------------------------------------------
     9. CONCIERGE ACCORDION (PANDUAN TETAMU VIP)
     -------------------------------------------------------------------------- */
  const conciergeCards = $$(".concierge-card");
  conciergeCards.forEach((card) => {
    const header = card.querySelector(".concierge-header");
    if (header) {
      header.addEventListener("click", () => {
        const wasActive = card.classList.contains("active");
        conciergeCards.forEach((c) => c.classList.remove("active"));
        if (!wasActive) card.classList.add("active");
      });
    }
  });

  /* --------------------------------------------------------------------------
     10. TITIPAN SUARA TETAMU (VOICE RECORDER)
     -------------------------------------------------------------------------- */
  let mediaRecorder = null;
  let audioChunks = [];
  let recordTimer = null;
  let recordSeconds = 0;
  let recordedAudioBase64 = null;

  const btnRecordVoice = $("#btnRecordVoice");
  const recBtnText = $("#recBtnText");
  const voiceTimerEl = $("#voiceTimer");
  const voiceAudioPreview = $("#voiceAudioPreview");
  const btnClearVoice = $("#btnClearVoice");

  if (btnRecordVoice) {
    btnRecordVoice.addEventListener("click", async () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showToast("⚠️ Pelayar ini tidak menyokong rakaman suara langsung.");
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          recordSeconds = 0;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            clearInterval(recordTimer);
            btnRecordVoice.classList.remove("recording");
            if (recBtnText) recBtnText.textContent = "Rakam Semula";
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);
            if (voiceAudioPreview) {
              voiceAudioPreview.src = audioUrl;
              voiceAudioPreview.hidden = false;
            }
            if (btnClearVoice) btnClearVoice.hidden = false;
            if (voiceTimerEl) voiceTimerEl.hidden = true;

            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              recordedAudioBase64 = reader.result;
            };

            stream.getTracks().forEach((track) => track.stop());
            showToast("🎙️ Ucapan suara anda telah selamat dirakam!");
          };

          mediaRecorder.start();
          btnRecordVoice.classList.add("recording");
          if (recBtnText) recBtnText.textContent = "Hentikan Rakaman";
          if (voiceTimerEl) {
            voiceTimerEl.hidden = false;
            voiceTimerEl.textContent = "00:00 / 00:15";
          }
          if (voiceAudioPreview) voiceAudioPreview.hidden = true;

          recordTimer = setInterval(() => {
            recordSeconds++;
            const s = String(recordSeconds).padStart(2, "0");
            if (voiceTimerEl) voiceTimerEl.textContent = `00:${s} / 00:15`;
            if (recordSeconds >= 15) {
              if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
              }
            }
          }, 1000);
        } catch (err) {
          console.warn(err);
          showToast("⚠️ Sila benarkan akses mikrofon untuk merakam ucapan suara.");
        }
      }
    });
  }

  if (btnClearVoice) {
    btnClearVoice.addEventListener("click", () => {
      recordedAudioBase64 = null;
      if (voiceAudioPreview) {
        voiceAudioPreview.src = "";
        voiceAudioPreview.hidden = true;
      }
      btnClearVoice.hidden = true;
      if (recBtnText) recBtnText.textContent = "Rakam Suara";
    });
  }

  /* --------------------------------------------------------------------------
     11. RSVP FORM SUBMISSION & LOCALSTORAGE CACHE
     -------------------------------------------------------------------------- */
  const rsvpForm = $("#rsvpConsoleForm");
  const paxGroup = $("#groupPax");
  const radioCards = $$(".att-card");
  const paxButtons = $$(".p-btn");
  let chosenPax = 1;

  radioCards.forEach((rc) => {
    rc.addEventListener("click", () => {
      radioCards.forEach((c) => c.classList.remove("active"));
      rc.classList.add("active");
      const radio = rc.querySelector("input[type=radio]");
      if (radio) radio.checked = true;

      const isAttending = rc.querySelector("input[value=yes]") !== null;
      if (paxGroup) paxGroup.style.display = isAttending ? "block" : "none";
    });
  });

  paxButtons.forEach((pb) => {
    pb.addEventListener("click", () => {
      paxButtons.forEach((b) => b.classList.remove("active"));
      pb.classList.add("active");
      chosenPax = parseInt(pb.dataset.count, 10) || 1;
    });
  });

  const RSVP_LOCAL_KEY = "kj_joanne_pastel_rsvp";
  const existingRsvp = localStorage.getItem(RSVP_LOCAL_KEY);
  if (existingRsvp) {
    try {
      const parsed = JSON.parse(existingRsvp);
      // Jika pautan dibuka dengan nama tetamu berbeza melalui ?to=..., buka borang baharu
      if (rawGuest && rawGuest.toLowerCase() !== (parsed.name || "").toLowerCase()) {
        if (rsvpForm) rsvpForm.hidden = false;
      } else {
        showSlip(parsed);
      }
    } catch (e) {
      if (rsvpForm) rsvpForm.hidden = false;
    }
  }

  function showSlip(data) {
    if (rsvpForm) rsvpForm.hidden = true;
    const slip = $("#confirmedSlip");
    if (slip) slip.hidden = false;
    if ($("#slipGuest")) $("#slipGuest").textContent = data.name;
    if ($("#slipDetail")) {
      $("#slipDetail").textContent = data.attending
        ? `Status: Hadir · ${data.pax} Pax · Jawhara Crystal Pavilion`
        : `Status: Kekangan Hadir · Mendoakan Dari Kejauhan`;
    }
  }

  const btnEditRsvp = $("#btnEditRsvp");
  if (btnEditRsvp) {
    btnEditRsvp.addEventListener("click", () => {
      localStorage.removeItem(RSVP_LOCAL_KEY);
      if (rsvpForm) {
        rsvpForm.hidden = false;
        const nameInput = $("#inputName");
        if (nameInput) {
          nameInput.value = rawGuest || "";
          nameInput.focus();
        }
      }
      const slip = $("#confirmedSlip");
      if (slip) slip.hidden = true;
    });
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = $("#formStatusMsg");
      statusEl.textContent = "";

      const name = ($("#inputName").value || "").trim();
      const phone = ($("#inputPhone").value || "").replace(/[^\d+]/g, "").trim();
      const attending = $("#rsvpConsoleForm input[name=attendOpt]:checked").value === "yes";
      const wish = ($("#inputWish").value || "").trim();

      if (name.length < 2) {
        statusEl.textContent = "Sila masukkan nama penuh anda.";
        return;
      }
      if (!/^\+?\d{8,16}$/.test(phone)) {
        statusEl.textContent = "Sila masukkan nombor telefon yang sah.";
        return;
      }

      const submitBtn = $("#btnSubmitRsvp");
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>Menghantar Pengesahan...</span>";

      const record = {
        name,
        phone,
        attending,
        pax: attending ? chosenPax : 0,
        wish,
        voice: recordedAudioBase64 || null,
        created_at: new Date().toISOString()
      };

      try {
        if (db) {
          const { error: rErr } = await db.from("rsvp").insert({
            name, phone, attending, pax: record.pax, created_at: record.created_at
          });
          if (rErr) throw rErr;
          if (wish || recordedAudioBase64) {
            await db.from("wishes").insert({ name, message: wish, voice: recordedAudioBase64 });
          }
        } else {
          const list = JSON.parse(localStorage.getItem("pastel_rsvps") || "[]");
          list.push(record);
          localStorage.setItem("pastel_rsvps", JSON.stringify(list));

          if (wish || recordedAudioBase64) {
            appendWishTile({ name, message: wish, voice: recordedAudioBase64, created_at: new Date().toISOString() }, true);
          }
        }

        // Auto-sync ke Google Sheets jika URL webhook dikonfigurasi
        const webhookUrl = C.googleSheetWebhookUrl || localStorage.getItem("kj_google_webhook_url");
        if (webhookUrl) {
          try {
            fetch(webhookUrl, {
              method: "POST",
              mode: "no-cors",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(record)
            }).catch(e => console.warn("Google Sheet sync notice:", e));
          } catch(e) {}
        }

        localStorage.setItem(RSVP_LOCAL_KEY, JSON.stringify(record));
        showSlip(record);
        audioSuite.playChime();
        burstPetals(window.innerWidth / 2, window.innerHeight / 2, 40);
        showToast("🌸 Terima kasih! Pengesahan kehadiran anda telah disimpan.");
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Masalah rangkaian. Sila cuba sekali lagi.";
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>HANTAR PENGESAHAN (RSVP)</span>";
      }
    });
  }

  /* --------------------------------------------------------------------------
     12. WISHES STREAM (REALTIME & LOCAL FALLBACK)
     -------------------------------------------------------------------------- */
  const fountain = $("#wishesFountain");
  let totalWishes = 0;

  // Senarai Ucapan Rasmi Tetamu Yang Telah Mendaftar (Segerak daripada RSVP & Google Sheets)
  const baseWishes = [
    {
      name: "ANGELINA EVE",
      message: "SEMOGA KEKAL HINGGA KE JANNAH 🤍",
      created_at: "2026-10-15T18:06:00+08:00"
    },
    {
      name: "Bradley Siew",
      message: "tahniah kepada pengantin! Selamat melangkah ke fasa baharu perkahwinan.",
      created_at: "2026-10-15T17:49:00+08:00"
    }
  ];

  function formatTime(iso) {
    if (!iso) return "baru sahaja";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "baru sahaja";
    if (s < 3600) return `${Math.floor(s / 60)} minit lalu`;
    if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
    return d.toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
  }

  function appendWishTile(wish, isNew = false) {
    if (!fountain) return;
    const prompt = fountain.querySelector(".empty-wish-notice");
    if (prompt) prompt.remove();

    const tile = document.createElement("div");
    tile.className = "wish-tile";
    
    let voicePlayerHtml = "";
    if (wish.voice) {
      voicePlayerHtml = `
        <div style="margin-top: 8px;">
          <audio src="${wish.voice}" controls style="width: 100%; height: 32px; filter: sepia(20%) saturate(120%);"></audio>
        </div>
      `;
    }

    tile.innerHTML = `
      <div class="wish-tile-top">
        <span class="wish-author">${escapeHtml(wish.name)}</span>
        <span class="wish-time">${formatTime(wish.created_at)}</span>
      </div>
      ${wish.message ? `<p class="wish-quote">${escapeHtml(wish.message)}</p>` : ""}
      ${voicePlayerHtml}
    `;

    isNew ? fountain.prepend(tile) : fountain.appendChild(tile);
    totalWishes++;
    if ($("#liveWishesCount")) $("#liveWishesCount").textContent = totalWishes;

    if (!db && isNew) {
      const stored = JSON.parse(localStorage.getItem("pastel_wishes") || "[]");
      stored.unshift(wish);
      localStorage.setItem("pastel_wishes", JSON.stringify(stored));
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  async function loadWishes() {
    // 1. Dapatkan senarai nama yang telah dipadamkan oleh admin di CRM
    let deletedSet = new Set();
    try {
      const deletedRaw = localStorage.getItem("kj_deleted_guests") || "[]";
      const deletedArr = JSON.parse(deletedRaw);
      deletedArr.forEach(k => {
        deletedSet.add(k);
        const nameOnly = k.split("_")[0];
        if (nameOnly) deletedSet.add(nameOnly.trim().toLowerCase());
      });
    } catch(e) {}

    // Fungsi penapis untuk menyingkirkan rekod ujian atau rekod yang dipadam di CRM
    function shouldIncludeWish(name, message) {
      if (!name || !message) return false;
      const n = name.trim().toLowerCase();
      const m = message.trim().toLowerCase();
      if (n.includes("test") || n.includes("ujian") || n.includes("demo")) return false;
      if (n.includes("tengku khairi") || n.includes("tengku ahmad khairi")) return false;
      if (m.includes("ujian penghantaran") || m.includes("ujian sambungan") || m.includes("test dari browser") || m.includes("setinggi-tinggi terima kasih")) return false;
      if (deletedSet.has(n)) return false;
      return true;
    }

    // Bersihkan 'pastel_wishes' di simpanan peranti daripada sebarang rekod ujian / rekod dipadam
    let stored = [];
    try {
      const rawStored = JSON.parse(localStorage.getItem("pastel_wishes") || "[]");
      stored = rawStored.filter(w => w && shouldIncludeWish(w.name, w.message));
      localStorage.setItem("pastel_wishes", JSON.stringify(stored));
    } catch (e) {
      stored = [];
    }

    const seen = new Set();
    const wishList = [];

    // 2. Gabungkan simpanan tempatan peranti dan baseWishes
    [...stored, ...baseWishes].forEach(w => {
      if (!w || !w.message) return;
      if (!shouldIncludeWish(w.name, w.message)) return;
      const key = (w.name || "").trim().toLowerCase() + "_" + (w.message || "").trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        wishList.push(w);
      }
    });

    // 3. Jika ada Google Sheets webhook, ambil ucapan secara langsung
    const webhookUrl = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.googleSheetWebhookUrl) || localStorage.getItem("kj_google_webhook_url");
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl);
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            rows.forEach(r => {
              const msg = (r.wish || r.message || "").trim();
              if (msg && msg !== "-" && msg.length > 1) {
                if (!shouldIncludeWish(r.name, msg)) return;
                const key = (r.name || "").trim().toLowerCase() + "_" + msg.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  wishList.push({
                    name: r.name,
                    message: msg,
                    voice: r.voice || null,
                    created_at: r.created_at || new Date().toISOString()
                  });
                }
              }
            });
          }
        }
      } catch (err) {
        console.warn("Wishes live fetch notice:", err);
      }
    }

    if (db) {
      try {
        const { data, error } = await db.from("wishes").select("name, message, voice, created_at").order("created_at", { ascending: false }).limit(60);
        if (!error && Array.isArray(data)) {
          data.forEach(w => {
            if (!shouldIncludeWish(w.name, w.message)) return;
            const key = (w.name || "").trim().toLowerCase() + "_" + (w.message || "").trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              wishList.push(w);
            }
          });
        }
      } catch (e) {}
    }

    // Susun mengikut tarikh terbaru di atas
    wishList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    if (fountain) fountain.innerHTML = "";
    totalWishes = 0;
    wishList.forEach((w) => appendWishTile(w, false));
  }
  loadWishes();

  /* --------------------------------------------------------------------------
     13. VIP BOARDING PASS MODAL & CANVAS PNG DOWNLOAD
     -------------------------------------------------------------------------- */
  const modalVip = $("#modalVipPass");
  const btnCloseVip = $("#btnCloseVipModal");
  const btnPreviewVip = $("#btnPreviewVipPass");
  const btnOpenSlipVip = $("#btnOpenSlipVipPass");
  const btnDownloadVip = $("#btnDownloadVipPng");

  function getActiveGuestDetails() {
    const storedRsvp = localStorage.getItem(RSVP_LOCAL_KEY);
    let name = rawGuest || "Tetamu Kehormat Yang Diraikan";
    let pax = chosenPax || 2;
    if (storedRsvp) {
      try {
        const parsed = JSON.parse(storedRsvp);
        if (parsed.name) name = parsed.name;
        if (parsed.pax) pax = parsed.pax;
      } catch (e) {}
    } else {
      const inputVal = ($("#inputName")?.value || "").trim();
      if (inputVal) name = inputVal;
    }
    return { name, pax };
  }

  function openVipModal() {
    const { name, pax } = getActiveGuestDetails();
    if ($("#vipTicketGuestName")) $("#vipTicketGuestName").textContent = name;
    if ($("#vipTicketPaxCount")) $("#vipTicketPaxCount").textContent = `${pax} PAX`;
    if ($("#vipTicketSerial")) $("#vipTicketSerial").textContent = `NO. SIRI: #KJ2912-VIP-${String(pax).padStart(2, "0")}A`;
    if (modalVip) modalVip.classList.add("open");
  }

  if (btnPreviewVip) btnPreviewVip.addEventListener("click", openVipModal);
  if (btnOpenSlipVip) btnOpenSlipVip.addEventListener("click", openVipModal);
  if (btnCloseVip) btnCloseVip.addEventListener("click", () => modalVip.classList.remove("open"));
  if (modalVip) {
    modalVip.addEventListener("click", (e) => {
      if (e.target === modalVip) modalVip.classList.remove("open");
    });
  }

  function renderAndDownloadVipPng() {
    const { name, pax } = getActiveGuestDetails();
    const c = $("#vipTicketCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    const W = 1000, H = 1400;
    c.width = W;
    c.height = H;

    // 1. Latar Sutera Halus (Silk Gradient)
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#FFFDF9");
    bg.addColorStop(0.5, "#FAF6EE");
    bg.addColorStop(1, "#F6ECE5");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Bingkai Emas & Blush Berlapis
    ctx.strokeStyle = "#CBB068";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = "#DCA8AE";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(55, 55, W - 110, H - 110);

    // 3. Monogram Wreath KJ
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 170, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(203, 176, 104, 0.3)";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = "#CBB068";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#3E3228";
    ctx.font = "bold 38px 'Cormorant Garamond', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KJ", W / 2, 170);
    ctx.restore();

    // 4. Header Titles
    ctx.textAlign = "center";
    ctx.fillStyle = "#C87D85";
    ctx.font = "600 20px 'Cinzel', serif";
    ctx.fillText("MAHLIGAI KASIH · ROYAL VIP PASS", W / 2, 260);

    ctx.fillStyle = "#7A695C";
    ctx.font = "500 16px 'Montserrat', sans-serif";
    ctx.fillText("WALIMATUL URUS MEMPELAI", W / 2, 290);

    ctx.fillStyle = "#3E3228";
    ctx.font = "bold 38px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("Tengku Ahmad Khairi & Joanne Hannah Qalieysha", W / 2, 335);

    // Divider Line
    ctx.strokeStyle = "rgba(200, 125, 133, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, 370);
    ctx.lineTo(W - 180, 370);
    ctx.stroke();

    // 5. Guest Card Box
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(180, 145, 135, 0.12)";
    ctx.shadowBlur = 20;
    roundRect(ctx, 120, 420, W - 240, 210, 16);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#DCA8AE";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#7A695C";
    ctx.font = "600 15px 'Montserrat', sans-serif";
    ctx.fillText("JEMPUTAN EKSKLUSIF BUAT:", W / 2, 470);

    ctx.fillStyle = "#3E3228";
    ctx.font = "bold 40px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(name, W / 2, 530);

    // Status Badge
    ctx.fillStyle = "#EAF3E7";
    roundRect(ctx, W / 2 - 140, 565, 280, 36, 18);
    ctx.fill();
    ctx.strokeStyle = "#C4DEC0";
    ctx.stroke();
    ctx.fillStyle = "#3B6E32";
    ctx.font = "bold 15px 'Montserrat', sans-serif";
    ctx.fillText("STATUS: PENGESAHAN DIIKTIRAF", W / 2, 588);

    // 6. Meta Grid (Tarikh, Masa, Pax)
    const boxY = 675;
    const boxW = 230;
    const gap = 35;
    const startX = (W - (boxW * 3 + gap * 2)) / 2;

    const cells = [
      { lbl: "TARIKH", val: "29 DIS 2026", sub: "SELASA" },
      { lbl: "MASA", val: "10:00 AM", sub: "HINGGA 2:00 PM" },
      { lbl: "JUMLAH", val: `${pax} PAX`, sub: "TETAMU RASMI" }
    ];

    cells.forEach((cell, idx) => {
      const bx = startX + idx * (boxW + gap);
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, bx, boxY, boxW, 110, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 195, 185, 0.6)";
      ctx.stroke();

      ctx.fillStyle = "#7A695C";
      ctx.font = "600 13px 'Montserrat', sans-serif";
      ctx.fillText(cell.lbl, bx + boxW / 2, boxY + 30);

      ctx.fillStyle = "#3E3228";
      ctx.font = "bold 26px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(cell.val, bx + boxW / 2, boxY + 65);

      ctx.fillStyle = "#9C8C7E";
      ctx.font = "500 12px 'Montserrat', sans-serif";
      ctx.fillText(cell.sub, bx + boxW / 2, boxY + 92);
    });

    // 7. Lokasi Dewan
    ctx.fillStyle = "#7A695C";
    ctx.font = "600 14px 'Montserrat', sans-serif";
    ctx.fillText("LOKASI RESEPSI:", W / 2, 840);

    ctx.fillStyle = "#3E3228";
    ctx.font = "bold 26px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("Jawhara Crystal Pavilion", W / 2, 875);

    ctx.fillStyle = "#7A695C";
    ctx.font = "500 16px 'Montserrat', sans-serif";
    ctx.fillText("Lot 29, Section 64, KTLD, Jalan Deshon, 93300 Kuching, Sarawak", W / 2, 908);

    // 8. Garis Perforasi Keratan
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(200, 160, 150, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 970);
    ctx.lineTo(W - 80, 970);
    ctx.stroke();
    ctx.setLineDash([]);

    // 9. Barcode & Stub Footer
    ctx.fillStyle = "#7A695C";
    ctx.font = "600 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`NO. SIRI: #KJ2912-VIP-${String(pax).padStart(2, "0")}A`, 120, 1030);

    // Draw simulated barcode lines
    ctx.fillStyle = "#3E3228";
    let bxCursor = 120;
    for (let i = 0; i < 48; i++) {
      const barW = (i % 3 === 0) ? 5 : (i % 2 === 0 ? 3 : 2);
      ctx.fillRect(bxCursor, 1060, barW, 60);
      bxCursor += barW + 4;
    }

    // Right side QR code simulation
    const qrSize = 130;
    const qrX = W - 120 - qrSize;
    const qrY = 1010;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 10);
    ctx.fill();
    ctx.strokeStyle = "#C87D85";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // QR decorative squares
    ctx.fillStyle = "#3E3228";
    ctx.fillRect(qrX + 15, qrY + 15, 30, 30);
    ctx.fillRect(qrX + qrSize - 45, qrY + 15, 30, 30);
    ctx.fillRect(qrX + 15, qrY + qrSize - 45, 30, 30);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX + 22, qrY + 22, 16, 16);
    ctx.fillRect(qrX + qrSize - 38, qrY + 22, 16, 16);
    ctx.fillRect(qrX + 22, qrY + qrSize - 38, 16, 16);
    ctx.fillStyle = "#3E3228";
    ctx.fillRect(qrX + 26, qrY + 26, 8, 8);
    ctx.fillRect(qrX + qrSize - 34, qrY + 26, 8, 8);
    ctx.fillRect(qrX + 26, qrY + qrSize - 34, 8, 8);

    ctx.fillStyle = "#C87D85";
    ctx.beginPath();
    ctx.arc(qrX + qrSize / 2, qrY + qrSize / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    // Footer copyright note
    ctx.fillStyle = "#9C8C7E";
    ctx.font = "500 14px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sila tunjukkan Pas Kehadiran Digital ini semasa ketibaan di pintu masuk dewan.", W / 2, 1260);
    ctx.fillText("#KhairiAndJoanneEvermore · 29 Disember 2026", W / 2, 1290);

    // Trigger PNG Download
    const dataUrl = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Pas-VIP-TengkuKhairi-Joanne-${name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.click();
    showToast("📥 Pas VIP berjaya disimpan ke telefon anda!");
    audioSuite.playChime();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  if (btnDownloadVip) {
    btnDownloadVip.addEventListener("click", renderAndDownloadVipPng);
  }

  /* --------------------------------------------------------------------------
     14. SALAM KAUT & HADIAH KASIH MODAL
     -------------------------------------------------------------------------- */
  const modalGift = $("#modalSalamKaut");
  const btnCloseGift = $("#btnCloseGiftModal");
  const btnFloatingGift = $("#btnFloatingGift");
  const btnOpenGiftModal = $("#btnOpenGiftModal");
  const btnOpenSlipGift = $("#btnOpenSlipGift");
  const btnCopyAccNumber = $("#btnCopyAccNumber");

  function openGiftModal() {
    if (modalGift) modalGift.classList.add("open");
  }

  if (btnFloatingGift) btnFloatingGift.addEventListener("click", openGiftModal);
  if (btnOpenGiftModal) btnOpenGiftModal.addEventListener("click", openGiftModal);
  if (btnOpenSlipGift) btnOpenSlipGift.addEventListener("click", openGiftModal);
  if (btnCloseGift) btnCloseGift.addEventListener("click", () => modalGift.classList.remove("open"));
  if (modalGift) {
    modalGift.addEventListener("click", (e) => {
      if (e.target === modalGift) modalGift.classList.remove("open");
    });
  }

  if (btnCopyAccNumber) {
    btnCopyAccNumber.addEventListener("click", () => {
      const accNumber = "14041025695621";
      navigator.clipboard.writeText(accNumber).then(() => {
        const textEl = $("#copyAccText");
        if (textEl) textEl.textContent = "✓ Disalin ke Papan Keratan!";
        showToast("📋 Nombor akaun Bank Islam telah disalin!");
        audioSuite.playChime();
        setTimeout(() => {
          if (textEl) textEl.textContent = "Salin Nombor Akaun";
        }, 3000);
      });
    });
  }

  /* --------------------------------------------------------------------------
     15. DOCK ACTIVE OBSERVER
     -------------------------------------------------------------------------- */
  const dockLinks = $$(".dock-item");
  const sectionIds = ["prologue", "invitation", "story", "itinerary", "venue", "concierge", "rsvp", "wishes"];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        dockLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
      }
    });
  }, { threshold: 0.35 });

  sectionIds.forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) obs.observe(sec);
  });

  /* --------------------------------------------------------------------------
     16. TOAST NOTIFICATION
     -------------------------------------------------------------------------- */
  function showToast(msg) {
    const t = $("#crystalToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3500);
  }

})();
