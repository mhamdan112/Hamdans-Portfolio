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

  function animate() {
    requestAnimationFrame(animate);
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
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

/* ===== Active Nav Link ===== */
const sections = document.querySelectorAll('section[id], .hero');
const navLinks = document.querySelectorAll('.item a');

function highlightNav() {
  const scrollY = window.scrollY + 120;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach((link) => {
        link.classList.toggle('active-link', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}
highlightNav();
window.addEventListener('scroll', highlightNav);

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
