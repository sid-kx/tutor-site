// Mobile menu toggle with proper ARIA
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!toggle || !nav) return;

  const closeNav = () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  };

  const openNav = () => {
  nav.classList.add('open');
  toggle.setAttribute('aria-expanded', 'true');
  // Delay focusing the first link slightly so the slide-down animation completes
  const firstLink = nav.querySelector('a');
  if (firstLink) setTimeout(() => firstLink.focus({ preventScroll: true }), 260);
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeNav() : openNav();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Click outside to close (don't close when clicking inside nav)
  document.addEventListener('click', (e) => {
    const isOpen = nav.classList.contains('open');
    if (!isOpen) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      closeNav();
    }
  });

  // Ensure nav visible if resized to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 861) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});
// ===== Programs & Pricing: Weekly Timeline Scheduler =====
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('slot-grid');
  if (!grid) return; // only on programs-pricing page

  const DAYS = (grid.dataset.days ? grid.dataset.days.split(',').map(s => s.trim()).filter(Boolean) : ['Mon','Tue','Wed','Fri']);
  // Start times allowed; each class = 90 minutes, latest start 6:30 PM
  const STARTS = [
    { v: '16:00', label: '4:00 PM' },
    { v: '16:30', label: '4:30 PM' },
    { v: '17:00', label: '5:00 PM' },
    { v: '17:30', label: '5:30 PM' },
    { v: '18:00', label: '6:00 PM' },
    { v: '18:30', label: '6:30 PM' }
  ];
  const priceMap = { 1: 75, 2: 125, 3: 200, 4: 275 };

  const sumDays = document.getElementById('sum-days');
  const sumHours = document.getElementById('sum-hours');
  const sumPrice = document.getElementById('sum-price');
  const selectedList = document.getElementById('selected-list');
  const proceedBtn = document.getElementById('proceed-btn');
  const limitNote = document.getElementById('limit-note');

  // Build grid: first column shows time labels
  STARTS.forEach(s => {
    const timeCell = document.createElement('div');
    timeCell.className = 'timecell';
    timeCell.textContent = s.label + ' – ' + addMinutesLabel(s.v, 90);
    grid.appendChild(timeCell);

    DAYS.forEach(day => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.day = day;
      btn.dataset.start = s.v;
      btn.dataset.label = `${day} ${s.label}–${addMinutesLabel(s.v, 90)}`;
      btn.setAttribute('aria-label', btn.dataset.label);
      btn.title = btn.dataset.label;
      btn.textContent = 'Select';
      grid.appendChild(btn);
    });
  });

  // Track selected: only ONE per day; max 4 days/week
  const selectedByDay = new Map();

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn) return;

    const day = btn.dataset.day;
    const start = btn.dataset.start;

    // Toggle logic: if already selected this exact slot, unselect; else set it
    const currently = selectedByDay.get(day);
    const isSame = currently && currently.start === start;

    if (isSame) {
      selectedByDay.delete(day);
    } else {
      // Enforce max 4 days
      if (!selectedByDay.has(day) && selectedByDay.size >= 4) {
        showLimit('You can choose up to 4 days per week.');
        return;
      }
      selectedByDay.set(day, { start, label: btn.dataset.label });
    }
    updateButtons();
    updateSummary();
  });

  function updateButtons() {
    // Reset all
    grid.querySelectorAll('.slot').forEach(b => b.setAttribute('aria-pressed','false'));
    // Mark selected
    selectedByDay.forEach((val, day) => {
      grid.querySelectorAll(`.slot[data-day="${day}"]`).forEach(b => {
        if (b.dataset.start === val.start) b.setAttribute('aria-pressed','true');
      });
    });
  }

  function updateSummary() {
    const days = selectedByDay.size;
    const hours = days * 1.5 * 4; // 4 weeks rough
    const price = priceMap[Math.min(days, 4)] || 0;

    sumDays.textContent = String(days);
    sumHours.textContent = hours ? String(hours) : '0';
    sumPrice.textContent = price ? `$${price}` : '$0';

    // Chips list
    selectedList.innerHTML = '';
    Array.from(selectedByDay.entries())
      .sort((a,b)=> DAYS.indexOf(a[0]) - DAYS.indexOf(b[0]))
      .forEach(([_, v]) => {
        const li = document.createElement('li');
        li.textContent = v.label;
        selectedList.appendChild(li);
      });

    // Proceed button
    if (days >= 1 && days <= 4) {
      const qs = new URLSearchParams({
        plan_days_per_week: String(days),
        monthly_price: price ? `$${price}` : '0',
        monthly_hours: String(hours),
        slots: Array.from(selectedByDay.values()).map(v => v.label).join(', ')
      }).toString();
      proceedBtn.href = `contact-enroll.html?${qs}`;
      proceedBtn.classList.remove('disabled');
      proceedBtn.setAttribute('aria-disabled','false');
    } else {
      proceedBtn.href = 'contact-enroll.html';
      proceedBtn.classList.add('disabled');
      proceedBtn.setAttribute('aria-disabled','true');
    }
  }

  function showLimit(msg) {
    limitNote.textContent = msg;
    setTimeout(()=> limitNote.textContent = '', 2600);
  }

  function addMinutesLabel(start, minutes) {
    const [h,m] = start.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + minutes, 0, 0);
    let hr = d.getHours(), min = String(d.getMinutes()).padStart(2,'0');
    const suf = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return `${hr}:${min} ${suf}`;
  }

  updateSummary();
});
// ===============================
// Worksheets page JS (wks-*)
// ===============================
(function(){
  const page = document.querySelector('[data-page="worksheets"]');
  if (!page) return; // run only on worksheets page

  // --- Data: placeholder packs per grade (3 each). Replace pdf/thumb paths later. ---
  const WKS_DATA = {
    1: [
      { title: 'Grade 1 Math Basics', topics: ['Number Bonds','Add/Sub ≤ 20','Time & Money'], pdf: 'assets/pdfs/grade-1-math-basics.pdf', thumb: 'assets/img/placeholders/grade-1.jpg' },
      { title: 'Grade 1 Literacy Pack', topics: ['Sight Words','Phonics','Reading'], pdf: 'assets/pdfs/grade-1-literacy.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 1 Science Mini', topics: ['Senses','Plants','Weather'], pdf: 'assets/pdfs/grade-1-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    2: [
      { title: 'Grade 2 Math Skills', topics: ['Place Value','Add/Sub ≤ 100','Measurement'], pdf: 'assets/pdfs/grade-2-math.pdf', thumb: 'assets/img/placeholders/grade-2.jpg' },
      { title: 'Grade 2 Literacy Pack', topics: ['Reading Comp.','Sentences','Spelling'], pdf: 'assets/pdfs/grade-2-literacy.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 2 Science Mini', topics: ['Habitats','Materials','Energy'], pdf: 'assets/pdfs/grade-2-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    3: [
      { title: 'Grade 3 Math Basics', topics: ['Multiplication','Fractions','Area'], pdf: 'assets/pdfs/grade-3-math-basics.pdf', thumb: 'assets/img/placeholders/grade-3.jpg' },
      { title: 'Grade 3 Reading', topics: ['Main Idea','Inference','Vocabulary'], pdf: 'assets/pdfs/grade-3-reading.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 3 Science', topics: ['Forces','Life Systems','Earth'], pdf: 'assets/pdfs/grade-3-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    4: [
      { title: 'Grade 4 Fractions & Decimals', topics: ['Equivalent Fractions','Tenths/Hundredths','Compare'], pdf: 'assets/pdfs/grade-4-fractions.pdf', thumb: 'assets/img/placeholders/grade-4.jpg' },
      { title: 'Grade 4 Writing', topics: ['Paragraphs','Organization','Editing'], pdf: 'assets/pdfs/grade-4-writing.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 4 Science', topics: ['Light & Sound','Pulleys','Habitats'], pdf: 'assets/pdfs/grade-4-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    5: [
      { title: 'Grade 5 Math Skills', topics: ['Long Division','Decimals','Volume'], pdf: 'assets/pdfs/grade-5-math.pdf', thumb: 'assets/img/placeholders/grade-5.jpg' },
      { title: 'Grade 5 Reading', topics: ['Text Features','Inference','Summary'], pdf: 'assets/pdfs/grade-5-reading.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 5 Science', topics: ['Human Body','Matter','Energy'], pdf: 'assets/pdfs/grade-5-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    6: [
      { title: 'Grade 6 Math Focus', topics: ['Ratios','Percent','Geometry'], pdf: 'assets/pdfs/grade-6-math.pdf', thumb: 'assets/img/placeholders/grade-6.jpg' },
      { title: 'Grade 6 Writing', topics: ['Essay Structure','Evidence','Revision'], pdf: 'assets/pdfs/grade-6-writing.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 6 Science', topics: ['Flight','Space','Electricity'], pdf: 'assets/pdfs/grade-6-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    7: [
      { title: 'Grade 7 Pre‑Algebra', topics: ['Expressions','Equations','Rates'], pdf: 'assets/pdfs/grade-7-prealgebra.pdf', thumb: 'assets/img/placeholders/grade-7.jpg' },
      { title: 'Grade 7 Reading', topics: ['Claims & Evidence','Tone','Synthesis'], pdf: 'assets/pdfs/grade-7-reading.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 7 Science', topics: ['Interconnected Systems','Heat','Chemistry'], pdf: 'assets/pdfs/grade-7-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ],
    8: [
      { title: 'Grade 8 Algebra Readiness', topics: ['Linear Relations','Pythagorean','Functions'], pdf: 'assets/pdfs/grade-8-algebra.pdf', thumb: 'assets/img/placeholders/grade-8.jpg' },
      { title: 'Grade 8 Writing', topics: ['Argument','Counterclaim','Citations'], pdf: 'assets/pdfs/grade-8-writing.pdf', thumb: 'assets/img/placeholders/literacy.jpg' },
      { title: 'Grade 8 Science', topics: ['Cells','Fluids','Climate'], pdf: 'assets/pdfs/grade-8-science.pdf', thumb: 'assets/img/placeholders/science.jpg' }
    ]
  };

  // ----------------------------
  // Tabs + Carousel
  // ----------------------------
  function initWorksheetsTabs(){
    const tabs = Array.from(document.querySelectorAll('.wks-tab'));
    const carouselTrack = document.getElementById('wks-carousel-track');
    const dotsWrap = document.getElementById('wks-dots');
    let currentGrade = 1;
    let index = 0;

    function renderSlides(grade){
      const packs = WKS_DATA[grade] || [];
      carouselTrack.innerHTML = '';
      packs.forEach((p, i) => {
        const art = document.createElement('article');
        art.className = 'wks-slide';
        art.setAttribute('data-index', String(i));
        art.innerHTML = `
          <img src="${p.thumb}" alt="Thumbnail for ${p.title}" loading="lazy" decoding="async" />
          <h3>${p.title}</h3>
          <ul class="wks-topics" role="list">${p.topics.map(t=>`<li>${t}</li>`).join('')}</ul>
          <div class="wks-actions">
            <button class="btn btn-primary wks-view" data-pdf="${p.pdf}">View PDF</button>
            <a class="btn btn-outline" href="${p.pdf}" download>Download</a>
          </div>`;
        carouselTrack.appendChild(art);
      });
      // Dots
      dotsWrap.innerHTML = '';
      packs.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'wks-dot';
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
        d.addEventListener('click', ()=> { index = i; updateCarousel(); });
        dotsWrap.appendChild(d);
      });
      updateCarousel();
    }

    function updateCarousel(){
      const slides = Array.from(carouselTrack.children);
      slides.forEach((el, i) => { el.style.display = i === index ? 'grid' : 'none'; });
      const dots = Array.from(dotsWrap.children);
      dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    }

    function setGrade(grade){
      currentGrade = grade; index = 0; renderSlides(grade);
      tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.grade == grade ? 'true':'false'));
      // Move focus to the first slide for SR users
      const firstSlide = carouselTrack.querySelector('.wks-slide');
      if (firstSlide) firstSlide.setAttribute('tabindex', '-1'), firstSlide.focus({preventScroll:true});
    }

    document.querySelector('.wks-prev')?.addEventListener('click', ()=>{
      const len = (WKS_DATA[currentGrade]||[]).length; if (!len) return;
      index = (index - 1 + len) % len; updateCarousel();
    });
    document.querySelector('.wks-next')?.addEventListener('click', ()=>{
      const len = (WKS_DATA[currentGrade]||[]).length; if (!len) return;
      index = (index + 1) % len; updateCarousel();
    });
    // Keyboard control on carousel
    document.getElementById('wks-carousel')?.addEventListener('keydown', (e)=>{
      if (e.key === 'ArrowLeft') { e.preventDefault(); document.querySelector('.wks-prev').click(); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); document.querySelector('.wks-next').click(); }
    });

    // Tabs interactions & keyboard roving
    tabs.forEach(t => {
      t.addEventListener('click', ()=> setGrade(Number(t.dataset.grade)));
      t.addEventListener('keydown', (e)=>{
        const i = tabs.indexOf(t);
        if (e.key === 'ArrowRight') { e.preventDefault(); (tabs[i+1]||tabs[0]).focus(); (tabs[i+1]||tabs[0]).click(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); (tabs[i-1]||tabs[tabs.length-1]).focus(); (tabs[i-1]||tabs[tabs.length-1]).click(); }
      });
    });

    setGrade(1);
  }

  // ----------------------------
  // PDF Modal (lazy embed)
  // ----------------------------
  function initPdfModal(){
    const modal = document.getElementById('wks-pdf-modal');
    const holder = document.getElementById('wks-pdf-holder');
    const dl = document.getElementById('wks-modal-download');
    if (!modal || !holder || !dl) return;

    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.wks-view');
      if (!btn) return;
      const pdf = btn.getAttribute('data-pdf');
      // Lazy-embed PDF when opening
      holder.innerHTML = `<object data="${pdf}#view=FitH" type="application/pdf" aria-label="PDF preview"><p>Your browser can’t display PDFs. <a href="${pdf}" download>Download PDF</a>.</p></object>`;
      dl.href = pdf;
      if (typeof modal.showModal === 'function') { modal.showModal(); } else { window.open(pdf, '_blank'); }
    });
    modal.addEventListener('close', ()=> { holder.innerHTML = ''; });
    modal.querySelector('.wks-modal-close')?.addEventListener('click', ()=> modal.close());
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && modal.open) modal.close(); });
  }

  // ----------------------------
  // FAQ Accordions (single-open)
  // ----------------------------
  function initFaqAccordions(){
    const items = Array.from(document.querySelectorAll('.wks-faq-item'));
    items.forEach(item => {
      const btn = item.querySelector('.wks-faq-q');
      const panel = item.querySelector('.wks-faq-a');
      if (!btn || !panel) return;
      btn.addEventListener('click', ()=> toggle(item));
      btn.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item); } });
    });
    function toggle(active){
      items.forEach(it => {
        const b = it.querySelector('.wks-faq-q');
        const p = it.querySelector('.wks-faq-a');
        if (!b || !p) return;
        const open = it === active && b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        p.style.maxHeight = open ? p.scrollHeight + 'px' : 0;
      });
    }
  }

  // Init all modules
  initWorksheetsTabs();
  initPdfModal();
  initFaqAccordions();
})();
// ===== Chat widget =====
(function initChatWidget(){
  const openers = [
    document.getElementById('ask-chat-open'),
    document.getElementById('chat-launcher')
  ].filter(Boolean);
  const widget = document.getElementById('chat-widget');
  if (!widget) return;

  const panel = widget.querySelector('.chat-panel');
  const body  = widget.querySelector('#chat-body');
  const closeBtn = widget.querySelector('.chat-close');
  const form  = widget.querySelector('#chat-form');
  const input = widget.querySelector('#chat-input');
  const emailBtn = widget.querySelector('#chat-email');

  // basic message helpers
  const addMsg = (text, who='bot') => {
    const div = document.createElement('div');
    div.className = `chat-msg ${who}`;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  };

  const open = () => {
    widget.classList.add('open');
    widget.setAttribute('aria-hidden', 'false');
    if (!body.dataset.init){
      addMsg('Hi! 👋 Ask anything about programs, schedules, pricing, or worksheets.');
      addMsg('Classes run Mon–Fri, 4–8 PM (1.5h). 2 days/week is our most popular at $125/mo.');
      body.dataset.init = '1';
    }
    setTimeout(()=>input.focus(), 0);
  };
  const close = () => {
    widget.classList.remove('open');
    widget.setAttribute('aria-hidden', 'true');
  };

  openers.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); open(); }));
  closeBtn.addEventListener('click', close);
  widget.addEventListener('click', (e)=>{ if(e.target === widget) close(); });
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });

  // Tiny FAQ-style “AI” (simple keyword matcher for now)
  const rules = [
    { re: /(price|cost|plan|fee|tuition)/i, a: 'Plans: 1 day $75, 2 days $125 (≈12h/mo), 3 days $200, 4 days $275.' },
    { re: /(time|schedule|slot|when)/i,       a: 'We run Mon–Fri between 4:00–8:00 PM. Each class is 1.5 hours.' },
    { re: /(oct|teacher|certif)/i,            a: 'Yes—classes are led by an OCT-certified teacher (Ontario-certified).' },
    { re: /(worksheet|homework|pack)/i,       a: 'Canadian curriculum worksheets; usually 1–2 short homework sheets per week.' },
    { re: /(contact|enroll|register)/i,       a: 'You can register via the Contact / Enroll button in the top-right. Happy to help here too!' }
  ];

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    addMsg(text, 'me');
    input.value = '';

    const hit = rules.find(r => r.re.test(text));
    const reply = hit ? hit.a :
      "Thanks! We'll reply here, and you can also email us at homeschooltutor.com@gmail.com for detailed questions.";
    setTimeout(()=>addMsg(reply,'bot'), 200);
  });

  // Email transcript → opens their email app with the conversation
  emailBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const lines = [...body.querySelectorAll('.chat-msg')].map(el=>{
      const who = el.classList.contains('me') ? 'Parent' : 'Tutor';
      return `${who}: ${el.textContent}`;
    }).join('\n');
    const subject = encodeURIComponent('Home School Tutor – Chat question');
    const mailBody = encodeURIComponent(lines + '\n\n(Reply to this email to continue.)');
    window.location.href = `mailto:homeschooltutor.com@gmail.com?subject=${subject}&body=${mailBody}`;
  });
})();
/* ===========================================================
   REGISTRATION FLOW (Programs ➜ Register ➜ back with toast)
   =========================================================== */

