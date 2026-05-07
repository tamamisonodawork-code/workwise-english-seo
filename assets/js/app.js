
const STORAGE_KEY = 'workwise-final-site-state';
const defaultState = {
  xp: 1250,
  streak: 7,
  level: 8,
  reviewQueue: [
    'Would it be possible to have one more day to finish this?',
    'Hi Alex, how\'s your morning going? I wanted to check the deadline with you.',
    'Thanks. I\'ll revise it before sharing the next version.'
  ],
  notes: [
    { title: 'Asking for more time', better: 'Would it be possible to have one more day to finish this?', why: 'This sounds clear, polite, and collaborative.' }
  ],
  selectedScenario: 0,
  reminderOn: true,
  lastExport: null,
  practiced: 12
};

const scenarios = [
  {
    title: 'Ask for more time',
    category: 'Requests',
    prompt: 'Your manager asks about the project timeline. You need to request more time politely and professionally.',
    response: 'I need more time.',
    better: 'Would it be possible to have one more day to finish this? I can send the updated version by Friday morning.',
    tip: 'The better response keeps the request clear while sounding cooperative and solution-oriented.',
    tags: ['Clear', 'Polite', 'Professional', 'Collaborative']
  },
  {
    title: 'Start with a friendly opening',
    category: 'Small Talk & Openings',
    prompt: 'You need to ask a teammate about a deadline, but you do not want to sound abrupt.',
    response: 'Can you tell me the deadline?',
    better: 'Hi Alex, how\'s your morning going? I wanted to check the deadline with you.',
    tip: 'A short friendly opening can make workplace requests feel smoother.',
    tags: ['Warm', 'Natural', 'Workplace fit']
  },
  {
    title: 'Read indirect feedback',
    category: 'Indirect Feedback',
    prompt: 'Your manager says, “This is a good start.” What should you do next?',
    response: 'Great. I\'ll send it now.',
    better: 'Thanks. I\'ll revise it a bit more before I share the next version.',
    tip: 'Positive-sounding feedback can still suggest that more revision is expected.',
    tags: ['Interpretation', 'Culture', 'Professional judgment']
  }
];

