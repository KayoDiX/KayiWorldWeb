const themeButton = document.querySelector('.toggle-button');
const themeIcon = document.getElementById('theme-icon');
const backToTopButton = document.getElementById('back-to-top');
const footer = document.querySelector('footer');
const header = document.querySelector('header');
const headerTitle = document.querySelector('header h1');
const headerSubtitle = document.querySelector('header p');
const miauButton = document.getElementById('miau-button');
const catLayer = document.getElementById('cat-layer');
const catLimitOverlay = document.getElementById('cat-limit-overlay');
const catLimitImage = document.getElementById('cat-limit-image');
const catLimitClose = document.getElementById('cat-limit-close');
const catLimitReopen = document.getElementById('cat-limit-reopen');

const sunIcon = '<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />';
const moonIcon = '<path d="M21.64 13.65A9 9 0 0 1 10.35 2.36 9 9 0 1 0 21.64 13.65z" />';
const THRESHOLD_IMAGE = 'assets/100-gatos.jpeg';
const THRESHOLD_IMAGE_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#7dd3fc"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg)" rx="28"/>
    <circle cx="178" cy="121" r="80" fill="rgba(255,255,255,0.12)"/>
    <circle cx="650" cy="360" r="120" fill="rgba(255,255,255,0.10)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="66" font-weight="700" fill="#ffffff">100 gatitos</text>
    <text x="50%" y="74%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#dbeafe">máximo alcanzado</text>
  </svg>
`)}`;

const cats = [];
const CAT_WIDTH = 30;
const CAT_HEIGHT = 30;
const GRID_CELL = 40;
const CAT_THRESHOLD = 100;
const BOX_FLOOR = () => footer.getBoundingClientRect().top - 10;
const BOX_CEILING = () => header.getBoundingClientRect().bottom + 10;
let dragState = null;
let catLimitDismissed = false;

if (catLimitImage) {
  catLimitImage.src = THRESHOLD_IMAGE;
  catLimitImage.onerror = () => {
    catLimitImage.src = THRESHOLD_IMAGE_FALLBACK;
  };
}

if (catLimitClose) {
  catLimitClose.addEventListener('click', () => {
    catLimitDismissed = true;
    updateCatThresholdState();
  });
}

if (catLimitReopen) {
  catLimitReopen.addEventListener('click', () => {
    if (cats.length >= CAT_THRESHOLD) {
      catLimitDismissed = false;
      updateCatThresholdState();
    }
  });
}

function updateCatThresholdState() {
  if (!catLimitOverlay || !catLimitReopen) return;

  if (cats.length >= CAT_THRESHOLD && !catLimitDismissed) {
    catLimitOverlay.classList.add('visible');
    catLimitOverlay.setAttribute('aria-hidden', 'false');
    catLimitReopen.classList.remove('visible');
    catLimitReopen.setAttribute('aria-hidden', 'true');
  } else if (cats.length < CAT_THRESHOLD) {
    catLimitDismissed = false;
    catLimitOverlay.classList.remove('visible');
    catLimitOverlay.setAttribute('aria-hidden', 'true');
    catLimitReopen.classList.remove('visible');
    catLimitReopen.setAttribute('aria-hidden', 'true');
  } else {
    catLimitOverlay.classList.remove('visible');
    catLimitOverlay.setAttribute('aria-hidden', 'true');
    catLimitReopen.classList.add('visible');
    catLimitReopen.setAttribute('aria-hidden', 'false');
  }
}

function updateThemeIcon(isDark) {
  themeIcon.innerHTML = isDark ? sunIcon : moonIcon;
}

function toggleMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

themeButton.addEventListener('click', toggleMode);

function resizeHeader() {
  const initialHeight = window.innerWidth <= 600 ? 120 : 150;
  const minimumHeight = window.innerWidth <= 600 ? 72 : 94;
  const progress = Math.min(window.scrollY / 160, 1);
  const currentHeight = Math.max(initialHeight - progress * (initialHeight - minimumHeight), minimumHeight);
  const titleScale = 1 - progress * 0.14;

  header.style.height = `${currentHeight}px`;
  headerTitle.style.fontSize = `clamp(1.35rem, ${2.8 - progress * 0.9}vw, ${2.2 - progress * 0.45}rem)`;
  headerTitle.style.transform = `scale(${titleScale})`;
  headerSubtitle.style.opacity = `${Math.max(1 - progress * 2.2, 0)}`;
  headerSubtitle.style.transform = `translateY(${progress * 10}px)`;
}

window.addEventListener('scroll', resizeHeader, { passive: true });
window.addEventListener('resize', resizeHeader);
resizeHeader();

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  updateThemeIcon(true);
}

window.addEventListener('scroll', () => {
  backToTopButton.classList.toggle('visible', window.scrollY > 500);
  keepCatsInBounds();
}, { passive: true });

backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function keepCatsInBounds() {
  const floor = BOX_FLOOR();
  const ceiling = BOX_CEILING();

  for (const piece of cats) {
    piece.x = clamp(piece.x, 10, window.innerWidth - piece.width - 10);
    piece.y = clamp(piece.y, ceiling, floor - piece.height);

    if (piece.dragging) {
      piece.el.style.left = `${piece.x}px`;
      piece.el.style.top = `${piece.y}px`;
    }
  }
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function isCatActive(piece) {
  return piece.dragging || !piece.settled || Math.abs(piece.vx) > 0.08 || Math.abs(piece.vy) > 0.08 || Math.abs(piece.angularVelocity) > 0.08;
}

function createCat() {
  const cat = document.createElement('div');
  cat.className = 'cat-fall';
  cat.textContent = '🐈';
  catLayer.appendChild(cat);

  const angle = (Math.random() - 0.5) * 90;
  const piece = {
    el: cat,
    x: Math.random() * (window.innerWidth - CAT_WIDTH - 20) + 10,
    y: -30,
    width: CAT_WIDTH,
    height: CAT_HEIGHT,
    vx: (Math.random() - 0.5) * 2.2,
    vy: 0,
    angle,
    angularVelocity: (Math.random() - 0.5) * 8,
    restAngle: angle,
    settled: false,
    lastImpulse: 0,
    damping: 0.94,
    dragging: false,
  };

  cat.addEventListener('pointerdown', (event) => {
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const rect = piece.el.getBoundingClientRect();

    piece.dragging = true;
    piece.settled = false;
    piece.vx = 0;
    piece.vy = 0;
    piece.angularVelocity *= 0.2;

    dragState = {
      piece,
      pointerX,
      pointerY,
      offsetX: pointerX - rect.left,
      offsetY: pointerY - rect.top,
      lastX: piece.x,
      lastY: piece.y,
    };

    piece.el.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  cats.push(piece);
  return piece;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyFluidCollision(a, b) {
  if (a === b) return;

  const overlap = rectsOverlap(a, b);
  if (!overlap || a.dragging || b.dragging) return;

  const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
  const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
  const overlapX = (a.width + b.width) / 2 - Math.abs(dx);
  const overlapY = (a.height + b.height) / 2 - Math.abs(dy);
  const impact = Math.abs(a.vx - b.vx) + Math.abs(a.vy - b.vy);

  const landing = a.y + a.height <= b.y + 8 && a.vy >= 0 && dy >= 0;

  if (landing && overlapY > 0) {
    a.y = b.y - a.height;
    a.vy = 0;
    a.settled = true;
    a.restAngle = a.angle + (Math.random() - 0.5) * 40;
    a.angularVelocity = 0;

    if (impact > 4) {
      b.vx += a.vx * 0.2;
      b.settled = false;
    }
    return;
  }

  if (overlapX < overlapY) {
    const push = overlapX / 2 + 2.1;
    const dir = dx >= 0 ? 1 : -1;
    a.x += dir * push;
    b.x -= dir * push;

    const impulse = Math.max(0.9, impact * 0.22);
    a.vx += dir * impulse;
    b.vx -= dir * impulse;

    if (impact > 2.6) {
      a.settled = false;
      b.settled = false;
    }
  } else {
    const push = overlapY / 2 + 2.1;
    const dir = dy >= 0 ? 1 : -1;
    a.y += dir * push;
    b.y -= dir * push;

    const impulse = Math.max(0.75, impact * 0.18);
    a.vy += dir * impulse;
    b.vy -= dir * impulse;

    if (impact > 2.6) {
      a.settled = false;
      b.settled = false;
    }
  }
}

function resolveCatPhysics(piece) {
  const floor = BOX_FLOOR();
  const ceiling = BOX_CEILING();

  if (piece.dragging) {
    const { pointerX, pointerY, offsetX, offsetY } = dragState ?? {};
    if (dragState && dragState.piece === piece && typeof pointerX === 'number' && typeof pointerY === 'number') {
      piece.x = clamp(pointerX - offsetX, 10, window.innerWidth - piece.width - 10);
      piece.y = clamp(pointerY - offsetY, ceiling, floor - piece.height);
      piece.vx = (piece.x - dragState.lastX) * 0.8;
      piece.vy = (piece.y - dragState.lastY) * 0.8;
      piece.angle += piece.vx * 0.12;
      dragState.lastX = piece.x;
      dragState.lastY = piece.y;
    }
  } else if (!piece.settled) {
    piece.vy += 0.4;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vx *= 0.996;
    piece.angle += piece.angularVelocity;
    piece.angularVelocity *= 0.985;
  } else {
    piece.vx *= 0.9;
    piece.vy *= 0.8;
    piece.angle += (piece.restAngle - piece.angle) * 0.15;
    piece.angularVelocity *= 0.8;
  }

  if (piece.x < 10) {
    piece.x = 10;
    piece.vx *= -0.6;
    piece.settled = false;
  }

  if (piece.x + piece.width > window.innerWidth - 10) {
    piece.x = window.innerWidth - piece.width - 10;
    piece.vx *= -0.6;
    piece.settled = false;
  }

  const grid = new Map();
  for (const other of cats) {
    if (other === piece) continue;
    const cellX = Math.floor(other.x / GRID_CELL);
    const cellY = Math.floor(other.y / GRID_CELL);
    const key = `${cellX}:${cellY}`;
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(other);
  }

  const cellX = Math.floor(piece.x / GRID_CELL);
  const cellY = Math.floor(piece.y / GRID_CELL);
  const checkedPairs = new Set();

  for (let gx = cellX - 1; gx <= cellX + 1; gx += 1) {
    for (let gy = cellY - 1; gy <= cellY + 1; gy += 1) {
      const key = `${gx}:${gy}`;
      const neighbors = grid.get(key);
      if (!neighbors) continue;

      for (const other of neighbors) {
        if (other === piece) continue;
        const pairKey = other === piece ? '' : `${Math.min(piece.x, other.x)}:${Math.max(piece.x, other.x)}:${Math.min(piece.y, other.y)}:${Math.max(piece.y, other.y)}`;
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);
        applyFluidCollision(piece, other);
      }
    }
  }

  if (piece.y + piece.height >= floor) {
    piece.y = floor - piece.height;
    piece.vy *= -0.18;

    if (Math.abs(piece.vy) < 0.8) {
      piece.vy = 0;
      piece.settled = true;
      piece.restAngle = piece.angle + (Math.random() - 0.5) * 36;
      piece.angularVelocity = 0;
    }
  }

  if (piece.y <= ceiling) {
    piece.y = ceiling;
    piece.vy *= -0.18;

    if (Math.abs(piece.vy) < 0.8) {
      piece.vy = 0;
      piece.settled = true;
      piece.restAngle = piece.angle + (Math.random() - 0.5) * 24;
      piece.angularVelocity = 0;
    }
  }

  if (piece.settled) {
    piece.vx *= 0.72;
    if (Math.abs(piece.vx) < 0.08 && Math.abs(piece.vy) < 0.08) {
      piece.vx = 0;
      piece.vy = 0;
      piece.angle = piece.restAngle;
      piece.angularVelocity = 0;
    }
  }

  if (!piece.dragging) {
    piece.el.style.left = `${piece.x}px`;
    piece.el.style.top = `${piece.y}px`;
  }
  piece.el.style.transform = `rotate(${piece.angle}deg)`;
}

window.addEventListener('pointermove', (event) => {
  if (!dragState) return;

  const { piece } = dragState;
  const pointerX = event.clientX;
  const pointerY = event.clientY;
  const floor = BOX_FLOOR();
  const ceiling = BOX_CEILING();

  piece.x = clamp(pointerX - dragState.offsetX, 10, window.innerWidth - piece.width - 10);
  piece.y = clamp(pointerY - dragState.offsetY, ceiling, floor - piece.height);
  piece.vx = (piece.x - dragState.lastX) * 0.8;
  piece.vy = (piece.y - dragState.lastY) * 0.8;
  piece.angle += piece.vx * 0.12;
  piece.settled = false;
  piece.restAngle = piece.angle;

  dragState.pointerX = pointerX;
  dragState.pointerY = pointerY;
  dragState.lastX = piece.x;
  dragState.lastY = piece.y;

  piece.el.style.left = `${piece.x}px`;
  piece.el.style.top = `${piece.y}px`;
  piece.el.style.transform = `rotate(${piece.angle}deg)`;
});

window.addEventListener('pointerup', () => {
  if (!dragState) return;

  const { piece } = dragState;
  piece.dragging = false;
  piece.vx *= 0.55;
  piece.vy *= 0.55;
  piece.restAngle = piece.angle;
  dragState = null;
});

window.addEventListener('pointercancel', () => {
  if (!dragState) return;

  const { piece } = dragState;
  piece.dragging = false;
  piece.vx *= 0.55;
  piece.vy *= 0.55;
  dragState = null;
});

function animateStack() {
  const activeCats = cats.length > 100 ? cats.filter(isCatActive) : cats;
  const activeSet = new Set(activeCats);

  for (const piece of activeCats) {
    resolveCatPhysics(piece);
  }

  if (cats.length > 100) {
    for (const piece of cats) {
      if (activeSet.has(piece)) continue;
      piece.vx *= 0.82;
      piece.vy *= 0.82;
      piece.angle += (piece.restAngle - piece.angle) * 0.04;
      piece.el.style.left = `${piece.x}px`;
      piece.el.style.top = `${piece.y}px`;
      piece.el.style.transform = `rotate(${piece.angle}deg)`;
    }
  }

  updateCatThresholdState();
  requestAnimationFrame(animateStack);
}

miauButton.addEventListener('click', () => {
  const piece = createCat();
  piece.el.style.left = `${piece.x}px`;
  piece.el.style.top = `${piece.y}px`;
  updateCatThresholdState();
});

requestAnimationFrame(animateStack);

const footerObserver = new IntersectionObserver(([entry]) => {
  backToTopButton.classList.toggle('near-footer', entry.isIntersecting);
}, { threshold: 0.1 });

footerObserver.observe(footer);