/* A) Programs page: Proceed button saves selected slots */
(function () {
  const proceed = document.getElementById('proceed-btn');
  if (!proceed) return;

  // canonical time rows the grid uses (6 rows)
  const TIMES = [
    ['16:00','17:30'], ['16:30','18:00'], ['17:00','18:30'],
    ['17:30','19:00'], ['18:00','19:30'], ['18:30','20:00']
  ];

  // Get desired days for this grid (default to Mon/Tue/Wed/Fri)
  function getDays(grid) {
    return (grid && grid.dataset.days)
      ? grid.dataset.days.split(',')
      : ['Mon','Tue','Wed','Fri'];
  }

  // Ensure every .slot has data-day/start/end mapped correctly
  // and drop any overflow columns beyond the days list (e.g., a stray Thu)
  function ensureSlotData() {
    const grid = document.querySelector('.slot-grid');
    if (!grid) return;

    const days = getDays(grid);             // e.g., ["Mon","Tue","Wed","Fri"]
    const buttons = Array.from(grid.querySelectorAll('button.slot'));

    // How many buttons per row do we *actually* have right now?
    const rows = TIMES.length;              // 6
    const total = buttons.length;
    const perRow = Math.max(1, Math.floor(total / rows)); // what the DOM rendered

    buttons.forEach((btn, i) => {
      const col = i % perRow;               // real column index in DOM
      const row = Math.floor(i / perRow);   // 0..5

      // If DOM has more columns than our days (e.g., a 5th "Thu"), remove extras
      if (col >= days.length) {
        btn.remove();                       // drop overflow column cells
        return;
      }

      // Map to our target day/time model
      btn.dataset.day   ||= days[col];
      btn.dataset.start ||= TIMES[row][0];
      btn.dataset.end   ||= TIMES[row][1];

      if (!btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', 'false');
    });
  }

  ensureSlotData();

  proceed.addEventListener('click', (e) => {
    e.preventDefault();
    ensureSlotData();

    const picked = [...document.querySelectorAll('.slot[aria-pressed="true"]')].map(el => ({
      day: el.dataset.day, start: el.dataset.start, end: el.dataset.end
    }));
    if (!picked.length) { alert('Please select at least one time slot.'); return; }

    const uniqueDays = [...new Set(picked.map(s => s.day))].length;
    const hoursPerMonth = picked.length * 1.5 * 4;
    const priceMap = { 1: 75, 2: 125, 3: 200, 4: 275 };
    const price = priceMap[uniqueDays] || 0;

    sessionStorage.setItem('hstSelectedSlots', JSON.stringify(picked));
    sessionStorage.setItem('hstDays', String(uniqueDays));
    sessionStorage.setItem('hstHours', String(hoursPerMonth));
    sessionStorage.setItem('hstPrice', String(price));

    window.location.href = 'register.html';
  });
})();

/* B) Registration page: build grid, restore choices, fill summary + form */
(function initRegistration() {
  const page = document.querySelector('[data-page="register"]');
  if (!page) return;

  const times = [
    ['16:00','17:30'], ['16:30','18:00'], ['17:00','18:30'],
    ['17:30','19:00'], ['18:00','19:30'], ['18:30','20:00']
  ];
  // Registration also uses 4 days (no Thu)
  const days = ['Mon', 'Tue', 'Wed', 'Fri'];

  const grid = document.getElementById('reg-slot-grid');

  // build rows
  const fmt = (s) => { const [h, m] = s.split(':').map(Number); const pm = h >= 12; const hh = ((h + 11) % 12) + 1; return `${hh}:${m.toString().padStart(2,'0')} ${pm ? 'PM' : 'AM'}`; };
  times.forEach(([start, end]) => {
    const row = document.createElement('div'); row.style.display = 'contents';

    const tc = document.createElement('div'); tc.className = 'timecell'; tc.textContent = `${fmt(start)} – ${fmt(end)}`; row.appendChild(tc);

    days.forEach(d => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'slot'; btn.textContent = 'Select';
      btn.dataset.day = d; btn.dataset.start = start; btn.dataset.end = end;
      btn.setAttribute('aria-pressed', 'false');
      row.appendChild(btn);
    });

    grid.appendChild(row);
  });

  // restore
  const stored = JSON.parse(sessionStorage.getItem('hstSelectedSlots') || '[]');
  stored.forEach(p => {
    const el = grid.querySelector(`.slot[data-day="${p.day}"][data-start="${p.start}"][data-end="${p.end}"]`);
    if (el) el.setAttribute('aria-pressed', 'true');
  });

  // Enforce: max 4 unique days; only one time per day (replace if new time on same day)
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.slot');
    if (!b) return;

    const day = b.dataset.day;
    const isPressed = b.getAttribute('aria-pressed') === 'true';

    // 1) Toggle OFF if this exact slot was already selected
    if (isPressed) {
      b.setAttribute('aria-pressed', 'false');
      updateSummary();
      return;
    }

    // 2) If this day already has a selected time, replace it
    const sameDaySelected = grid.querySelectorAll(`.slot[aria-pressed="true"][data-day="${day}"]`);
    if (sameDaySelected.length) {
      sameDaySelected.forEach(el => el.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      updateSummary();
      return;
    }

    // 3) New day selection: enforce 4-day limit
    const selectedDaysCount = new Set(
      [...grid.querySelectorAll('.slot[aria-pressed="true"]')].map(el => el.dataset.day)
    ).size;

    if (selectedDaysCount >= 4) {
      alert('Limit reached: you can choose up to 4 days per week.');
      return;
    }

    // 4) OK to select
    b.setAttribute('aria-pressed', 'true');
    updateSummary();
  });

  const outDays = document.getElementById('reg-days');
  const outHours = document.getElementById('reg-hours');
  const outPrice = document.getElementById('reg-price');
  const outList = document.getElementById('reg-list');

  const hidSlots = document.getElementById('reg-slots-hidden');
  const hidDays = document.getElementById('reg-days-hidden');
  const hidHours = document.getElementById('reg-hours-hidden');
  const hidPrice = document.getElementById('reg-price-hidden');

  function updateSummary() {
    const selected = [...grid.querySelectorAll('.slot[aria-pressed="true"]')].map(el => ({
      day: el.dataset.day, start: el.dataset.start, end: el.dataset.end
    }));

    const uniqueDays = [...new Set(selected.map(s => s.day))].length;
    const hoursPerMonth = selected.length * 1.5 * 4;
    const priceMap = { 1: 75, 2: 125, 3: 200, 4: 275 };
    const price = priceMap[uniqueDays] || 0;

    sessionStorage.setItem('hstSelectedSlots', JSON.stringify(selected));
    sessionStorage.setItem('hstDays', String(uniqueDays));
    sessionStorage.setItem('hstHours', String(hoursPerMonth));
    sessionStorage.setItem('hstPrice', String(price));

    outDays.textContent = uniqueDays;
    outHours.textContent = hoursPerMonth;
    outPrice.textContent = `$${price}`;
    outList.innerHTML = selected.length
      ? selected.map(s => `<li>${s.day} ${s.start}–${s.end}</li>`).join('')
      : '<li>No time selected yet.</li>';

    // hidden fields for email
    hidSlots.value = selected.map(s => `${s.day} ${s.start}-${s.end}`).join(', ');
    hidDays.value = String(uniqueDays);
    hidHours.value = String(hoursPerMonth);
    hidPrice.value = `$${price}`;
  }
  updateSummary();

  // before submit: ensure selection + set correct _next URL
  const form = document.getElementById('reg-form');
  form.addEventListener('submit', (e) => {
    if (!hidSlots.value.trim()) { e.preventDefault(); alert('Please select at least one time slot.'); return; }
    const next = form.querySelector('input[name="_next"]');
    next.value = new URL('programs-pricing.html?toast=sent#scheduler', location.href).toString();
  });
})();

