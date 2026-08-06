/* ===== Three.js 3D Hero Scene ===== */
(function initHero3D() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

  const group = new THREE.Group();
  scene.add(group);

  const gold = 0xf5b942;
  const wireMat = new THREE.MeshBasicMaterial({ color: gold, wireframe: true, transparent: true, opacity: 0.55 });
  const glowMat = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.08 });

  const shapes = [
    { geo: new THREE.IcosahedronGeometry(1.1, 0), pos: [0, 0, 0], speed: 0.004 },
    { geo: new THREE.TorusGeometry(0.75, 0.22, 12, 32), pos: [2.2, 0.8, -1], speed: -0.006 },
    { geo: new THREE.OctahedronGeometry(0.55, 0), pos: [-2, -0.6, 0.5], speed: 0.005 },
    { geo: new THREE.TorusKnotGeometry(0.45, 0.12, 80, 12), pos: [1.5, -1.2, -0.5], speed: 0.003 },
  ];

  shapes.forEach(({ geo, pos, speed }) => {
    const mesh = new THREE.Mesh(geo, wireMat.clone());
    mesh.position.set(...pos);
    mesh.userData.speed = speed;
    group.add(mesh);

    const glow = new THREE.Mesh(geo.clone(), glowMat.clone());
    glow.scale.setScalar(1.05);
    glow.position.copy(mesh.position);
    mesh.userData.glow = glow;
    group.add(glow);
  });

  const particleCount = isMobile ? 80 : 180;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 14;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ color: gold, size: isMobile ? 0.025 : 0.035, transparent: true, opacity: 0.6 })
  );
  scene.add(particles);

  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize);

  /* Pause rendering while the hero is off-screen (keeps phones cool) */
  let heroVisible = true;
  if ('IntersectionObserver' in window) {
    const heroSection = canvas.closest('section');
    if (heroSection) {
      new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(heroSection);
    }
  }

  let frameCount = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!heroVisible) return;
    /* Phones: render every other frame to halve GPU load while scrolling */
    if (isMobile && ++frameCount % 2 !== 0) return;
    if (!prefersReduced) {
      group.children.forEach((child) => {
        if (child.userData.speed) {
          child.rotation.x += child.userData.speed;
          child.rotation.y += child.userData.speed * 1.4;
          if (child.userData.glow) {
            child.userData.glow.rotation.copy(child.rotation);
          }
        }
      });
      particles.rotation.y += 0.0004;
      group.rotation.y += (mouseX * 0.15 - group.rotation.y) * 0.03;
      group.rotation.x += (-mouseY * 0.1 - group.rotation.x) * 0.03;
    }
    renderer.render(scene, camera);
  }
  animate();
})();

/* ===== Scroll Reveal ===== */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => observer.observe(el));

/* ===== Project Card Spotlight ===== */
document.querySelectorAll('.project-card, .skill-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', e.clientX - rect.left + 'px');
    e.currentTarget.style.setProperty('--y', e.clientY - rect.top + 'px');
  });
});

/* ===== 3D Tilt on Cards ===== */
document.querySelectorAll('.project-card, .skill-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ===== Skill Progress Bars ===== */
const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.progress-fill').forEach((fill, i) => {
          setTimeout(() => {
            fill.style.animation = 'none';
            void fill.offsetWidth;
            fill.style.animation = '';
          }, i * 120);
        });
        skillObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const skillsSection = document.querySelector('.skills-section');
if (skillsSection) skillObserver.observe(skillsSection);

/* ===== Stats Counter ===== */
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach((num) => {
          const target = parseInt(num.getAttribute('data-target'), 10);
          let current = 0;
          const step = target / 50;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              num.textContent = target;
              clearInterval(timer);
            } else {
              num.textContent = Math.floor(current);
            }
          }, 30);
        });
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

const statsContainer = document.querySelector('.stats-container');
if (statsContainer) countObserver.observe(statsContainer);

/* ===== Typing Effect ===== */
(function typeWriter() {
  const el = document.querySelector('.typed-text');
  if (!el) return;
  const phrases = [
    'A Freelance Web Designer',
    'A Computer Science Student',
    'An AI & Web Developer',
    'A Problem Solver',
  ];
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIdx];
    el.textContent = deleting
      ? current.substring(0, charIdx--)
      : current.substring(0, charIdx++);

    let delay = deleting ? 40 : 80;
    if (!deleting && charIdx === current.length + 1) {
      delay = 2200;
      deleting = true;
    } else if (deleting && charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      delay = 400;
    }
    setTimeout(tick, delay);
  }
  tick();
})();

/* ===== Sticky Header ===== */
const header = document.querySelector('.Header');

/* ===== Active Nav Link ===== */
const sections = document.querySelectorAll('section[id], .hero');
const navLinks = document.querySelectorAll('.item a');
const navLinkHrefs = Array.from(navLinks, (link) => link.getAttribute('href'));

/* Section offsets are cached — reading offsetTop/offsetHeight during
   scroll forces synchronous layout on every frame (classic mobile jank). */
const sectionRects = Array.from(sections, (section) => ({
  id: section.getAttribute('id'),
  top: section.offsetTop,
  height: section.offsetHeight,
}));

function refreshSectionRects() {
  sections.forEach((section, i) => {
    sectionRects[i].top = section.offsetTop;
    sectionRects[i].height = section.offsetHeight;
  });
}