function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch (e) {
    return { ...defaultState };
  }
}
let state = getState();
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function byId(id) { return document.getElementById(id); }
function setText(id, value) { const el = byId(id); if (el) el.textContent = value; }
function setHTML(id, value) { const el = byId(id); if (el) el.innerHTML = value; }
function speak(text) {
  if (!('speechSynthesis' in window)) { alert('Speech is not available in this browser.'); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.lang = 'en-US';
  window.speechSynthesis.speak(utter);
}
function selectScenario(index) { state.selectedScenario = index; saveState(); renderPage(); }
function completePractice() {
  const scenario = scenarios[state.selectedScenario];
  state.xp += 35;
  state.practiced += 1;
  if (!state.reviewQueue.includes(scenario.better)) state.reviewQueue.unshift(scenario.better);
  saveState();
  alert('Progress saved in this browser.');
  renderPage();
}
function addNote() {
  const title = byId('noteTitle')?.value?.trim();
  const better = byId('noteBetter')?.value?.trim();
  const why = byId('noteWhy')?.value?.trim();
  if (!title || !better) { alert('Please enter a title and a better response.'); return; }
  state.notes.unshift({ title, better, why: why || 'Saved note.' });
  saveState();
  if (byId('noteTitle')) byId('noteTitle').value = '';
  if (byId('noteBetter')) byId('noteBetter').value = '';
  if (byId('noteWhy')) byId('noteWhy').value = '';
  renderNotebook();
}
function exportData() {
  state.lastExport = new Date().toLocaleString();
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workwise-english-progress.json';
  a.click();
  URL.revokeObjectURL(url);
  renderSettings();
}
function importData(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = { ...defaultState, ...JSON.parse(reader.result) };
      saveState();
      location.reload();
    } catch (e) {
      alert('Could not import this file.');
    }
  };
  reader.readAsText(file);
}
function resetData() {
  if (!confirm('Reset progress saved in this browser?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaultState };
  location.reload();
}
function renderCommon() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = '2026');
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(el => {
    if (el.dataset.nav === page) el.classList.add('active');
  });
}
function renderDashboard() {
  setText('dashXp', state.xp.toLocaleString());
  setText('dashStreak', state.streak);
  setText('dashLevel', state.level);
  const s = scenarios[state.selectedScenario];
  setText('dashTitle', s.title);
  setText('dashPrompt', s.prompt);
  setHTML('dashRecommended', scenarios.map((item, idx) => `
    <div class="list-item">
      <div><strong>${item.title}</strong><br><small>${item.category}</small></div>
      <button class="btn btn-soft" onclick="selectScenario(${idx}); location.href='/practice/'">Start</button>
    </div>
  `).join(''));
}
function renderPractice() {
  const s = scenarios[state.selectedScenario];
  setText('practiceTitle', s.title);
  setText('practiceCategory', s.category);
  setText('practicePrompt', s.prompt);
  setText('practiceResponse', s.response);
  setText('practiceBetter', s.better);
  setText('practiceTip', s.tip);
  setHTML('practiceTags', s.tags.map(tag => `<span class="tag">${tag}</span>`).join(''));
  setHTML('practiceChooser', scenarios.map((item, idx) => `<button class="btn ${idx === state.selectedScenario ? 'btn-primary' : 'btn-soft'}" onclick="selectScenario(${idx})">${item.title}</button>`).join(''));
}
function renderReview() {
  setText('reviewCount', state.reviewQueue.length);
  setHTML('reviewItems', state.reviewQueue.map(item => `
    <div class="list-item">
      <div>${item}</div>
      <button class="btn btn-soft" onclick='speak(${JSON.stringify(item)})'>Listen</button>
    </div>
  `).join(''));
}
function renderProgress() {
  setText('progressXp', state.xp.toLocaleString());
  setText('progressStreak', state.streak);
  setText('progressLevel', state.level);
  setText('progressPracticed', state.practiced);
}
function renderNotebook() {
  setHTML('noteList', state.notes.map(note => `
    <div class="card pad">
      <h4>${note.title}</h4>
      <p><strong>Better:</strong> ${note.better}</p>
      <p>${note.why}</p>
    </div>
  `).join(''));
}
function renderSettings() {
  const toggle = byId('reminderToggle');
  if (toggle) toggle.checked = !!state.reminderOn;
  setText('lastExport', state.lastExport || 'No export yet');
}
function updateReminder(checked) { state.reminderOn = checked; saveState(); }
function renderPage() {
  renderCommon();
  switch (document.body.dataset.page) {
    case 'dashboard': renderDashboard(); break;
    case 'practice': renderPractice(); break;
    case 'review': renderReview(); break;
    case 'progress': renderProgress(); break;
    case 'notebook': renderNotebook(); break;
    case 'settings': renderSettings(); break;
  }
}
document.addEventListener('DOMContentLoaded', renderPage);



/* Motion polish: scroll reveal, subtle parallax, and active nav */
(function () {
  const revealTargets = [
    '.section h2',
    '.problem-card',
    '.mini-card',
    '.path-card',
    '.category',
    '.feature-box',
    '.how-card',
    '.memory-card',
    '.testimonial',
    '.final-cta',
    '.card.pad',
    '.screen-card'
  ].join(',');

  const elements = Array.from(document.querySelectorAll(revealTargets));
  if (elements.length) {
    document.body.classList.add('animate-ready');
    elements.forEach((el, index) => {
      el.classList.add('reveal-on-scroll');
      el.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    elements.forEach(el => observer.observe(el));
  }

  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', (event) => {
      if (window.innerWidth < 900) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 10;
      heroVisual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
    window.addEventListener('mouseleave', () => {
      heroVisual.style.transform = '';
    });
  }
})();



/* Image lightbox for informative LP illustrations */
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    lightboxImg.alt = '';
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lightbox]');
    if (!trigger) return;
    const img = trigger.querySelector('img');
    lightboxImg.src = trigger.dataset.lightbox;
    lightboxImg.alt = img ? img.alt : '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });
})();