/* C) Programs page: show 3s toast after email redirect */
(function () {
  if (!/programs-pricing\.html/i.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('toast') !== 'sent') return;
  const el = document.createElement('div');
  el.id = 'hst-toast';
  el.textContent = 'Your information has been emailed to homeschooltutor.com@gmail.com. We’ll reach back in 1–2 business days.';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
})();
/* ===========================
   Worksheets: locked thumbnails
   =========================== */
(function lockWorksheetThumbs(){
  const page = document.querySelector('[data-page="worksheets"]');
  if (!page) return;

  const LOCK_SRC = 'assets/img/pdf-locked.png';

  function apply(root = page){
    root.querySelectorAll(
      '.wks-carousel img, .wks-slide img, .wks-thumb img, img[data-role="wks-thumb"]'
    ).forEach(img => {
      // If src is empty, broken, or we want to force locked thumbnail, set it:
      img.src = LOCK_SRC;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (!img.alt || /thumbnail/i.test(img.alt)) {
        img.alt = 'Locked PDF thumbnail';
      }
    });
  }

  // Initial pass (for static markup)
  apply();

  // Catch slides added later (if your carousel builds them in JS)
  new MutationObserver(list => {
    for (const m of list) {
      m.addedNodes.forEach(n => {
        if (n.nodeType === 1) apply(n);
      });
    }
  }).observe(page, { childList: true, subtree: true });
})();
/* =======================================================
   Contact / Enroll page
   - Reads the saved scheduler choices from localStorage
   - Renders the selected times list
   - Prefills hidden fields so the email includes the plan
   - Shows a simple toast when ?toast=sent is present
   ======================================================= */