function highlightNav() {
  const scrollY = window.scrollY + 120;
  for (const rect of sectionRects) {
    if (scrollY >= rect.top && scrollY < rect.top + rect.height) {
      navLinks.forEach((link, i) => {
        link.classList.toggle('active-link', navLinkHrefs[i] === '#' + rect.id);
      });
    }
  }
}
highlightNav();
window.addEventListener('resize', refreshSectionRects);
/* Fonts (display=swap) and late images can shift section heights after
   load — re-measure once everything is in. */
window.addEventListener('load', refreshSectionRects);

/* rAF-throttled scroll handler — keeps the fixed header and nav
   highlighting smooth on mobile instead of firing every pixel. */
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    header.classList.toggle('scrolled', window.scrollY > 40);
    highlightNav();
    scrollTicking = false;
  });
}, { passive: true });

/* ===== Mobile Menu ===== */
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.item');

menuToggle?.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  menuToggle.classList.toggle('active');
  document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', navMenu.classList.contains('open') ? 'true' : 'false');
});

navMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    menuToggle?.classList.remove('active');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    navMenu?.classList.remove('open');
    menuToggle?.classList.remove('active');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

/* ===== Timeline Line Draw ===== */
const timeline = document.querySelector('.timeline');
if (timeline) {
  const tlObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          tlObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  tlObserver.observe(timeline);
}

/* ===== Cursor Glow (desktop) ===== */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let gx = 0;
  let gy = 0;
  document.addEventListener('mousemove', (e) => {
    gx = e.clientX;
    gy = e.clientY;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
  });
}

/* ============================================================
   MODERN ENHANCEMENTS
   Particle field · magnetic · scramble · back-to-top
   ============================================================ */

/* ---- Full-Page 3D Particle Constellation (desktop only) ---- */
(function initParticleField() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return; // heavy on phones — the hero 3D scene is enough

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const group = new THREE.Group();
  scene.add(group);

  const count = 130;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * (i % 3 === 1 ? 16 : 24);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xf5b942,
      size: 0.07,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );
  group.add(points);

  let lineGeo = null;
  let lineFrames = 0;
  let lineCount = 0;
  { // desktop only — lines add depth; phones skip the whole field above
    const maxPairs = (count * (count - 1)) / 2;
    const lineAttr = new THREE.BufferAttribute(new Float32Array(maxPairs * 6), 3);
    lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', lineAttr);
    lineGeo.setDrawRange(0, 0);
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0xf5b942, transparent: true, opacity: 0.1 })
    );
    group.add(lines);
  }

  function updateLines() {
    if (!lineGeo) return;
    lineFrames++;
    if (lineFrames % 5 !== 0) return;
    const pos = geo.attributes.position.array;
    const lineAttr = lineGeo.attributes.position;
    const arr = lineAttr.array;
    let n = 0;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 5.5) {
          const k = n * 6;
          arr[k] = pos[i * 3];
          arr[k + 1] = pos[i * 3 + 1];
          arr[k + 2] = pos[i * 3 + 2];
          arr[k + 3] = pos[j * 3];
          arr[k + 4] = pos[j * 3 + 1];
          arr[k + 5] = pos[j * 3 + 2];
          n++;
        }
      }
    }
    if (n !== lineCount) {
      lineCount = n;
      lineGeo.setDrawRange(0, n * 2);
    }
    lineAttr.needsUpdate = true;
  }
  updateLines();

  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.001;
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * 2 + i * 0.7) * 0.0008;
    }
    geo.attributes.position.needsUpdate = true;
    updateLines();
    group.rotation.y += 0.0003 + (mouseX * 0.06 - group.rotation.y) * 0.008;
    group.rotation.x += (mouseY * 0.04 - group.rotation.x) * 0.008;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ---- Magnetic Buttons ---- */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.btn[data-magnetic]').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px');
      btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px');
    });
    btn.addEventListener('mouseleave', () => {
      btn.classList.add('magnetic-return');
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
      setTimeout(() => btn.classList.remove('magnetic-return'), 500);
    });
  });
}

/* ---- Text Scramble on Section Titles ---- */
(function initScramble() {
  const titles = document.querySelectorAll('[data-scramble]');
  if (!titles.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glyphs = '!<>-_\\/[]{}=+*^?#01ABCDEF';

  titles.forEach((title) => {
    const original = title.textContent.trim();
    title.setAttribute('aria-label', original);
    title.innerHTML = original
      .split('')
      .map((c) => {
        const safeChar = c === ' ' ? ' ' : c.replace(/"/g, '&quot;');
        return '<span class="char" data-char="' + safeChar + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>';
      })
      .join('');
  });

  if (reduced) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateTitle(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  titles.forEach((t) => obs.observe(t));

  function animateTitle(title) {
    const chars = title.querySelectorAll('.char');
    const total = chars.length;
    if (!total) return;
    const duration = 850;
    const start = performance.now();

    (function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      chars.forEach((ch, i) => {
        if (progress >= i / total) {
          ch.textContent = ch.dataset.char === ' ' ? '\u00A0' : ch.dataset.char;
        } else {
          ch.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      });
      if (progress < 1) requestAnimationFrame(tick);
    })(start);
  }
})();

/* ---- Back to Top ---- */
(function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  const update = () => btn.classList.toggle('visible', window.scrollY > 600);
  update();
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', update);
  btn.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
})();

