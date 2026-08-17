"use strict";

(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const WHATSAPP_NUMBER = "5511933269402";
  const STUDIO_ADDRESS = "Rua Luiz Brito de Almeida, 1126, Jardim Arco-Íris, Salto - SP";
  const GOOGLE_DESTINATION = encodeURIComponent(STUDIO_ADDRESS);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const header = $("#header");
  const nav = $("#nav");
  const menu = $("#menu");
  const serviceSelect = $("#service");
  const phoneInput = $("#phone");
  const dateInput = $("#date");
  const form = $("#bookingForm");
  const formStatus = $("#formStatus");
  const filterStatus = $("#filterStatus");
  const routeButton = $("#routeFromHere");
  const routeStatus = $("#routeStatus");
  const copyButton = $("#copyAddress");
  const backToTop = $("#backToTop");
  const whatsappButton = $(".whatsapp");
  const mobileMenu = window.matchMedia("(max-width: 860px)");

  const setStatus = (element, message = "") => { if (element) element.textContent = message; };
  const smooth = reducedMotion ? "auto" : "smooth";

  let headerScrolled;
  let backToTopVisible;
  const updateHeader = () => {
    const nextHeaderScrolled = window.scrollY > 24;
    if (nextHeaderScrolled !== headerScrolled) {
      header?.classList.toggle("scrolled", nextHeaderScrolled);
      headerScrolled = nextHeaderScrolled;
    }
    const showBackToTop = window.scrollY > 520;
    if (showBackToTop !== backToTopVisible) {
      backToTop?.classList.toggle("visible", showBackToTop);
      backToTop?.setAttribute("aria-hidden", String(!showBackToTop));
      if (backToTop) backToTop.tabIndex = showBackToTop ? 0 : -1;
      backToTopVisible = showBackToTop;
    }
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: smooth }));
  if (whatsappButton && !reducedMotion) {
    const attentionTimer = window.setTimeout(() => whatsappButton.classList.add("attention"), 6500);
    whatsappButton.addEventListener("animationend", () => whatsappButton.classList.remove("attention"));
    window.addEventListener("pagehide", () => window.clearTimeout(attentionTimer), { once: true });
  }

  const syncMenuAccessibility = () => {
    if (!nav) return;
    const closedOnMobile = mobileMenu.matches && !nav.classList.contains("open");
    nav.toggleAttribute("inert", closedOnMobile);
    nav.setAttribute("aria-hidden", String(closedOnMobile));
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!nav || !menu) return;
    const wasOpen = nav.classList.contains("open");
    nav.classList.remove("open");
    menu.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
    syncMenuAccessibility();
    if (wasOpen && restoreFocus) menu.focus({ preventScroll: true });
  };

  if (menu && nav) {
    syncMenuAccessibility();
    menu.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("menu-open", open);
      syncMenuAccessibility();
      if (open) $("a", nav)?.focus({ preventScroll: true });
    });
    $$("a", nav).forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeMenu(); return; }
      if (event.key !== "Tab" || !nav.classList.contains("open")) return;
      const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', nav)
        .filter(element => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.addEventListener("pointerdown", event => {
      if (!nav.classList.contains("open") || nav.contains(event.target) || menu.contains(event.target)) return;
      closeMenu();
    });
    const handleMenuBreakpoint = () => {
      closeMenu({ restoreFocus: false });
      syncMenuAccessibility();
    };
    if (mobileMenu.addEventListener) mobileMenu.addEventListener("change", handleMenuBreakpoint);
    else mobileMenu.addListener(handleMenuBreakpoint);
  }

  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    revealElements.forEach(element => element.classList.add("reveal-ready"));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -24px 0px" });
    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add("visible"));
  }

  const heroMedia = $(".hero-media-reveal");
  if (heroMedia && !reducedMotion) {
    heroMedia.classList.add("hero-media-ready");
    requestAnimationFrame(() => requestAnimationFrame(() => heroMedia.classList.add("visible")));
  } else {
    heroMedia?.classList.add("visible");
  }

  const filterButtons = $$(".filter");
  const cards = $$(".card[data-category]");
  const applyFilter = (category = "todos") => {
    filterButtons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    let visible = 0;
    cards.forEach(card => {
      const hide = category !== "todos" && card.dataset.category !== category;
      card.classList.toggle("hidden", hide);
      if (!hide) visible += 1;
    });
    setStatus(filterStatus, `Mostrando ${visible} procedimento${visible === 1 ? "" : "s"}.`);
  };

  filterButtons.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter || "todos")));
  $$(".quick-card[data-category-target]").forEach(button => button.addEventListener("click", () => {
    applyFilter(button.dataset.categoryTarget || "todos");
    $("#procedimentos")?.scrollIntoView({ behavior: smooth, block: "start" });
  }));

  $$(".select-service[data-service]").forEach(button => button.addEventListener("click", () => {
    if (!serviceSelect) return;
    const wanted = (button.dataset.service || "").trim();
    const option = [...serviceSelect.options].find(item => item.text.trim() === wanted);
    if (option) serviceSelect.value = option.value || option.text;
    $("#agendamento")?.scrollIntoView({ behavior: smooth, block: "start" });
    window.setTimeout(() => serviceSelect.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
  }));

  if (dateInput) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    dateInput.min = `${year}-${month}-${day}`;
  }

  const formatPhone = value => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  phoneInput?.addEventListener("input", () => { phoneInput.value = formatPhone(phoneInput.value); });

  const openExternal = (url, { fallbackToCurrentPage = true } = {}) => {
    const popup = window.open("", "_blank");
    if (popup) {
      popup.opener = null;
      popup.location.replace(url);
      return true;
    }
    if (fallbackToCurrentPage) window.location.assign(url);
    return false;
  };

  form?.addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#name")?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";
    const service = serviceSelect?.value || "";
    const chosenDate = dateInput?.value || "";
    const period = $("#period")?.value || "";
    const note = $("#message")?.value.trim() || "";
    const phoneDigits = phone.replace(/\D/g, "");

    if (!name) { setStatus(formStatus, "Digite seu nome para continuar."); $("#name")?.focus(); return; }
    if (phoneDigits.length < 10 || /^(\d)\1+$/.test(phoneDigits)) { setStatus(formStatus, "Digite um WhatsApp válido com DDD."); phoneInput?.focus(); return; }
    if (!service) { setStatus(formStatus, "Escolha o procedimento desejado."); serviceSelect?.focus(); return; }
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (chosenDate && chosenDate < todayValue) { setStatus(formStatus, "Escolha hoje ou uma data futura."); dateInput?.focus(); return; }

    const formattedDate = chosenDate ? chosenDate.split("-").reverse().join("/") : "A combinar";
    const message = [
      "Olá, Carla! Vi o site do Studiofly e gostaria de solicitar um horário. 💗",
      "",
      `Nome: ${name}`,
      `Meu WhatsApp: ${phone}`,
      `Procedimento: ${service}`,
      `Melhor dia: ${formattedDate}`,
      `Período: ${period || "A combinar"}`,
      "",
      `Observação: ${note || "Nenhuma observação."}`
    ].join("\n");

    const whatsappOpened = openExternal(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);
    if (whatsappOpened) setStatus(formStatus, "WhatsApp aberto em uma nova aba. Envie a mensagem para concluir a solicitação.");
  });

  const fallbackRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${GOOGLE_DESTINATION}&travelmode=driving`;

  routeButton?.addEventListener("click", () => {
    setStatus(routeStatus, "Tentando usar sua localização para montar a rota...");
    if (!("geolocation" in navigator)) {
      setStatus(routeStatus, "Seu navegador não disponibilizou a localização. Abrindo a rota no Google Maps.");
      const opened = openExternal(fallbackRouteUrl, { fallbackToCurrentPage: false });
      if (!opened) setStatus(routeStatus, "Não foi possível abrir uma nova aba. Use o botão “Abrir no Google Maps”.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        setStatus(routeStatus, "Localização encontrada. Abrindo sua rota...");
        const opened = openExternal(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${GOOGLE_DESTINATION}&travelmode=driving`, { fallbackToCurrentPage: false });
        if (!opened) setStatus(routeStatus, "A rota está pronta, mas a nova aba foi bloqueada. Use o botão “Abrir no Google Maps”.");
      },
      () => {
        setStatus(routeStatus, "Sem acesso à sua localização. Abrindo o Google Maps para você escolher o ponto de partida.");
        const opened = openExternal(fallbackRouteUrl, { fallbackToCurrentPage: false });
        if (!opened) setStatus(routeStatus, "Sem acesso à localização e sem permissão para abrir uma nova aba. Use o botão “Abrir no Google Maps”.");
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  });

  copyButton?.addEventListener("click", async () => {
    let temporaryTextarea;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(STUDIO_ADDRESS);
      } else {
        temporaryTextarea = document.createElement("textarea");
        temporaryTextarea.value = STUDIO_ADDRESS;
        temporaryTextarea.setAttribute("readonly", "");
        temporaryTextarea.style.position = "fixed";
        temporaryTextarea.style.opacity = "0";
        document.body.appendChild(temporaryTextarea);
        temporaryTextarea.select();
        if (!document.execCommand("copy")) throw new Error("Copy command failed");
      }
      setStatus(routeStatus, "Endereço copiado.");
    } catch {
      setStatus(routeStatus, `Não foi possível copiar automaticamente. Endereço: ${STUDIO_ADDRESS}`);
    } finally {
      temporaryTextarea?.remove();
    }
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