function initContactEnroll() {
  const form  = document.getElementById('ce-form');
  const listEl = document.getElementById('ce-slots');
  if (!form || !listEl) return; // Not on this page

  // Read values written by the Programs/Scheduler page
  let slots = [];
  try { slots = JSON.parse(localStorage.getItem('hst_selectedSlots') || '[]'); } catch (_) {}
  const days  = localStorage.getItem('hst_daysPerWeek')   || '';
  const hours = localStorage.getItem('hst_hoursPerMonth') || '';
  const price = localStorage.getItem('hst_pricePerMonth') || '';

  // Normalize slot text for display + email
  const toText = s => (typeof s === 'string')
    ? s
    : `${s.day ?? ''} ${s.label ?? s.time ?? ''}`.trim();

  // Render list of selected times
  listEl.innerHTML = slots.length
    ? slots.map(s => `<li class="slot-pill">${toText(s)}</li>`).join('')
    : '<li class="muted">No times selected yet.</li>';

  // Push the same values into hidden inputs for the email payload
  const hiddenMap = {
    'ce-slots-hidden': slots.map(toText).join(', '),
    'ce-days-hidden' : days,
    'ce-hours-hidden': hours,
    'ce-price-hidden': price
  };
  Object.entries(hiddenMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

// Run after DOM is ready (script is deferred, but this is safe)
document.addEventListener('DOMContentLoaded', initContactEnroll);

/* Optional: show a small toast if redirected with ?toast=sent
   (used after successful FormSubmit _next=...&toast=sent) */
(function showQueryToast(){
  const qp = new URLSearchParams(location.search);
  const toast = qp.get('toast');
  if (!toast) return;

  let message = '';
  if (toast === 'sent') {
    message = 'Your information was sent. We will contact you in 1–2 business days.';
  } else {
    message = toast;
  }

  const t = document.createElement('div');
  t.setAttribute('role','status');
  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.bottom = '24px';
  t.style.transform = 'translateX(-50%)';
  t.style.padding = '12px 16px';
  t.style.borderRadius = '12px';
  t.style.background = 'rgba(255,255,255,.85)';
  t.style.backdropFilter = 'blur(12px)';
  t.style.boxShadow = '0 8px 24px rgba(25,69,154,.15)';
  t.style.color = '#0f1b2d';
  t.style.zIndex = '1000';
  t.textContent = message;

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
})();
/* ===========================
   Scroll-reactive background
   =========================== */
(function initScrollBackground(){
  // Ensure CSS for background layers exists even if stylesheet wasn't updated
  if (!document.getElementById('hst-bg-style')) {
    const css = `
    :root{
      /* even stronger defaults so the image shows more detail immediately */
      --bg-drop-opacity: 0.22;
      --bg-drop-blur: 36px;
      --bg-overlay: rgba(255,255,255,0.9);
    }
    body::before, body::after{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:-2;
    }
    body::before{
      background-image:url("assets/img/bg-droplets.jpg");
      background-size:cover;
      background-position:center;
      background-repeat:no-repeat;
      background-attachment:fixed;
      opacity:var(--bg-drop-opacity);
      filter:blur(var(--bg-drop-blur));
      transform:scale(1.03);
      will-change:opacity,filter,transform;
    }
    body::after{
      z-index:-1;
      background:var(--bg-overlay);
      transition:background 200ms linear;
    }
    @media (prefers-reduced-motion: reduce){
      body::before{ filter: blur(14px); }
    }`;
    const styleEl = document.createElement('style');
    styleEl.id = 'hst-bg-style';
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);
  }

  // Guard – run once
  if (window.__hstBgInit) return;
  window.__hstBgInit = true;

  const docEl = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lerp(a, b, t){ return a + (b - a) * t; }
  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  // Update CSS vars from scroll progress
  let ticking = false;
  function update(){
    ticking = false;

    const max = (docEl.scrollHeight - window.innerHeight) || 1;
    const p = clamp01(window.scrollY / max);   // 0 at top → 1 at bottom

  // Visibility: make the droplets much stronger as you scroll
  // start subtle but increase to a much higher opacity so the texture is obvious
  // Make the droplets fully visible as you scroll (show all detail at bottom)
  const opacity = lerp(0.22, 1.00, p);
  // Blur: start heavier and go to completely sharp (0px) at the bottom
  const blurPx  = prefersReduced ? 14 : lerp(36, 0, p);
  // Overlay: fade the opaque white overlay into a nearly-transparent pastel
  // Compute RGB blend between white and a light brand blue, and reduce alpha as you scroll
  const start = { r: 255, g: 255, b: 255 };        // white
  const end   = { r: 234, g: 243, b: 255 };        // #eaf3ff
  const r = Math.round(lerp(start.r, end.r, p));
  const g = Math.round(lerp(start.g, end.g, p));
  const b = Math.round(lerp(start.b, end.b, p));
  const alpha = lerp(0.9, 0.0, p);
  const overlay = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;

  document.documentElement.style.setProperty('--bg-drop-opacity', opacity.toFixed(3));
  document.documentElement.style.setProperty('--bg-drop-blur', `${blurPx.toFixed(1)}px`);
  document.documentElement.style.setProperty('--bg-overlay', overlay);
  }

  function onScroll(){
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  // Init + listeners
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();
/* Contact/Enroll: redirect back with toast after email */
(function () {
  // find the contact/enroll form
  const form = document.getElementById('ce-form') 
            || document.querySelector('form[data-form="contact-enroll"]');
  if (form) {
    form.addEventListener('submit', () => {
      // compute redirect back to this page with a toast flag
      const nextInput = form.querySelector('input[name="_next"]');
      const backUrl = new URL('contact-enroll.html?toast=sent#top', location.href).toString();
      if (nextInput) nextInput.value = backUrl;
    });
  }

  // when redirected back, show the toast for 5s
  const onContactPage = /contact-enroll\.html/i.test(location.pathname);
  const toastWanted = new URLSearchParams(location.search).get('toast') === 'sent';
  if (onContactPage && toastWanted) {
    const el = document.createElement('div');
    el.id = 'hst-toast';
    el.textContent =
      'Your information has been emailed to homeschooltutor.com@gmail.com. We’ll reach back in 1–2 business days.';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000); // 5 seconds
    // optional: clean ?toast=sent from the address bar
    try { history.replaceState({}, '', location.pathname + location.hash); } catch {}
  }
})();
// Fallback avatar for any missing/broken testimonial images
(function () {
  const fallback = 'assets/img/avatar-default.png';
  document.querySelectorAll('img.t-avatar').forEach((img) => {
    // If no src set, assign immediately
    if (!img.getAttribute('src')) img.src = fallback;

    // If the src fails to load (typo, moved file), swap to fallback
    img.addEventListener('error', () => {
      img.src = fallback;
    });
  });
})();