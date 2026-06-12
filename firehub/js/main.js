(function () {
  "use strict";

  const ROLES = [
    "Software Engineer",
    "Web & Cybersecurity Analyst",
    "Frontend Developer",
    "Problem Solver",
  ];

  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const navOverlay = document.querySelector(".nav-overlay");
  const contactForm = document.getElementById("contact-form");
  const typedRoleEl = document.getElementById("typed-role");
  const revealEls = document.querySelectorAll(".reveal");

  /* Year in footer */
  const year = String(new Date().getFullYear());
  const yearEl = document.getElementById("year");
  const yearFooterEl = document.getElementById("year-footer");
  if (yearEl) yearEl.textContent = year;
  if (yearFooterEl) yearFooterEl.textContent = year;

  /* Mobile navigation */
  function openNav() {
    sidebar.classList.add("is-open");
    navOverlay.hidden = false;
    navOverlay.classList.add("is-visible");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    sidebar.classList.remove("is-open");
    navOverlay.classList.remove("is-visible");
    navOverlay.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.style.overflow = "";
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener("click", closeNav);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeNav();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
      closeNav();
    }
  });

  /* Active nav on scroll */
  function setActiveNav() {
    const scrollPos = window.scrollY + 120;

    let current = "home";
    sections.forEach((section) => {
      if (scrollPos >= section.offsetTop) {
        current = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.dataset.section === current;
      link.classList.toggle("active", isActive);
    });
  }

  window.addEventListener("scroll", setActiveNav, { passive: true });
  setActiveNav();

  /* Scroll reveal */
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Typing effect for hero role(s) — admin can set several separated by | or || */
  function parseHeroRoles(heroRole) {
    if (heroRole == null || !String(heroRole).trim()) return [];
    return String(heroRole)
      .split(/\s*\|\|\s*|\s*\|\s*/)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  function loadHeroRolesFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem("firehub_settings") || "null");
      if (saved && saved.heroRole) {
        const parsed = parseHeroRoles(saved.heroRole);
        if (parsed.length) return parsed;
      }
    } catch (err) {
      /* ignore */
    }
    return ROLES;
  }

  if (typedRoleEl) {
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimer = null;
    let activeRoles = loadHeroRolesFromStorage();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clearTypingTimer() {
      if (typingTimer != null) {
        clearTimeout(typingTimer);
        typingTimer = null;
      }
    }

    function typeRole() {
      if (!typedRoleEl || !activeRoles.length) return;

      const current = activeRoles[roleIndex];
      const displayed = isDeleting
        ? current.slice(0, charIndex--)
        : current.slice(0, charIndex++);

      typedRoleEl.textContent = displayed;

      if (!isDeleting && charIndex === current.length + 1) {
        isDeleting = true;
        typingTimer = setTimeout(typeRole, 2000);
        return;
      }

      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % activeRoles.length;
      }

      const speed = isDeleting ? 40 : 80;
      typingTimer = setTimeout(typeRole, speed);
    }

    function startHeroTyping() {
      clearTypingTimer();
      roleIndex = 0;
      charIndex = 0;
      isDeleting = false;
      window.__firehubStaticRole = false;

      if (!activeRoles.length) {
        typedRoleEl.textContent = "";
        return;
      }

      if (prefersReducedMotion) {
        typedRoleEl.textContent = activeRoles[0];
        return;
      }

      typeRole();
    }

    window.FirehubHeroTyping = {
      parseRoles: parseHeroRoles,
      applyFromSettings(settings) {
        if (settings && settings.heroRole) {
          const parsed = parseHeroRoles(settings.heroRole);
          activeRoles = parsed.length ? parsed : ROLES;
        } else {
          activeRoles = ROLES;
        }
        startHeroTyping();
      },
      restart() {
        activeRoles = loadHeroRolesFromStorage();
        startHeroTyping();
      },
    };

    startHeroTyping();
  }

  /* Contact form validation */
  if (contactForm) {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");
    const formStatus = document.getElementById("form-status");

    function showError(input, errorEl, message) {
      input.classList.add("is-invalid");
      errorEl.textContent = message;
    }

    function clearError(input, errorEl) {
      input.classList.remove("is-invalid");
      errorEl.textContent = "";
    }

    function validateEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formStatus.textContent = "";
      formStatus.className = "form-status";

      let valid = true;

      const nameError = document.getElementById("name-error");
      const emailError = document.getElementById("email-error");
      const messageError = document.getElementById("message-error");

      clearError(nameInput, nameError);
      clearError(emailInput, emailError);
      clearError(messageInput, messageError);

      if (!nameInput.value.trim()) {
        showError(nameInput, nameError, "Please enter your name.");
        valid = false;
      }

      if (!emailInput.value.trim()) {
        showError(emailInput, emailError, "Please enter your email.");
        valid = false;
      } else if (!validateEmail(emailInput.value.trim())) {
        showError(emailInput, emailError, "Please enter a valid email.");
        valid = false;
      }

      if (!messageInput.value.trim()) {
        showError(messageInput, messageError, "Please enter a message.");
        valid = false;
      } else if (messageInput.value.trim().length < 10) {
        showError(messageInput, messageError, "Message must be at least 10 characters.");
        valid = false;
      }

      if (!valid) return;

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      function onSent() {
        formStatus.textContent = "Thanks! Your message was sent — we'll get back to you soon.";
        formStatus.classList.add("is-success");
        contactForm.reset();
        if (submitBtn) submitBtn.disabled = false;
      }

      function onFailed() {
        formStatus.textContent = "Could not send your message. Please try again or email us directly.";
        formStatus.classList.add("is-error");
        if (submitBtn) submitBtn.disabled = false;
      }

      if (typeof FirehubMessages !== "undefined") {
        FirehubMessages.submitContact(name, email, message).then(onSent).catch(onFailed);
        return;
      }

      try {
        const messages = JSON.parse(localStorage.getItem("firehub_messages") || "[]");
        messages.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          name: name,
          email: email,
          message: message,
          date: new Date().toISOString(),
          read: false,
        });
        localStorage.setItem("firehub_messages", JSON.stringify(messages));
        if (typeof FirehubSync !== "undefined") {
          FirehubSync.broadcast("messages");
        }
        onSent();
      } catch (err) {
        onFailed();
      }
    });
  }
})();
