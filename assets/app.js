/* ===== Les Ateliers du Cœur — app.js ===== */
(function(){
  'use strict';

  // Menu mobile
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menuMobile');
  btn?.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
  });

  // Année courante
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Helpers router
  function setActiveNav(page){
    const links = document.querySelectorAll('nav[aria-label="Navigation principale"] a, #menuMobile a');
    links.forEach(a=>{
      const isHome = a.getAttribute('href') === '?';
      const target = new URL(a.href, location).searchParams.get('page');
      const match = page === 'home' ? isHome : (target === page);
      if(match) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }
  function updateProgress(){
    const bar = document.getElementById('progressBar');
    if(!bar) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h>0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = p + '%';
  }
  function initCarousel(){
    const root = document.getElementById('carousel-temoignages');
    if(!root) return;
    const slides = root.querySelectorAll('[data-slide]');
    let i = 0; let timer;
    const dots = root.querySelectorAll('[data-dot]');
    const show = (idx)=>{
      slides.forEach((s,k)=>{ s.classList.toggle('hidden', k!==idx); s.classList.toggle('active', k===idx); });
      dots.forEach((d,k)=>{ d.style.opacity = (k===idx? '1':'0.5'); });
    };
    const next = ()=>{ i=(i+1)%slides.length; show(i); };
    const prev = ()=>{ i=(i-1+slides.length)%slides.length; show(i); };
    root.querySelector('[data-next]')?.addEventListener('click', next);
    root.querySelector('[data-prev]')?.addEventListener('click', prev);
    dots.forEach((d,k)=> d.addEventListener('click', ()=>{ i=k; show(i); }));
    root.addEventListener('mouseenter', ()=> clearInterval(timer));
    root.addEventListener('mouseleave', ()=> timer = setInterval(next, 5000));
    show(0); timer = setInterval(next, 5000);
  }
  function closeMenu(){ if(menu && !menu.classList.contains('hidden')){ menu.classList.add('hidden'); btn?.setAttribute('aria-expanded','false'); if(btn) btn.textContent='☰'; } }
  function showHome(replace){
    const home = document.getElementById('home-root');
    const view = document.getElementById('page-root');
    home.classList.remove('hidden');
    view.classList.add('hidden');
    view.innerHTML = '';
    const url = new URL(location);
    url.searchParams.delete('page');
    replace ? history.replaceState({}, '', url) : history.pushState({}, '', url);
    closeMenu();
    setActiveNav('home');
    window.scrollTo({top:0, behavior:'smooth'});
    updateProgress();
  }
  function renderPage(page, replace){
    const tpl = document.getElementById('tpl-' + page);
    if(!tpl) return;
    const home = document.getElementById('home-root');
    const view = document.getElementById('page-root');
    home.classList.add('hidden');
    view.classList.remove('hidden');
    view.innerHTML = tpl.innerHTML;
    const url = new URL(location);
    url.searchParams.set('page', page);
    replace ? history.replaceState({page}, '', url) : history.pushState({page}, '', url);
    closeMenu();
    setActiveNav(page);
    window.scrollTo({top:0, behavior:'smooth'});
    updateProgress();
    if(page==='temoignages'){ initCarousel(); }
    if(page==='contact'){ initContactForm(); }
  }

  // Navigation par clic (pages & ancres)
  document.addEventListener('click', (e) => {
    const pageLink = e.target.closest('a[href^="?page="]');
    if(pageLink){ e.preventDefault(); const p=new URL(pageLink.href, location).searchParams.get('page'); renderPage(p, false); return; }
    const homeLink = e.target.closest('a[href="?"]');
    if(homeLink){ e.preventDefault(); showHome(false); return; }
    const hashLink = e.target.closest('a[href^="#"]');
    if(hashLink){ e.preventDefault(); const id = hashLink.getAttribute('href').slice(1); showHome(false); requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})); }
  });

  // Chargement initial
  window.addEventListener('DOMContentLoaded', () => {
    const url = new URL(location);
    const page = url.searchParams.get('page');
    if(page){ renderPage(page, true); }
    else if(location.hash){ const id = location.hash.slice(1); showHome(true); requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})); }
    else { setActiveNav('home'); }
    // Cookies banner init + barre de progression
    initCookies();
    updateProgress();
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
  });

  // Retour navigateur
  window.addEventListener('popstate', () => {
    const page = new URL(location).searchParams.get('page');
    if(page) renderPage(page, true); else showHome(true);
  });

  // --- Cookies / Consent ---
  const CONSENT_SET_KEY = 'consent.set';
  const CONSENT_STATS_KEY = 'consent.stats';

  function showCookieBanner(){ document.getElementById('cookie-banner')?.classList.remove('hidden'); }
  function hideCookieBanner(){ document.getElementById('cookie-banner')?.classList.add('hidden'); }

  function getConsent(){
    return {
      set: sessionStorage.getItem(CONSENT_SET_KEY) === 'true',
      stats: sessionStorage.getItem(CONSENT_STATS_KEY) !== 'false' // par défaut true
    };
  }
  function saveConsent({stats}){
    sessionStorage.setItem(CONSENT_SET_KEY, 'true');
    sessionStorage.setItem(CONSENT_STATS_KEY, String(!!stats));
  }

  function loadMatomo(){
    if(window._matomoLoaded) return;
    // ⚠️ Remplace MATOMO_URL et MATOMO_SITE_ID par tes valeurs
    const MATOMO_URL = 'https://matomo.example.com/';
    const MATOMO_SITE_ID = '1';
    window._paq = window._paq || [];
    _paq.push(['disableCookies']); // mode exempté (pas de cookies)
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function(){
      const u = MATOMO_URL;
      _paq.push(['setTrackerUrl', u + 'matomo.php']);
      _paq.push(['setSiteId', MATOMO_SITE_ID]);
      const d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
      g.async = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g, s);
    })();
    window._matomoLoaded = true;
  }

  function applyConsent(){
    const c = getConsent();
    const cb = document.getElementById('consentStats');
    if(cb) cb.checked = !!c.stats;
    if(c.stats){ loadMatomo(); }
  }

  function initCookies(){
    // Boutons de gestion
    document.getElementById('manageCookiesBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); const c=getConsent(); const cb=document.getElementById('consentStats'); if(cb) cb.checked=c.stats; showCookieBanner(); });
    document.getElementById('btnAcceptAll')?.addEventListener('click', ()=>{ saveConsent({stats:true}); hideCookieBanner(); applyConsent(); });
    document.getElementById('btnNecessaryOnly')?.addEventListener('click', ()=>{ saveConsent({stats:false}); hideCookieBanner(); });
    document.getElementById('btnCookieDetails')?.addEventListener('click', (e)=>{ const det=document.getElementById('cookieDetails'); const isHidden=det.classList.toggle('hidden'); e.currentTarget.setAttribute('aria-expanded', String(!isHidden)); });

    const consent = getConsent();
    if(!consent.set){ showCookieBanner(); } else { applyConsent(); }
  }

  // --- Contact form (validation + submit) ---
  const SUBMIT_MODE = 'demo'; // 'worker' plus tard
  const ENDPOINTS = { worker: '/api/contact' };

  function initContactForm(){
    const root = document.getElementById('page-root');
    const form = root?.querySelector('form[action="#"]');
    if(!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    const status = form.querySelector('#formStatus');
    const inputNom = form.querySelector('input[name="nom"]');
    const inputEmail = form.querySelector('input[name="email"]');
    const inputMsg = form.querySelector('textarea[name="message"]');
    const inputConsent = form.querySelector('input[name="consent"]');
    const honeypot = form.querySelector('input[name="website"]');
    const btn = form.querySelector('button[type="submit"]');
    const errNom = form.querySelector('#err-nom');
    const errEmail = form.querySelector('#err-email');
    const errMsg = form.querySelector('#err-message');
    const errConsent = form.querySelector('#err-consent');

    function clearStatus(){ if(!status) return; status.className = 'hidden p-3 rounded-lg text-sm ring-1'; status.textContent=''; }
    function setStatus(ok, msg){ if(!status) return; status.className = `p-3 rounded-lg text-sm ring-1 ${ok?'bg-green-50 text-green-700 ring-green-200':'bg-red-50 text-red-700 ring-red-200'}`; status.textContent = msg; }

    function setFieldError(el, errEl, msg){
      if(!el || !errEl) return;
      if(msg){
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
        el.setAttribute('aria-invalid','true');
        const id = errEl.id;
        const prev = el.getAttribute('aria-describedby')||'';
        if(!prev.includes(id)) el.setAttribute('aria-describedby', (prev+' '+id).trim());
      } else {
        errEl.textContent = '';
        errEl.classList.add('hidden');
        el.removeAttribute('aria-invalid');
        const prev = (el.getAttribute('aria-describedby')||'').split(' ').filter(Boolean).filter(x=> x!== (errEl?.id||''));
        if(prev.length) el.setAttribute('aria-describedby', prev.join(' ')); else el.removeAttribute('aria-describedby');
      }
    }

    function validate(){
      clearStatus();
      let first = null;
      if(!inputNom.value.trim()){ setFieldError(inputNom, errNom, 'Veuillez indiquer votre nom.'); first = first || inputNom; } else setFieldError(inputNom, errNom, '');
      if(!inputEmail.value.trim()){ setFieldError(inputEmail, errEmail, 'Veuillez indiquer votre e‑mail.'); first = first || inputEmail; }
      else if(!inputEmail.checkValidity()){ setFieldError(inputEmail, errEmail, 'Email invalide.'); first = first || inputEmail; }
      else setFieldError(inputEmail, errEmail, '');
      if(!inputMsg.value.trim()){ setFieldError(inputMsg, errMsg, 'Veuillez écrire un message.'); first = first || inputMsg; } else setFieldError(inputMsg, errMsg, '');
      if(!inputConsent.checked){ setFieldError(inputConsent, errConsent, 'Veuillez cocher la case de consentement.'); first = first || inputConsent; } else setFieldError(inputConsent, errConsent, '');
      return { ok: !first, first };
    }

    [inputNom, inputEmail, inputMsg].forEach(el=> el?.addEventListener('input', ()=>{
      if(el===inputEmail && el.value && el.checkValidity()) setFieldError(el, errEmail, '');
      else if(el.value.trim()) setFieldError(el, el===inputNom?errNom:errMsg, '');
    }));
    inputConsent?.addEventListener('change', ()=> setFieldError(inputConsent, errConsent, inputConsent.checked?'':'Veuillez cocher la case de consentement.'));

    function setLoading(loading){
      if(!btn) return;
      if(loading){
        btn.dataset.label = btn.textContent;
        btn.innerHTML = '<svg class="animate-spin mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" opacity=".25" stroke-width="4"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"/></svg>Envoi…';
        btn.setAttribute('disabled','true');
        btn.classList.add('opacity-70','cursor-not-allowed');
      } else {
        btn.innerHTML = btn.dataset.label || 'Envoyer';
        btn.removeAttribute('disabled');
        btn.classList.remove('opacity-70','cursor-not-allowed');
      }
    }

    async function submitData(payload){
      if(honeypot && honeypot.value){ return { ok:true, bot:true }; }
      if(SUBMIT_MODE==='worker'){
        try{
          const res = await fetch(ENDPOINTS.worker, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          return { ok: res.ok };
        } catch(e){ return { ok:false, error: e.message }; }
      } else {
        const fail = new URL(location).searchParams.get('fail')==='1';
        await new Promise(r=> setTimeout(r, 800));
        return { ok: !fail };
      }
    }

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const { ok, first } = validate();
      if(!ok){ first?.focus(); return; }
      setLoading(true);
      const result = await submitData({
        nom: inputNom.value.trim(),
        email: inputEmail.value.trim(),
        message: inputMsg.value.trim(),
        consent: inputConsent.checked
      });
      setLoading(false);
      if(result.ok){
        setStatus(true, 'Message envoyé — merci !');
        form.reset();
        [inputNom, inputEmail, inputMsg, inputConsent].forEach(el=> setFieldError(el, form.querySelector('#err-'+(el.name==='message'?'message':el.name)), ''));
        inputNom.focus();
      } else {
        setStatus(false, 'Une erreur est survenue — veuillez réessayer.');
        btn?.focus();
      }
    });
  }

})();