/* ─────────────────────────────────────────
   écho — portfolio · script.js
───────────────────────────────────────── */

// ── Scroll progress ────────────────────
const progressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (window.scrollY / max * 100) + '%';
}, { passive: true });


// ── Scroll reveal ──────────────────────
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

reveals.forEach((el, i) => {
  const col = i % 3;
  el.style.setProperty('--stagger', `${col * 80}ms`);
  revealObserver.observe(el);
});


// ── Tab slider ─────────────────────────
const tabs      = document.querySelectorAll('.tab');
const cards     = document.querySelectorAll('.card');
const slider    = document.getElementById('tabSlider');
const filterBar = document.querySelector('.filter-bar');

function moveSlider(tab) {
  const barRect = filterBar.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  slider.style.left  = (tabRect.left - barRect.left) + 'px';
  slider.style.width = tabRect.width + 'px';
}

// Init slider on active tab
const initActive = document.querySelector('.tab.active');
if (initActive) {
  // Wait for layout
  requestAnimationFrame(() => moveSlider(initActive));
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    moveSlider(tab);

    const filter = tab.dataset.filter;

    cards.forEach((card, i) => {
      const match = filter === 'all' || card.dataset.cat === filter;
      if (match) {
        card.classList.remove('hidden');
        card.classList.remove('visible');
        setTimeout(() => card.classList.add('visible'), (i % 3) * 60 + 20);
      } else {
        card.classList.add('hidden');
        card.classList.remove('visible');
      }
    });
  });
});

// Recalculate slider on resize
window.addEventListener('resize', () => {
  const active = document.querySelector('.tab.active');
  if (active) moveSlider(active);
}, { passive: true });


// ── Magnetic Discord button ─────────────
const discordBtn   = document.getElementById('discordBtn');
const discordLabel = document.getElementById('discordLabel');
const toast        = document.getElementById('toast');
let toastTimer;

discordBtn.addEventListener('mousemove', (e) => {
  const rect = discordBtn.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const dx   = (e.clientX - cx) * 0.22;
  const dy   = (e.clientY - cy) * 0.22;
  discordBtn.style.transform = `translate(${dx}px, ${dy}px)`;
});

discordBtn.addEventListener('mouseleave', () => {
  discordBtn.style.transform = 'translate(0, 0)';
});

discordBtn.addEventListener('click', () => {
  navigator.clipboard.writeText('écho').then(() => {
    discordLabel.textContent = 'Copié !';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      discordLabel.textContent = 'écho';
    }, 2000);
  }).catch(() => {
    const tmp = document.createElement('input');
    tmp.value = 'écho';
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    discordLabel.textContent = 'Copié !';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      discordLabel.textContent = 'écho';
    }, 2000);
  });
});


// ── Nav shrink on scroll ───────────────
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.style.padding = window.scrollY > 60 ? '1rem 5vw' : '1.6rem 5vw';
}, { passive: true });


// ── Hero canvas particles ──────────────
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles() {
    const count = Math.floor(W * H / 18000);
    particles = Array.from({ length: count }, () => ({
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(0.4, 1.1),
      vx:   rand(-0.06, 0.06),
      vy:   rand(-0.08, -0.02),
      a:    rand(0.02, 0.12),
      life: rand(0, 1),
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.life += 0.003;
      if (p.life > 1) { p.life = 0; p.x = rand(0, W); p.y = H + 10; }
      const alpha = Math.sin(p.life * Math.PI) * p.a;
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(p.life * 3) * 8, p.y - p.life * H * 0.6, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();

  window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
})();


// ── Glitch effect on name (rare) ───────
(function () {
  const name = document.getElementById('nameMain');
  if (!name) return;

  function triggerGlitch() {
    name.classList.add('glitch');
    setTimeout(() => name.classList.remove('glitch'), 200);
    // Schedule next glitch in 7–18s
    setTimeout(triggerGlitch, rand(7000, 18000));
  }

  function rand(a, b) { return Math.random() * (b - a) + a; }

  // First glitch after 5s
  setTimeout(triggerGlitch, 5000);
})();


// ── Ambient Web Audio ──────────────────
(function () {
  const btn = document.getElementById('audioBtn');
  if (!btn) return;

  let ctx = null;
  let masterGain = null;
  let playing = false;
  let nodes = [];

  // Chord frequencies: Am7 voicing, very low register
  const FREQS = [55, 110, 146.83, 164.81, 220, 261.63];

  function buildAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Reverb-like feedback delay
    const delay  = ctx.createDelay(2.5);
    delay.delayTime.value = 0.38;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.28;
    delay.connect(delayGain);
    delayGain.connect(delay);
    delayGain.connect(masterGain);

    FREQS.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      // Slow detune drift
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.04 + i * 0.013;
      lfoGain.gain.value = 0.8 + i * 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start();

      gain.gain.value = 0.06 / FREQS.length;

      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(delay);
      osc.start();

      nodes.push(osc, lfo);
    });
  }

  function fadeIn() {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.038, ctx.currentTime + 3);
  }

  function fadeOut() {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 2);
  }

  btn.classList.add('muted');

  btn.addEventListener('click', () => {
    buildAudio();

    if (ctx.state === 'suspended') ctx.resume();

    if (!playing) {
      fadeIn();
      btn.classList.remove('muted');
      playing = true;
    } else {
      fadeOut();
      btn.classList.add('muted');
      playing = false;
    }
  });
})();
