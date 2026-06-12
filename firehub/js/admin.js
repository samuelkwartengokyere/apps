(function () {
  "use strict";

  var STORAGE = {
    auth: "firehub_admin_session",
    settings: "firehub_settings",
    projects: "firehub_projects",
    experiences: "firehub_experiences",
    messages: "firehub_messages",
    email: "firehub_admin_email",
    password: "firehub_admin_password",
  };

  var DEFAULT_LOGIN = "samfine278@gmail.com";

  var DEFAULT_SETTINGS = {
    heroName: "Samuel",
    heroRole:
      "Software Engineer | Web & Cybersecurity Analyst | Frontend Developer",
    heroDescription:
      "Results-driven software engineer focused on secure, responsive web applications, cloud-ready delivery, and intelligent systems that solve real-world problems.",
    aboutHeading: "About Me",
    aboutLead:
      "I'm Samuel Kwarteng Okyere — a software engineer with experience in front-end development, cloud computing, and cybersecurity.",
    aboutBody1:
      "I currently work as a Web & Cybersecurity Analyst at TechHub Africa in Accra, building secure and scalable digital solutions. I develop responsive interfaces, conduct vulnerability assessments, and apply secure coding practices across authentication, validation, and data protection.",
    aboutBody2:
      "I hold a BSc in Information Technology from the University of Energy and Natural Resources (2024) and I'm passionate about artificial intelligence, mentorship, and shipping reliable software — from CMS-powered platforms to data-driven dashboards.",
    aboutLocation: "Accra, Ghana — open to remote",
    aboutFocus: "Secure web apps, front-end & cloud",
    aboutEducation: "BSc Information Technology, UENR (2024)",
    aboutBadge: "Available for work",
    heroPhotoUrl: "assets/images/hero-samuel.png",
    heroPhotoData: "",
    aboutPhotoInitial: "S",
    aboutPhotoUrl: "",
    aboutPhotoData: "",
    aboutCtaText: "Let's Talk",
    email: "samfine278@gmail.com",
    githubUrl: "https://github.com/samuelkwartengokyere",
    linkedinUrl: "https://linkedin.com/in/samuel-kwarteng-okyere",
    statProjects: "4+",
    statYears: "3+",
    statPassion: "100%",
    logoText: "FireHub",
    logoUrl: "",
    logoData: "",
    faviconUrl: "",
    faviconData: "",
  };

  var DEFAULT_FAVICON = "assets/favicon.svg";
  var MAX_LOGO_BYTES = 512000;
  var MAX_FAVICON_BYTES = 256000;
  var pendingLogoImage = null;
  var pendingFaviconImage = null;
  var pendingAboutPhoto = null;
  var pendingHeroPhoto = null;
  var MAX_ABOUT_PHOTO_BYTES = 900000;
  var MAX_HERO_PHOTO_BYTES = 900000;

  var DEFAULT_PROJECTS = [
    {
      id: "1",
      title: "Intelligent Weather Prediction Dashboard",
      description:
        "A dashboard that visualizes weather trends and predicts patterns using OpenWeather data and fundamental machine learning models — showcasing data analysis and AI-driven UI.",
      tag: "React",
      tech: ["React", "OpenWeather API", "Machine Learning", "JavaScript"],
      demoUrl: "",
      sourceUrl: "https://github.com/samuelkwartengokyere",
      imageClass: "project-image--noir",
      progress: "done",
    },
    {
      id: "2",
      title: "Sanity-Powered Content Hub",
      description:
        "A dynamic content platform built with Sanity CMS — structured content modeling, optimized search, and a flexible front-end for publishing and discovery.",
      tag: "Sanity CMS",
      tech: ["Sanity CMS", "JavaScript", "Structured Content", "Search"],
      demoUrl: "",
      sourceUrl: "https://github.com/samuelkwartengokyere",
      imageClass: "project-image--pastry",
      progress: "done",
    },
    {
      id: "3",
      title: "Frontend Applications Collection",
      description:
        "A set of interactive front-end apps — including an Age Calculator, Pomodoro Timer, and Countdown App — focused on responsive design and polished user experience.",
      tag: "HTML/CSS/JS",
      tech: ["HTML", "CSS", "JavaScript", "Responsive UI"],
      demoUrl: "",
      sourceUrl: "https://github.com/samuelkwartengokyere",
      imageClass: "project-image--firehub",
      progress: "done",
    },
    {
      id: "4",
      title: "FireHub Portfolio",
      description:
        "This portfolio — a responsive, accessible site with admin tooling, live content sync, and a modern dark UI built with vanilla HTML, CSS, and JavaScript.",
      tag: "Portfolio",
      tech: ["HTML5", "CSS3", "JavaScript", "localStorage"],
      demoUrl: "index.html",
      sourceUrl: "https://github.com/samuelkwartengokyere",
      imageClass: "project-image--none",
      progress: "done",
    },
  ];

  var DEFAULT_EXPERIENCES = [
    {
      id: "1",
      period: "Apr 2026 — Present",
      dateTime: "2026-04",
      title: "Web & Cybersecurity Analyst",
      organization: "TechHub Africa · Accra, Ghana",
      description:
        "Develop secure and scalable web solutions, conduct vulnerability assessments, and implement secure coding practices for client-facing platforms.",
    },
    {
      id: "2",
      period: "Jan 2025 — Sep 2025",
      dateTime: "2025-01/2025-09",
      title: "Software Engineer",
      organization: "University of Energy and Natural Resources · Sunyani",
      description:
        "Built and maintained university web systems, integrated APIs, and delivered responsive interfaces for internal stakeholders.",
    },
    {
      id: "3",
      period: "Oct 2024 — Sep 2025",
      dateTime: "2024-10/2025-09",
      title: "Teaching Assistant",
      organization: "University of Energy and Natural Resources",
      description:
        "Supported programming and IT courses, mentored students on labs and assignments, and helped deliver practical software development sessions.",
    },
    {
      id: "4",
      period: "Jan 2023 — Sep 2024",
      dateTime: "2023-01/2024-09",
      title: "Assistant — Printing & Web Development Training",
      organization: "Amfex Network",
      description:
        "Assisted with print operations and web development training programs, guiding learners through HTML, CSS, and JavaScript fundamentals.",
    },
  ];

  function projectLinkUrl(url) {
    var u = url == null ? "" : String(url).trim();
    if (!u || u === "#") return "";
    return u;
  }

  function normalizeProgress(progress) {
    var v = String(progress == null ? "done" : progress).trim().toLowerCase();
    if (v === "in-progress" || v === "inprogress" || v === "in progress") {
      return "in-progress";
    }
    return "done";
  }

  function isProjectDone(p) {
    return normalizeProgress(p && p.progress) === "done";
  }

  function getProjectVisitUrl(p) {
    return projectLinkUrl(p.demoUrl) || projectLinkUrl(p.sourceUrl);
  }

  function normalizeExternalUrl(url) {
    var u = projectLinkUrl(url);
    if (!u) return "";
    if (/^\/\//.test(u)) return "https:" + u;
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) return "";
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/|$)/i.test(u)) {
      return "http://" + u;
    }
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+\.?(\/|$|:|\?|#)/i.test(u)) {
      return "https://" + u;
    }
    return "";
  }

  function getGithubRepoOgImageUrl(url) {
    var u = normalizeExternalUrl(url);
    if (!u) return null;
    var m = u.match(/^https?:\/\/github\.com\/([^/?#]+)\/([^/?#]+)/i);
    if (!m) return null;
    var owner = m[1];
    var repo = m[2].replace(/\.git$/i, "");
    var reserved = {
      features: 1,
      login: 1,
      signup: 1,
      settings: 1,
      marketplace: 1,
      topics: 1,
      collections: 1,
      events: 1,
      sponsors: 1,
      organizations: 1,
    };
    if (reserved[owner.toLowerCase()]) return null;
    return (
      "https://opengraph.githubassets.com/" +
      encodeURIComponent(owner) +
      "/" +
      encodeURIComponent(repo)
    );
  }

  function getProjectFeaturedImageTargetUrl(demoUrl, sourceUrl) {
    return normalizeExternalUrl(demoUrl) || normalizeExternalUrl(sourceUrl);
  }

  function projectModalHasFeaturedImage() {
    if (pendingProjectImage) return true;
    var urlInput = document.getElementById("project-image-url");
    return !!(urlInput && urlInput.value.trim());
  }

  function applyFetchedFeaturedImage(imageUrl, storedDataUrl) {
    if (storedDataUrl) {
      pendingProjectImage = storedDataUrl;
      var urlInput = document.getElementById("project-image-url");
      if (urlInput) urlInput.value = "";
    } else if (imageUrl) {
      pendingProjectImage = null;
      var urlInput = document.getElementById("project-image-url");
      if (urlInput) urlInput.value = imageUrl;
    } else {
      return;
    }
    updateProjectModalPreview();
    setProjectImageStatus("Landing page preview loaded from link.", "success");
  }

  function persistFeaturedImageFromUrl(imageUrl, callback) {
    fetch(imageUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("image fetch failed");
        return res.blob();
      })
      .then(function (blob) {
        if (!blob.type.match(/^image\//)) {
          callback(null, imageUrl, null);
          return;
        }
        if (blob.size > MAX_PROJECT_IMAGE_BYTES) {
          callback(null, imageUrl, null);
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          callback(null, imageUrl, reader.result);
        };
        reader.onerror = function () {
          callback(null, imageUrl, null);
        };
        reader.readAsDataURL(blob);
      })
      .catch(function () {
        callback(null, imageUrl, null);
      });
  }

  function fetchProjectFeaturedImageUrl(targetUrl, callback) {
    if (!targetUrl) {
      callback(new Error("no url"));
      return;
    }

    var githubOg = getGithubRepoOgImageUrl(targetUrl);
    if (githubOg) {
      callback(null, githubOg, null);
      return;
    }

    var apiUrl =
      "https://api.microlink.io/?url=" +
      encodeURIComponent(targetUrl) +
      "&screenshot=true&meta=false" +
      "&viewport.width=1280&viewport.height=720&waitForTimeout=5000";

    fetch(apiUrl)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var screenshot =
          data && data.data && data.data.screenshot && data.data.screenshot.url;
        var image = data && data.data && data.data.image && data.data.image.url;
        var resolved = screenshot || image;
        if (data && data.status === "success" && resolved) {
          persistFeaturedImageFromUrl(resolved, callback);
          return;
        }
        callback(new Error("no preview"));
      })
      .catch(function (err) {
        callback(err || new Error("fetch failed"));
      });
  }

  function fetchFeaturedImageFromProjectLinks(demoUrl, sourceUrl, callback) {
    var targetUrl = getProjectFeaturedImageTargetUrl(demoUrl, sourceUrl);
    if (!targetUrl) {
      callback(new Error("no link"));
      return;
    }
    fetchProjectFeaturedImageUrl(targetUrl, callback);
  }

  function buildProjectLinksHtml(p, opts) {
    opts = opts || {};
    var wrapClass = opts.wrapClass || "pj-card-links";
    var linkClass = opts.linkClass || "project-link";
    var statusClass = opts.statusClass || "project-status project-status--progress";
    var visitLabel = opts.visitLabel || "Visit Site";

    if (!isProjectDone(p)) {
      return '<div class="' + wrapClass + '"><span class="' + statusClass + '">In Progress</span></div>';
    }

    var url = getProjectVisitUrl(p);
    var linkHtml = url
      ? '<a href="' +
        escapeAttr(url) +
        '" class="' +
        linkClass +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(visitLabel) +
        "</a>"
      : '<a href="#" class="' +
        linkClass +
        ' project-link--no-url">' +
        escapeHtml(visitLabel) +
        "</a>";

    return '<div class="' + wrapClass + '">' + linkHtml + "</div>";
  }

  var loginScreen = document.getElementById("admin-login");
  var shell = document.getElementById("admin-shell");
  var loginForm = document.getElementById("login-form");
  var logoutBtn = document.getElementById("logout-btn");
  var navLinks = document.querySelectorAll(".admin-nav-link");
  var panels = document.querySelectorAll(".admin-panel");
  var pageTitle = document.getElementById("page-title");
  var toast = document.getElementById("admin-toast");
  var menuToggle = document.getElementById("admin-menu-toggle");
  var adminSidebar = document.querySelector(".admin-sidebar");

  function getLoginEmail() {
    return localStorage.getItem(STORAGE.email) || DEFAULT_LOGIN;
  }

  function getLoginPassword() {
    return localStorage.getItem(STORAGE.password) || DEFAULT_LOGIN;
  }

  function setLoginCredentials(value) {
    localStorage.setItem(STORAGE.email, value);
    localStorage.setItem(STORAGE.password, value);
  }

  function isAuthenticated() {
    return sessionStorage.getItem(STORAGE.auth) === "1";
  }

  function showShell() {
    if (loginScreen) {
      loginScreen.hidden = true;
      loginScreen.setAttribute("aria-hidden", "true");
    }
    if (shell) {
      shell.classList.add("is-active");
      shell.removeAttribute("aria-hidden");
    }
    refreshDashboard(true);
    renderMessages();
    renderProjects();
    renderExperiences();
    loadSettingsForm();
    loadLogoForm();
    loadSocialLinksForm();
    updateSettingsPanel();
  }

  function showLogin() {
    sessionStorage.removeItem(STORAGE.auth);
    if (loginScreen) {
      loginScreen.hidden = false;
      loginScreen.removeAttribute("aria-hidden");
    }
    if (shell) {
      shell.classList.remove("is-active");
      shell.setAttribute("aria-hidden", "true");
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2800);
  }

  function getSettings() {
    try {
      var raw = localStorage.getItem(STORAGE.settings);
      if (raw) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function notifySite(type, liveData) {
    if (typeof FirehubSync !== "undefined") {
      FirehubSync.broadcast(type, liveData);
    }
  }

  function getLogoSrcFromSettings(settings) {
    if (!settings) return "";
    if (settings.logoData) return settings.logoData;
    if (settings.logoUrl && String(settings.logoUrl).trim()) return String(settings.logoUrl).trim();
    return "";
  }

  function getFaviconMimeType(href) {
    if (!href) return "image/svg+xml";
    if (href.indexOf("data:image/svg") === 0 || /\.svg(\?|$)/i.test(href)) return "image/svg+xml";
    if (href.indexOf("data:image/png") === 0 || /\.png(\?|$)/i.test(href)) return "image/png";
    if (href.indexOf("data:image/jpeg") === 0 || /\.jpe?g(\?|$)/i.test(href)) return "image/jpeg";
    if (href.indexOf("data:image/webp") === 0 || /\.webp(\?|$)/i.test(href)) return "image/webp";
    if (href.indexOf("data:image/gif") === 0 || /\.gif(\?|$)/i.test(href)) return "image/gif";
    if (href.indexOf("data:image/x-icon") === 0 || /\.ico(\?|$)/i.test(href)) return "image/x-icon";
    return "image/png";
  }

  function getFaviconSrcFromSettings(settings) {
    if (!settings) return DEFAULT_FAVICON;
    if (settings.faviconData) return settings.faviconData;
    if (settings.faviconUrl && String(settings.faviconUrl).trim()) {
      return String(settings.faviconUrl).trim();
    }
    return DEFAULT_FAVICON;
  }

  function applyFavicon(settings) {
    var href = getFaviconSrcFromSettings(settings);
    var link =
      document.querySelector('link[rel="icon"][data-firehub-favicon]') ||
      document.querySelector('link[rel="icon"]');

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-firehub-favicon", "1");
      document.head.appendChild(link);
    } else {
      link.setAttribute("data-firehub-favicon", "1");
    }

    link.href = href;
    link.type = getFaviconMimeType(href);
  }

  function applyLogoBranding(settings) {
    var src = getLogoSrcFromSettings(settings);
    var text =
      settings && settings.logoText && String(settings.logoText).trim()
        ? String(settings.logoText).trim()
        : "FireHub";

    document.querySelectorAll(".logo").forEach(function (logo) {
      var mark = logo.querySelector(".logo-mark");
      var textEl = logo.querySelector(".logo-text");
      var img = logo.querySelector(".logo-img");

      if (!img) {
        img = document.createElement("img");
        img.className = "logo-img";
        img.alt = "";
        if (mark) logo.insertBefore(img, mark);
        else logo.insertBefore(img, logo.firstChild);
      }

      if (textEl) textEl.textContent = text;

      if (src) {
        img.src = src;
        img.hidden = false;
        img.alt = text;
        logo.classList.add("has-custom-logo");
        if (mark) mark.hidden = true;
        if (textEl) textEl.hidden = true;
        logo.setAttribute("aria-label", text + " home");
      } else {
        img.removeAttribute("src");
        img.hidden = true;
        logo.classList.remove("has-custom-logo");
        if (mark) mark.hidden = false;
        if (textEl) textEl.hidden = false;
      }
    });
  }

  function hasCustomLogoImage(settings, urlInput) {
    if (pendingLogoImage) return true;
    if (urlInput && urlInput.value.trim()) return true;
    return !!getLogoSrcFromSettings(settings || getSettings());
  }

  function getBrandTabLabel(settings, textInput) {
    var s = settings || getSettings();
    if (textInput && textInput.value.trim()) return textInput.value.trim();
    if (s.logoText && String(s.logoText).trim()) return String(s.logoText).trim();
    return "FireHub";
  }

  function updateBrandNameFieldVisibility(hasCustomLogo) {
    var wrap = document.getElementById("stg-brand-name-wrap");
    var hint = document.getElementById("stg-brand-name-hint");
    if (hasCustomLogo === undefined) {
      var urlInput = document.getElementById("setting-logoUrl");
      hasCustomLogo = hasCustomLogoImage(getSettings(), urlInput);
    }
    var showName = !hasCustomLogo;

    if (wrap) wrap.hidden = !showName;
    if (hint) {
      hint.hidden = showName;
      hint.textContent = showName
        ? ""
        : "Brand name is hidden while your logo image is shown — the image should include any text you need.";
    }
  }

  var CONTENT_FIELD_KEYS = [
    "heroName",
    "heroRole",
    "heroDescription",
    "aboutHeading",
    "aboutLead",
    "aboutBody1",
    "aboutBody2",
    "aboutLocation",
    "aboutFocus",
    "aboutEducation",
    "aboutBadge",
    "aboutPhotoInitial",
    "aboutPhotoUrl",
    "aboutCtaText",
    "email",
    "statProjects",
    "statYears",
    "statPassion",
  ];

  function getAboutPhotoSrc(settings) {
    if (!settings) return "";
    if (settings.aboutPhotoData) return settings.aboutPhotoData;
    if (settings.aboutPhotoUrl && String(settings.aboutPhotoUrl).trim()) {
      return String(settings.aboutPhotoUrl).trim();
    }
    return "";
  }

  function getHeroPhotoSrc(settings) {
    if (!settings) return "";
    if (settings.heroPhotoData) return settings.heroPhotoData;
    if (settings.heroPhotoUrl && String(settings.heroPhotoUrl).trim()) {
      return String(settings.heroPhotoUrl).trim();
    }
    return "";
  }

  function collectContentFormData() {
    var data = {};
    var existing = getSettings();

    CONTENT_FIELD_KEYS.forEach(function (key) {
      var input = document.getElementById("setting-" + key);
      if (input) data[key] = input.value.trim();
    });

    var aboutUrlInput = document.getElementById("setting-aboutPhotoUrl");
    var aboutImageUrl = aboutUrlInput ? aboutUrlInput.value.trim() : "";

    if (pendingAboutPhoto != null) {
      data.aboutPhotoData = pendingAboutPhoto;
      data.aboutPhotoUrl = "";
    } else if (aboutImageUrl) {
      data.aboutPhotoUrl = aboutImageUrl;
      data.aboutPhotoData = "";
    } else {
      data.aboutPhotoUrl = existing.aboutPhotoUrl || "";
      data.aboutPhotoData = existing.aboutPhotoData || "";
    }

    if (!data.aboutPhotoInitial && data.heroName) {
      data.aboutPhotoInitial = data.heroName.charAt(0).toUpperCase();
    }

    var heroUrlInput = document.getElementById("setting-heroPhotoUrl");
    var heroImageUrl = heroUrlInput ? heroUrlInput.value.trim() : "";

    if (pendingHeroPhoto != null) {
      data.heroPhotoData = pendingHeroPhoto;
      data.heroPhotoUrl = "";
    } else if (heroImageUrl) {
      data.heroPhotoUrl = heroImageUrl;
      data.heroPhotoData = "";
    } else {
      data.heroPhotoUrl = existing.heroPhotoUrl || "";
      data.heroPhotoData = existing.heroPhotoData || "";
    }

    data.logoText = existing.logoText || "FireHub";
    data.logoUrl = existing.logoUrl || "";
    data.logoData = existing.logoData || "";
    data.faviconUrl = existing.faviconUrl || "";
    data.faviconData = existing.faviconData || "";
    data.githubUrl = existing.githubUrl || "";
    data.linkedinUrl = existing.linkedinUrl || "";
    return data;
  }

  function collectLogoFormData() {
    var existing = getSettings();
    var urlInput = document.getElementById("setting-logoUrl");
    var textInput = document.getElementById("setting-logoText");
    var faviconUrlInput = document.getElementById("setting-faviconUrl");
    var imageUrl = urlInput ? urlInput.value.trim() : "";
    var faviconImageUrl = faviconUrlInput ? faviconUrlInput.value.trim() : "";

    var data = Object.assign({}, existing, {
      logoText: textInput ? textInput.value.trim() || "FireHub" : "FireHub",
      logoUrl: imageUrl,
      logoData: pendingLogoImage != null ? pendingLogoImage : existing.logoData || "",
      faviconUrl: faviconImageUrl,
      faviconData:
        pendingFaviconImage != null ? pendingFaviconImage : existing.faviconData || "",
    });

    if (pendingLogoImage) data.logoUrl = "";
    else if (imageUrl) data.logoData = "";

    if (pendingFaviconImage) data.faviconUrl = "";
    else if (faviconImageUrl) data.faviconData = "";

    return data;
  }

  function saveSettings(data) {
    localStorage.setItem(STORAGE.settings, JSON.stringify(data));
    notifySite("settings");
    applyLogoBranding(data);
    applyFavicon(data);
  }

  function getProjects() {
    try {
      var raw = localStorage.getItem(STORAGE.projects);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_PROJECTS.slice();
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE.projects, JSON.stringify(list));
    notifySite("projects");
  }

  function getExperiences() {
    try {
      var raw = localStorage.getItem(STORAGE.experiences);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_EXPERIENCES.slice();
  }

  function saveExperiences(list) {
    localStorage.setItem(STORAGE.experiences, JSON.stringify(list));
    notifySite("experiences");
  }

  function getMessages() {
    if (typeof FirehubMessages !== "undefined") {
      return FirehubMessages.getMessages();
    }
    try {
      var raw = localStorage.getItem(STORAGE.messages);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveMessages(list) {
    if (typeof FirehubMessages !== "undefined") {
      FirehubMessages.saveMessages(list);
      return;
    }
    localStorage.setItem(STORAGE.messages, JSON.stringify(list));
    notifySite("messages");
  }

  var DASH_RING_LENGTH = 327;
  var MAX_PROJECT_IMAGE_BYTES = 900000;
  var MAX_EXPERIENCE_IMAGE_BYTES = 900000;
  var pendingProjectImage = null;
  var pendingExperienceImage = null;
  var featuredImageFetchTimer = null;
  var featuredImageFetchInFlight = false;
  var pendingProjectSaveAfterFetch = false;

  function getEntryImageSrc(entry) {
    if (!entry) return null;
    if (entry.imageData) return entry.imageData;
    if (entry.imageUrl && String(entry.imageUrl).trim()) return String(entry.imageUrl).trim();
    return null;
  }

  function getProjectImageSrc(p) {
    return getEntryImageSrc(p);
  }

  function getExperienceImageSrc(exp) {
    return getEntryImageSrc(exp);
  }

  function projectBannerImgHtml(src, alt) {
    if (!src) return "";
    return (
      '<img class="pj-banner-img" src="' +
      escapeAttr(src) +
      '" alt="' +
      escapeAttr(alt || "Project") +
      '" loading="lazy" />'
    );
  }

  function switchPanel(panelId) {
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.dataset.panel === panelId);
    });
    panels.forEach(function (panel) {
      panel.classList.toggle("active", panel.id === "panel-" + panelId);
    });
    var titles = {
      dashboard: "Dashboard",
      content: "Site Content",
      projects: "Projects",
      experience: "Experience",
      messages: "Messages",
      settings: "Settings",
    };
    if (pageTitle) pageTitle.textContent = titles[panelId] || "Admin";
    if (adminSidebar) adminSidebar.classList.remove("is-open");
    if (panelId === "dashboard") animateDashboard();
    if (panelId === "content") {
      loadSettingsForm();
      updateContentPreview();
      animateContentPanel();
    }
    if (panelId === "projects") {
      renderProjects();
      animateProjectsPanel();
    }
    if (panelId === "experience") {
      if (!localStorage.getItem(STORAGE.experiences)) {
        saveExperiences(DEFAULT_EXPERIENCES.slice());
      }
      renderExperiences();
      animateExperiencesPanel();
    }
    if (panelId === "messages") {
      refreshMessagesFromRemote(function () {
        renderMessages();
        animateMessagesPanel();
      });
      scheduleTodayFilterRefresh();
    } else if (todayFilterMidnightTimer) {
      clearTimeout(todayFilterMidnightTimer);
      todayFilterMidnightTimer = null;
    }
    if (panelId === "settings") {
      loadLogoForm();
      loadSocialLinksForm();
      updateSettingsPanel();
      animateSettingsPanel();
    }
  }

  function animateProjectsPanel() {
    var panel = document.getElementById("panel-projects");
    if (!panel) return;

    panel.classList.remove("is-ready");
    panel.querySelectorAll(".pj-animate").forEach(function (el) {
      el.classList.remove("pj-animate");
      void el.offsetWidth;
      el.classList.add("pj-animate");
    });
    panel.classList.add("is-ready");
  }

  function animateExperiencesPanel() {
    var panel = document.getElementById("panel-experience");
    if (!panel) return;

    panel.classList.remove("is-ready");
    panel.querySelectorAll(".exp-animate").forEach(function (el) {
      el.classList.remove("exp-animate");
      void el.offsetWidth;
      el.classList.add("exp-animate");
    });
    panel.classList.add("is-ready");
  }

  function animateMessagesPanel() {
    var panel = document.getElementById("panel-messages");
    if (!panel) return;

    panel.classList.remove("is-ready");
    panel.querySelectorAll(".msg-animate").forEach(function (el) {
      el.classList.remove("msg-animate");
      void el.offsetWidth;
      el.classList.add("msg-animate");
    });
    panel.classList.add("is-ready");
  }

  var settingsTab = "overview";

  function updateSettingsTabsUI() {
    document.querySelectorAll("[data-stg-tab]").forEach(function (btn) {
      var tab = btn.getAttribute("data-stg-tab");
      var active = tab === settingsTab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    document.querySelectorAll(".stg-tab-panel").forEach(function (panelEl) {
      var id = panelEl.id || "";
      var tab = id.replace("stg-panel-", "");
      var active = tab === settingsTab;
      panelEl.classList.toggle("is-active", active);
      panelEl.hidden = !active;
    });
  }

  function switchSettingsTab(tabId) {
    if (!tabId || tabId === settingsTab) return;
    settingsTab = tabId;
    updateSettingsTabsUI();

    var panel = document.getElementById("panel-settings");
    if (!panel) return;
    var activePanel = document.getElementById("stg-panel-" + tabId);
    if (activePanel) {
      activePanel.classList.remove("stg-animate");
      void activePanel.offsetWidth;
      activePanel.classList.add("stg-animate");
    }
  }

  function animateSettingsPanel() {
    var panel = document.getElementById("panel-settings");
    if (!panel) return;

    updateSettingsTabsUI();

    panel.classList.remove("is-ready");
    panel.querySelectorAll(".stg-tabs .stg-animate, .stg-hero.stg-animate").forEach(function (el) {
      el.classList.remove("stg-animate");
      void el.offsetWidth;
      el.classList.add("stg-animate");
    });
    var activePanel = document.getElementById("stg-panel-" + settingsTab);
    if (activePanel) {
      activePanel.classList.remove("stg-animate");
      void activePanel.offsetWidth;
      activePanel.classList.add("stg-animate");
    }
    panel.classList.add("is-ready");
  }

  function maskLoginEmail(email) {
    if (!email || email.indexOf("@") === -1) return email || "—";
    var parts = email.split("@");
    var local = parts[0];
    var masked =
      local.length <= 2 ? local.charAt(0) + "••" : local.slice(0, 2) + "•••";
    return masked + "@" + parts[1];
  }

  function formatStorageSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function estimateFirehubStorageBytes() {
    var total = 0;
    var prefix = "firehub_";
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(prefix) === 0) {
        var val = localStorage.getItem(key) || "";
        total += key.length + val.length;
      }
    }
    return total * 2;
  }

  function updateSettingsPanel() {
    var loginEl = document.getElementById("stg-login-display");
    var dataCountEl = document.getElementById("stg-data-count");
    var sizeEl = document.getElementById("stg-storage-size");
    var exportProjects = document.getElementById("stg-export-projects");
    var exportExperiences = document.getElementById("stg-export-experiences");
    var exportMessages = document.getElementById("stg-export-messages");

    var projects = getProjects();
    var experiences = getExperiences();
    var messages = getMessages();
    var itemCount =
      projects.length + experiences.length + messages.length + (getSettings() ? 1 : 0);

    if (loginEl) loginEl.textContent = maskLoginEmail(getLoginEmail());
    if (dataCountEl) {
      dataCountEl.textContent =
        itemCount === 1 ? "1 item" : itemCount + " items";
    }
    if (sizeEl) sizeEl.textContent = formatStorageSize(estimateFirehubStorageBytes());
    if (exportProjects) exportProjects.textContent = String(projects.length);
    if (exportExperiences) exportExperiences.textContent = String(experiences.length);
    if (exportMessages) exportMessages.textContent = String(messages.length);
  }

  function formatMsgDate(dateStr) {
    if (!dateStr) return "—";
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    var now = new Date();
    var diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return d.toLocaleDateString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  var messageFilter = "all";
  var todayFilterMidnightTimer = null;

  function isMessageToday(dateStr) {
    if (!dateStr) return false;
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    var now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  function msUntilLocalMidnight() {
    var now = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight.getTime() - now.getTime();
  }

  function scheduleTodayFilterRefresh() {
    if (todayFilterMidnightTimer) {
      clearTimeout(todayFilterMidnightTimer);
      todayFilterMidnightTimer = null;
    }
    if (messageFilter !== "today") return;

    todayFilterMidnightTimer = setTimeout(function () {
      todayFilterMidnightTimer = null;
      renderMessages();
      scheduleTodayFilterRefresh();
    }, msUntilLocalMidnight() + 500);
  }

  function filterMessagesByTab(messages) {
    if (messageFilter === "today") {
      return messages.filter(function (m) {
        return isMessageToday(m.date);
      });
    }
    if (messageFilter === "unread") {
      return messages.filter(function (m) {
        return !m.read;
      });
    }
    if (messageFilter === "read") {
      return messages.filter(function (m) {
        return m.read;
      });
    }
    return messages;
  }

  function updateMessageFilterTabs() {
    document.querySelectorAll("[data-msg-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-msg-filter") === messageFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function setMessagesEmptyState(mode) {
    var empty = document.getElementById("messages-empty");
    var title = document.getElementById("messages-empty-title");
    var text = document.getElementById("messages-empty-text");
    if (!empty) return;

    if (mode === "inbox") {
      if (title) title.textContent = "Inbox is empty";
      if (text) {
        text.textContent =
          "When visitors use your contact form, their messages will appear here.";
      }
    } else if (mode === "unread") {
      if (title) title.textContent = "No unread messages";
      if (text) text.textContent = "You're all caught up — switch to Total or Read to browse other messages.";
    } else if (mode === "read") {
      if (title) title.textContent = "No read messages";
      if (text) text.textContent = "Open a message from Unread or Total to mark it as read.";
    } else if (mode === "today") {
      if (title) title.textContent = "No messages today";
      if (text) {
        text.textContent =
          "Messages received today appear here. Older messages stay in Total, Unread, and Read.";
      }
    }
  }

  function updateMessagesStats(messages) {
    var unread = messages.filter(function (m) {
      return !m.read;
    }).length;
    var read = messages.length - unread;
    var todayCount = messages.filter(function (m) {
      return isMessageToday(m.date);
    }).length;
    setText("msg-stat-total", String(messages.length));
    setText("msg-stat-today", String(todayCount));
    setText("msg-stat-unread", String(unread));
    setText("msg-stat-read", String(read));
    updateMessageFilterTabs();
    scheduleTodayFilterRefresh();

    var markAll = document.getElementById("mark-all-read");
    if (markAll) {
      markAll.disabled = unread === 0;
      markAll.classList.toggle("is-disabled", unread === 0);
    }
  }

  function updateProjectsStats(projects) {
    var tags = {};
    var techCount = 0;
    projects.forEach(function (p) {
      if (p.tag) tags[p.tag] = true;
      techCount += (p.tech || []).length;
    });
    setText("pj-stat-total", String(projects.length));
    setText("pj-stat-tags", String(Object.keys(tags).length));
    setText("pj-stat-tech", String(techCount));
  }

  function animateContentPanel() {
    var panel = document.getElementById("panel-content");
    if (!panel) return;

    panel.classList.remove("is-ready");
    panel.querySelectorAll(".sc-animate").forEach(function (el) {
      el.classList.remove("sc-animate");
      void el.offsetWidth;
      el.classList.add("sc-animate");
    });
    panel.classList.add("is-ready");
  }

  function updateContentPreview() {
    var card = document.querySelector(".sc-preview-card");
    var fields = {
      "sc-preview-name": "setting-heroName",
      "sc-preview-role": "setting-heroRole",
      "sc-preview-desc": "setting-heroDescription",
      "sc-preview-email": "setting-email",
      "sc-preview-stat-projects": "setting-statProjects",
      "sc-preview-stat-years": "setting-statYears",
      "sc-preview-stat-passion": "setting-statPassion",
    };

    Object.keys(fields).forEach(function (previewId) {
      var preview = document.getElementById(previewId);
      var input = document.getElementById(fields[previewId]);
      if (preview && input) {
        if (previewId === "sc-preview-role") {
          var raw = input.value.trim();
          var roles = raw
            ? raw.split(/\s*\|\|\s*|\s*\|\s*/).map(function (r) {
                return r.trim();
              }).filter(Boolean)
            : [];
          preview.textContent = roles.length ? roles[0] : raw || preview.textContent;
          preview.title = roles.length > 1 ? roles.join(" · ") : "";
        } else {
          preview.textContent = input.value.trim() || preview.textContent;
        }
      }
    });

    var aboutPreview = document.getElementById("sc-preview-about");
    var aboutInput = document.getElementById("setting-aboutLead");
    if (aboutPreview && aboutInput) {
      var aboutText = aboutInput.value.trim();
      if (aboutText) {
        aboutPreview.textContent = aboutText;
        aboutPreview.hidden = false;
      } else {
        aboutPreview.hidden = true;
      }
    }

    updateAboutPreview();
    updateHeroPreview();

    if (card) {
      card.classList.add("is-updating");
      clearTimeout(updateContentPreview._timer);
      updateContentPreview._timer = setTimeout(function () {
        card.classList.remove("is-updating");
      }, 400);
    }
  }

  function updateDashGreeting() {
    var el = document.getElementById("dash-greeting");
    var dateEl = document.getElementById("dash-date");
    if (!el) return;

    var hour = new Date().getHours();
    var greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";
    el.textContent = greeting;

    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  function animateCount(el, target) {
    if (!el) return;
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var end = parseInt(target, 10) || 0;
    if (prefersReduced || isNaN(end)) {
      el.textContent = String(end);
      return;
    }

    var start = parseInt(el.textContent, 10) || 0;
    var duration = 900;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = String(end);
    }

    requestAnimationFrame(step);
  }

  function renderDashActivity(messages) {
    var list = document.getElementById("dash-activity-list");
    if (!list) return;

    var recent = messages.slice(-3).reverse();
    list.innerHTML = "";

    if (!recent.length) {
      list.innerHTML =
        '<li class="dash-activity-empty">No messages yet — submissions appear here.</li>';
      return;
    }

    recent.forEach(function (msg, i) {
      var li = document.createElement("li");
      li.className = "dash-activity-item";
      li.style.animationDelay = i * 0.08 + "s";
      var initial = (msg.name || "?").charAt(0).toUpperCase();
      var when = msg.date
        ? new Date(msg.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "—";
      li.innerHTML =
        '<span class="dash-activity-avatar" aria-hidden="true">' +
        escapeHtml(initial) +
        "</span>" +
        '<div class="dash-activity-body">' +
        "<strong>" +
        escapeHtml(msg.name || "Unknown") +
        "</strong>" +
        "<span>" +
        escapeHtml(truncate(msg.message, 48)) +
        "</span></div>" +
        '<time class="dash-activity-time">' +
        escapeHtml(when) +
        "</time>";
      list.appendChild(li);
    });
  }

  function updateDashHealth(messages, projects, hasCustom) {
    var score = 100;
    if (!projects.length) score -= 15;
    if (!messages.length) score -= 5;
    if (!hasCustom) score -= 10;
    score = Math.max(55, Math.min(100, score));

    var ring = document.getElementById("dash-ring-fill");
    var scoreEl = document.getElementById("dash-health-score");
    var projectsEl = document.getElementById("dash-health-projects");
    var contentEl = document.getElementById("dash-health-content");

    if (ring) {
      var offset = DASH_RING_LENGTH - (DASH_RING_LENGTH * score) / 100;
      ring.style.strokeDashoffset = String(offset);
    }
    if (scoreEl) scoreEl.textContent = score + "%";
    if (projectsEl) {
      projectsEl.textContent = projects.length + " project" + (projects.length === 1 ? "" : "s");
    }
    if (contentEl) {
      contentEl.textContent = hasCustom ? "Custom content active" : "Default content";
    }
  }

  function animateDashboard() {
    var dash = document.getElementById("panel-dashboard");
    if (!dash) return;

    dash.querySelectorAll(".dash-animate").forEach(function (el) {
      el.classList.remove("dash-animate");
      void el.offsetWidth;
      el.classList.add("dash-animate");
    });

    refreshDashboard(true);
    dash.classList.add("is-ready");
  }

  function setBarWidth(id, pct) {
    var el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  function updateVisitorStats(animate) {
    var api = typeof FirehubAnalytics !== "undefined" ? FirehubAnalytics : null;
    if (!api) return;

    function apply(stats) {
      var todayEl = document.getElementById("stat-visitors-today");
      var monthEl = document.getElementById("stat-visitors-month");
      var yearEl = document.getElementById("stat-visitors-year");
      var totalEl = document.getElementById("stat-visitors-total");

      if (animate) {
        animateCount(todayEl, stats.today);
        animateCount(monthEl, stats.month);
        animateCount(yearEl, stats.year);
        animateCount(totalEl, stats.allTime);
      } else {
        if (todayEl) todayEl.textContent = String(stats.today);
        if (monthEl) monthEl.textContent = String(stats.month);
        if (yearEl) yearEl.textContent = String(stats.year);
        if (totalEl) totalEl.textContent = String(stats.allTime);
      }

      var now = new Date();
      var monthName = now.toLocaleString(undefined, { month: "long", year: "numeric" });
      var yearName = String(now.getFullYear());
      setText("stat-visitors-month-label", monthName);
      setText("stat-visitors-year-label", yearName);
      setText("stat-visitors-pageviews", (stats.pageviews || 0) + " page views logged");
      setText("stat-visitors-today-bar", String(stats.today));
      setText("stat-visitors-month-bar", String(stats.month));

      setBarWidth("bar-visitors-today", Math.min(100, stats.today * 12));
      setBarWidth("bar-visitors-month", Math.min(100, stats.month * 4));

      setText("summary-visitors-year", String(stats.year));
      setText("summary-visitors-total", String(stats.allTime));

      var sourceEl = document.getElementById("dash-visitors-source");
      if (sourceEl) {
        sourceEl.textContent =
          stats.source === "global"
            ? "Live visitor counts from everyone who opens your portfolio"
            : "Local preview counts — open your portfolio site to start tracking";
      }
    }

    apply(api.getLocalStats());

    api.getStats().then(apply).catch(function () {
      apply(api.getLocalStats());
    });
  }

  function refreshDashboard(animate) {
    var messages = getMessages();
    var projects = getProjects();
    var unread = messages.filter(function (m) {
      return !m.read;
    }).length;
    var hasCustom = !!localStorage.getItem(STORAGE.settings);

    updateDashGreeting();

    var settings = getSettings();
    var nameEl = document.querySelector(".dash-title .text-gradient");
    if (nameEl && settings.heroName) nameEl.textContent = settings.heroName;

    var msgEl = document.getElementById("stat-messages");
    var unreadEl = document.getElementById("stat-unread");
    var projEl = document.getElementById("stat-projects");

    if (animate) {
      animateCount(msgEl, messages.length);
      animateCount(unreadEl, unread);
      animateCount(projEl, projects.length);
    } else {
      if (msgEl) msgEl.textContent = String(messages.length);
      if (unreadEl) unreadEl.textContent = String(unread);
      if (projEl) projEl.textContent = String(projects.length);
    }

    var msgMeta = document.getElementById("stat-messages-meta");
    var unreadMeta = document.getElementById("stat-unread-meta");
    if (msgMeta) {
      msgMeta.textContent =
        messages.length === 1 ? "1 conversation" : messages.length + " in your inbox";
    }
    if (unreadMeta) {
      unreadMeta.textContent = unread ? unread + " need attention" : "All caught up";
    }

    var settingsEl = document.getElementById("stat-settings");
    var badgeEl = document.getElementById("stat-settings-badge");
    if (settingsEl) settingsEl.textContent = hasCustom ? "Custom" : "Default";
    if (badgeEl) {
      badgeEl.textContent = hasCustom ? "Personalized" : "Built-in";
      badgeEl.classList.toggle("dash-badge--custom", hasCustom);
    }

    var statusLabel = document.getElementById("dash-status-label");
    if (statusLabel) {
      statusLabel.textContent = unread ? unread + " unread · portfolio live" : "Portfolio live";
    }

    var read = messages.length - unread;
    var total = messages.length;
    var readRate = total ? Math.round((read / total) * 100) : 0;

    setText("dash-hero-stat-projects", settings.statProjects || "5+");
    setText("dash-hero-stat-years", settings.statYears || "3+");
    setText("dash-hero-stat-passion", settings.statPassion || "100%");

    setText("stat-read", String(read));
    setText("stat-unread-bar", String(unread));
    setText("stat-projects-bar", String(projects.length));
    setText("stat-content-pct", hasCustom ? "100%" : "0%");

    setBarWidth("bar-read", total ? (read / total) * 100 : 0);
    setBarWidth("bar-unread", total ? (unread / total) * 100 : 0);
    setBarWidth("bar-projects", Math.min(100, projects.length * 20));
    setBarWidth("bar-content", hasCustom ? 100 : 0);

    setText("summary-total-msgs", String(total));
    setText("summary-read-rate", readRate + "%");

    var lastMsg = "—";
    if (messages.length) {
      var sorted = messages.slice().sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      if (sorted[0] && sorted[0].date) {
        lastMsg = new Date(sorted[0].date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
    setText("summary-last-msg", lastMsg);

    renderDashActivity(messages);
    updateDashHealth(messages, projects, hasCustom);
    updateVisitorStats(animate);

    var dashPanel = document.getElementById("panel-dashboard");
    if (dashPanel) dashPanel.classList.add("is-ready");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setAboutPhotoStatus(message, type) {
    var el = document.getElementById("about-photo-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "sc-about-photo-status" + (type ? " is-" + type : "");
  }

  function setHeroPhotoStatus(message, type) {
    var el = document.getElementById("hero-photo-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "sc-hero-photo-status" + (type ? " is-" + type : "");
  }

  function updateHeroPreview() {
    var photoEl = document.getElementById("sc-preview-hero-photo");
    var initialEl = document.getElementById("sc-preview-hero-initial");
    var urlInput = document.getElementById("setting-heroPhotoUrl");
    var heroInput = document.getElementById("setting-heroName");
    var s = getSettings();

    var src = pendingHeroPhoto;
    if (!src && urlInput && urlInput.value.trim()) src = urlInput.value.trim();
    if (!src) src = getHeroPhotoSrc(s);
    if (!src) src = "assets/images/hero-samuel.png";

    var initial =
      (heroInput && heroInput.value.trim() && heroInput.value.trim().charAt(0).toUpperCase()) ||
      (s.heroName && String(s.heroName).trim().charAt(0).toUpperCase()) ||
      "S";

    if (photoEl) {
      if (src) {
        photoEl.src = src;
        photoEl.hidden = false;
      } else {
        photoEl.removeAttribute("src");
        photoEl.hidden = true;
      }
    }
    if (initialEl) {
      initialEl.textContent = initial;
      initialEl.hidden = !!src;
    }

    var clearBtn = document.getElementById("hero-photo-clear-btn");
    if (clearBtn) clearBtn.hidden = !src;
  }

  function updateAboutPreview() {
    var photoEl = document.getElementById("sc-preview-about-photo");
    var initialEl = document.getElementById("sc-preview-about-initial");
    var headingInput = document.getElementById("setting-aboutHeading");
    var initialInput = document.getElementById("setting-aboutPhotoInitial");
    var urlInput = document.getElementById("setting-aboutPhotoUrl");
    var heroInput = document.getElementById("setting-heroName");
    var s = getSettings();

    var src = pendingAboutPhoto;
    if (!src && urlInput && urlInput.value.trim()) src = urlInput.value.trim();
    if (!src) src = getAboutPhotoSrc(s);

    var initial =
      (initialInput && initialInput.value.trim()) ||
      (heroInput && heroInput.value.trim() && heroInput.value.trim().charAt(0).toUpperCase()) ||
      (s.aboutPhotoInitial && String(s.aboutPhotoInitial).charAt(0)) ||
      "S";

    if (photoEl) {
      if (src) {
        photoEl.src = src;
        photoEl.hidden = false;
      } else {
        photoEl.removeAttribute("src");
        photoEl.hidden = true;
      }
    }
    if (initialEl) {
      initialEl.textContent = initial;
      initialEl.hidden = !!src;
    }

    var headingPreview = document.getElementById("sc-preview-about-heading");
    if (headingPreview && headingInput) {
      headingPreview.textContent = headingInput.value.trim() || "About Me";
    }

    var clearBtn = document.getElementById("about-photo-clear-btn");
    if (clearBtn) clearBtn.hidden = !src;
  }

  function loadSettingsForm() {
    var s = getSettings();
    pendingAboutPhoto = null;
    pendingHeroPhoto = null;

    CONTENT_FIELD_KEYS.forEach(function (key) {
      var input = document.getElementById("setting-" + key);
      if (input) input.value = s[key] || "";
    });

    var heroUrlInput = document.getElementById("setting-heroPhotoUrl");
    if (heroUrlInput) {
      heroUrlInput.value = s.heroPhotoData ? "" : s.heroPhotoUrl || "";
    }

    var aboutFile = document.getElementById("setting-aboutPhoto-file");
    if (aboutFile) aboutFile.value = "";

    var heroFile = document.getElementById("setting-heroPhoto-file");
    if (heroFile) heroFile.value = "";

    if (s.heroPhotoData) setHeroPhotoStatus("Using uploaded image.", "success");
    else if (s.heroPhotoUrl) setHeroPhotoStatus("Using image URL.", "success");
    else setHeroPhotoStatus("");

    if (s.aboutPhotoData) setAboutPhotoStatus("Using uploaded photo.", "success");
    else if (s.aboutPhotoUrl) setAboutPhotoStatus("Using photo URL.", "success");
    else setAboutPhotoStatus("");

    updateContentPreview();
  }

  function setLogoFormStatus(message, type) {
    var el = document.getElementById("logo-image-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "stg-logo-status" + (type ? " is-" + type : "");
  }

  function setFaviconFormStatus(message, type) {
    var el = document.getElementById("favicon-image-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "stg-logo-status" + (type ? " is-" + type : "");
  }

  function hasCustomFavicon(settings, faviconUrlInput) {
    if (pendingFaviconImage) return true;
    if (faviconUrlInput && faviconUrlInput.value.trim()) return true;
    var s = settings || getSettings();
    return !!(s.faviconData || (s.faviconUrl && String(s.faviconUrl).trim()));
  }

  function updateLogoPreview() {
    var s = getSettings();
    var urlInput = document.getElementById("setting-logoUrl");
    var textInput = document.getElementById("setting-logoText");
    var faviconUrlInput = document.getElementById("setting-faviconUrl");
    var brandText = textInput ? textInput.value.trim() || "FireHub" : s.logoText || "FireHub";
    var preview = {
      logoText: brandText,
      logoUrl: "",
      logoData: "",
      faviconUrl: "",
      faviconData: "",
    };

    if (pendingLogoImage) {
      preview.logoData = pendingLogoImage;
    } else if (urlInput && urlInput.value.trim()) {
      preview.logoUrl = urlInput.value.trim();
    } else {
      preview.logoUrl = s.logoUrl || "";
      preview.logoData = s.logoData || "";
    }

    if (pendingFaviconImage) {
      preview.faviconData = pendingFaviconImage;
    } else if (faviconUrlInput && faviconUrlInput.value.trim()) {
      preview.faviconUrl = faviconUrlInput.value.trim();
    } else {
      preview.faviconUrl = s.faviconUrl || "";
      preview.faviconData = s.faviconData || "";
    }

    applyLogoBranding(preview);
    applyFavicon(preview);

    var hasCustomLogo =
      !!pendingLogoImage ||
      !!(urlInput && urlInput.value.trim()) ||
      !!(preview.logoData || preview.logoUrl);
    updateBrandNameFieldVisibility(hasCustomLogo);

    var faviconPreview = document.getElementById("stg-favicon-preview");
    if (faviconPreview) faviconPreview.src = getFaviconSrcFromSettings(preview);

    var tabTitle = document.getElementById("stg-favicon-tab-title");
    if (tabTitle) tabTitle.textContent = getBrandTabLabel(preview, textInput);

    var clearBtn = document.getElementById("logo-image-clear-btn");
    var hasCustomLogo =
      pendingLogoImage || (urlInput && urlInput.value.trim()) || getLogoSrcFromSettings(s);
    if (clearBtn) clearBtn.hidden = !hasCustomLogo;

    var faviconClearBtn = document.getElementById("favicon-image-clear-btn");
    if (faviconClearBtn) faviconClearBtn.hidden = !hasCustomFavicon(s, faviconUrlInput);
  }

  function loadSocialLinksForm() {
    var s = getSettings();
    var githubInput = document.getElementById("setting-githubUrl");
    var linkedinInput = document.getElementById("setting-linkedinUrl");
    var emailInput = document.getElementById("setting-socialEmail");
    if (githubInput) githubInput.value = s.githubUrl || "";
    if (linkedinInput) linkedinInput.value = s.linkedinUrl || "";
    if (emailInput) emailInput.value = s.email || "";
  }

  function collectSocialLinksFormData() {
    var existing = getSettings();
    var githubInput = document.getElementById("setting-githubUrl");
    var linkedinInput = document.getElementById("setting-linkedinUrl");
    var emailInput = document.getElementById("setting-socialEmail");
    return Object.assign({}, existing, {
      githubUrl: githubInput ? githubInput.value.trim() : "",
      linkedinUrl: linkedinInput ? linkedinInput.value.trim() : "",
      email: emailInput ? emailInput.value.trim() : existing.email || "",
    });
  }

  function loadLogoForm() {
    var s = getSettings();
    pendingLogoImage = null;
    pendingFaviconImage = null;
    var textInput = document.getElementById("setting-logoText");
    var urlInput = document.getElementById("setting-logoUrl");
    var fileInput = document.getElementById("setting-logo-file");
    var faviconUrlInput = document.getElementById("setting-faviconUrl");
    var faviconFileInput = document.getElementById("setting-favicon-file");
    if (textInput) textInput.value = s.logoText || "FireHub";
    if (urlInput) urlInput.value = s.logoUrl || "";
    if (fileInput) fileInput.value = "";
    if (faviconUrlInput) faviconUrlInput.value = s.faviconUrl || "";
    if (faviconFileInput) faviconFileInput.value = "";
    if (s.logoData) setLogoFormStatus("Using uploaded logo.", "success");
    else if (s.logoUrl) setLogoFormStatus("Using logo URL.", "success");
    else setLogoFormStatus("");
    if (s.faviconData) setFaviconFormStatus("Using uploaded favicon.", "success");
    else if (s.faviconUrl) setFaviconFormStatus("Using favicon URL.", "success");
    else setFaviconFormStatus("");
    updateLogoPreview();
    updateBrandNameFieldVisibility();
    applyLogoBranding(s);
    applyFavicon(s);
  }

  function refreshMessagesFromRemote(done) {
    if (typeof FirehubMessages !== "undefined" && typeof FirehubMessages.pullRemote === "function") {
      FirehubMessages.pullRemote().then(function () {
        if (typeof done === "function") done();
      });
      return;
    }
    if (typeof done === "function") done();
  }

  function handleMessagesSync() {
    renderMessages();
    refreshDashboard(true);
  }

  function renderMessages() {
    var list = document.getElementById("messages-list");
    var empty = document.getElementById("messages-empty");
    if (!list) return;

    var allMessages = getMessages().slice().reverse();
    list.innerHTML = "";
    updateMessagesStats(getMessages());

    if (allMessages.length === 0) {
      setMessagesEmptyState("inbox");
      if (empty) empty.hidden = false;
      return;
    }

    var messages = filterMessagesByTab(allMessages);

    if (messages.length === 0) {
      var emptyMode = "unread";
      if (messageFilter === "read") emptyMode = "read";
      else if (messageFilter === "today") emptyMode = "today";
      setMessagesEmptyState(emptyMode);
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    messages.forEach(function (msg, i) {
      var card = document.createElement("article");
      card.className = "msg-card msg-animate" + (msg.read ? "" : " msg-card--unread");
      card.setAttribute("role", "listitem");
      card.style.setProperty("--msg-i", String(2 + Math.min(i, 8)));

      var initial = (msg.name || "?").charAt(0).toUpperCase();
      var when = formatMsgDate(msg.date);
      var preview = truncate(msg.message, 120);

      card.innerHTML =
        '<div class="msg-card-glow" aria-hidden="true"></div>' +
        '<div class="msg-card-inner">' +
        '<div class="msg-card-top">' +
        '<span class="msg-card-avatar" aria-hidden="true">' +
        escapeHtml(initial) +
        "</span>" +
        '<div class="msg-card-meta">' +
        "<h4>" +
        escapeHtml(msg.name || "Unknown") +
        "</h4>" +
        '<a class="msg-card-email" href="mailto:' +
        escapeAttr(msg.email || "") +
        '" onclick="event.stopPropagation()">' +
        escapeHtml(msg.email || "—") +
        "</a>" +
        "</div>" +
        '<span class="msg-card-time">' +
        escapeHtml(when) +
        "</span>" +
        "</div>" +
        '<p class="msg-card-preview">' +
        escapeHtml(preview) +
        "</p>" +
        '<div class="msg-card-footer">' +
        '<span class="msg-card-badge ' +
        (msg.read ? "msg-card-badge--read" : "msg-card-badge--new") +
        '">' +
        (msg.read ? "Read" : "New") +
        "</span>" +
        '<div class="msg-card-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm msg-card-view" data-view="' +
        escapeAttr(msg.id) +
        '">Open</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete-msg="' +
        escapeAttr(msg.id) +
        '" aria-label="Delete message">Delete</button>' +
        "</div></div></div>";

      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-delete-msg]") || e.target.closest(".msg-card-email")) return;
        openMessageModal(msg.id);
      });

      var viewBtn = card.querySelector("[data-view]");
      if (viewBtn) {
        viewBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          openMessageModal(msg.id);
        });
      }

      var delBtn = card.querySelector("[data-delete-msg]");
      if (delBtn) {
        delBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          deleteMessage(msg.id);
        });
      }

      list.appendChild(card);
    });
  }

  function openMessageModal(id) {
    var messages = getMessages();
    var msg = messages.find(function (m) {
      return m.id === id;
    });
    if (!msg) return;

    msg.read = true;
    saveMessages(messages);

    var modal = document.getElementById("message-modal");
    var body = document.getElementById("message-modal-body");
    var title = document.getElementById("message-modal-title");
    var reply = document.getElementById("message-modal-reply");
    var initial = (msg.name || "?").charAt(0).toUpperCase();
    var fullDate = msg.date ? new Date(msg.date).toLocaleString() : "—";

    if (title) title.textContent = msg.name || "Message";
    if (reply && msg.email) {
      reply.href = "mailto:" + msg.email;
      reply.hidden = false;
    } else if (reply) {
      reply.hidden = true;
    }

    if (body) {
      body.innerHTML =
        '<div class="msg-detail">' +
        '<div class="msg-detail-header">' +
        '<span class="msg-detail-avatar" aria-hidden="true">' +
        escapeHtml(initial) +
        "</span>" +
        '<div class="msg-detail-meta">' +
        "<strong>" +
        escapeHtml(msg.name || "Unknown") +
        "</strong>" +
        '<a href="mailto:' +
        escapeAttr(msg.email || "") +
        '">' +
        escapeHtml(msg.email || "—") +
        "</a>" +
        "</div>" +
        '<span class="msg-detail-badge ' +
        (msg.read ? "msg-card-badge--read" : "msg-card-badge--new") +
        '">' +
        (msg.read ? "Read" : "New") +
        "</span></div>" +
        '<time class="msg-detail-time" datetime="' +
        escapeAttr(msg.date || "") +
        '">' +
        escapeHtml(fullDate) +
        "</time>" +
        '<div class="msg-detail-body">' +
        escapeHtml(msg.message || "") +
        "</div></div>";
    }
    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }
    renderMessages();
    refreshDashboard(true);
  }

  function deleteMessage(id) {
    if (!confirm("Delete this message?")) return;
    var list = getMessages().filter(function (m) {
      return m.id !== id;
    });
    saveMessages(list);
    renderMessages();
    refreshDashboard(true);
    showToast("Message deleted.");
  }

  function bindVisitSiteClicks(grid) {
    if (!grid || grid.dataset.visitSiteBound) return;
    grid.dataset.visitSiteBound = "1";
    grid.addEventListener("click", function (e) {
      var link = e.target.closest("a.project-link--no-url");
      if (!link) return;
      e.preventDefault();
      showToast("Not published");
    });
  }

  function isCurrentExperience(exp) {
    var period = String(exp && exp.period ? exp.period : "").toLowerCase();
    return period.indexOf("present") !== -1;
  }

  function updateExperiencesStats(list) {
    var totalEl = document.getElementById("exp-stat-total");
    var currentEl = document.getElementById("exp-stat-current");
    if (totalEl) totalEl.textContent = String(list.length);
    if (currentEl) {
      currentEl.textContent = String(
        list.filter(function (exp) {
          return isCurrentExperience(exp);
        }).length
      );
    }
  }

  function moveExperience(id, direction) {
    var list = getExperiences();
    var idx = list.findIndex(function (exp) {
      return exp.id === id;
    });
    if (idx < 0) return;
    var next = direction === "up" ? idx - 1 : idx + 1;
    if (next < 0 || next >= list.length) return;
    var temp = list[idx];
    list[idx] = list[next];
    list[next] = temp;
    saveExperiences(list);
    renderExperiences();
    showToast("Order updated.");
  }

  function renderExperiences() {
    var listEl = document.getElementById("experience-list");
    var empty = document.getElementById("experience-empty");
    if (!listEl) return;

    var experiences = getExperiences();
    listEl.innerHTML = "";
    updateExperiencesStats(experiences);

    if (experiences.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    experiences.forEach(function (exp, i) {
      var card = document.createElement("article");
      card.className = "exp-card";
      card.setAttribute("role", "listitem");
      card.style.animationDelay = i * 0.06 + "s";

      var isCurrent = isCurrentExperience(exp);
      var imgSrc = getExperienceImageSrc(exp);
      var thumbHtml = imgSrc
        ? '<div class="exp-card-thumb"><img src="' +
          escapeAttr(imgSrc) +
          '" alt="' +
          escapeAttr((exp.organization || exp.title || "Experience") + " feature") +
          '" loading="lazy" /></div>'
        : "";

      card.innerHTML =
        (thumbHtml ? '<div class="exp-card-body-wrap">' + thumbHtml + '<div class="exp-card-main">' : "") +
        '<div class="exp-card-head">' +
        '<time class="exp-card-period">' +
        escapeHtml(exp.period || "") +
        "</time>" +
        (isCurrent ? '<span class="exp-card-badge">Current</span>' : "") +
        "</div>" +
        "<h4 class=\"exp-card-title\">" +
        escapeHtml(exp.title || "") +
        "</h4>" +
        '<p class="exp-card-org">' +
        escapeHtml(exp.organization || "") +
        "</p>" +
        '<p class="exp-card-desc">' +
        escapeHtml(exp.description || "") +
        "</p>" +
        '<div class="exp-card-actions">' +
        '<div class="exp-card-order">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-move-exp-up="' +
        escapeAttr(exp.id) +
        '" aria-label="Move up"' +
        (i === 0 ? " disabled" : "") +
        ">↑</button>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-move-exp-down="' +
        escapeAttr(exp.id) +
        '" aria-label="Move down"' +
        (i === experiences.length - 1 ? " disabled" : "") +
        ">↓</button>" +
        "</div>" +
        '<div class="exp-card-crud">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit-experience="' +
        escapeAttr(exp.id) +
        '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete-experience="' +
        escapeAttr(exp.id) +
        '">Delete</button>' +
        "</div></div>" +
        (thumbHtml ? "</div></div>" : "");
      listEl.appendChild(card);
    });

    listEl.querySelectorAll("[data-edit-experience]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openExperienceModal(btn.getAttribute("data-edit-experience"));
      });
    });

    listEl.querySelectorAll("[data-delete-experience]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteExperience(btn.getAttribute("data-delete-experience"));
      });
    });

    listEl.querySelectorAll("[data-move-exp-up]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moveExperience(btn.getAttribute("data-move-exp-up"), "up");
      });
    });

    listEl.querySelectorAll("[data-move-exp-down]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        moveExperience(btn.getAttribute("data-move-exp-down"), "down");
      });
    });
  }

  function setExperienceImageStatus(message, type) {
    var el = document.getElementById("experience-image-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "exp-image-status" + (type ? " is-" + type : "");
  }

  function resetExperienceImageFields() {
    pendingExperienceImage = null;
    var urlInput = document.getElementById("experience-image-url");
    var fileInput = document.getElementById("experience-image-file");
    if (urlInput) urlInput.value = "";
    if (fileInput) fileInput.value = "";
    setExperienceImageStatus("");
  }

  function getModalExperienceImageSrc() {
    if (pendingExperienceImage) return pendingExperienceImage;
    var urlInput = document.getElementById("experience-image-url");
    if (urlInput && urlInput.value.trim()) return urlInput.value.trim();
    return null;
  }

  function updateExperienceModalPreview() {
    var preview = document.getElementById("exp-modal-preview");
    var previewImg = document.getElementById("exp-modal-preview-img");
    var clearBtn = document.getElementById("experience-image-clear-btn");
    var titleInput = document.getElementById("experience-title");
    var orgInput = document.getElementById("experience-organization");
    var src = getModalExperienceImageSrc();

    if (preview) preview.hidden = !src;
    if (previewImg) {
      if (src) {
        previewImg.src = src;
        previewImg.alt =
          (orgInput && orgInput.value.trim()) ||
          (titleInput && titleInput.value.trim()) ||
          "Experience preview";
        previewImg.hidden = false;
      } else {
        previewImg.removeAttribute("src");
        previewImg.hidden = true;
      }
    }
    if (clearBtn) clearBtn.hidden = !src;
  }

  function openExperienceModal(id) {
    var modal = document.getElementById("experience-modal");
    var form = document.getElementById("experience-form");
    var title = document.getElementById("experience-modal-title");
    if (!form) return;

    form.reset();
    document.getElementById("experience-id").value = "";
    resetExperienceImageFields();

    if (id) {
      var exp = getExperiences().find(function (x) {
        return x.id === id;
      });
      if (!exp) return;
      if (title) title.textContent = "Edit Experience";
      document.getElementById("experience-id").value = exp.id;
      document.getElementById("experience-period").value = exp.period || "";
      document.getElementById("experience-datetime").value = exp.dateTime || "";
      document.getElementById("experience-title").value = exp.title || "";
      document.getElementById("experience-organization").value = exp.organization || "";
      document.getElementById("experience-description").value = exp.description || "";
      pendingExperienceImage = exp.imageData || null;
      var urlInput = document.getElementById("experience-image-url");
      if (urlInput) urlInput.value = exp.imageUrl || "";
      if (exp.imageData) setExperienceImageStatus("Using uploaded image.", "success");
      else if (exp.imageUrl) setExperienceImageStatus("Using image URL.", "success");
    } else if (title) {
      title.textContent = "Add Experience";
    }

    updateExperienceModalPreview();

    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }

    var periodInput = document.getElementById("experience-period");
    if (periodInput) {
      setTimeout(function () {
        periodInput.focus();
      }, 100);
    }
  }

  function closeExperienceModal() {
    var modal = document.getElementById("experience-modal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  function deleteExperience(id) {
    if (!confirm("Delete this experience entry?")) return;
    saveExperiences(
      getExperiences().filter(function (exp) {
        return exp.id !== id;
      })
    );
    renderExperiences();
    refreshDashboard(true);
    showToast("Experience removed.");
  }

  function renderProjects() {
    var grid = document.getElementById("projects-grid");
    var empty = document.getElementById("projects-empty");
    if (!grid) return;

    bindVisitSiteClicks(grid);

    var projects = getProjects();
    grid.innerHTML = "";
    updateProjectsStats(projects);

    if (projects.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    projects.forEach(function (p, i) {
      var card = document.createElement("article");
      card.className = "pj-card";
      card.setAttribute("role", "listitem");
      card.style.animationDelay = i * 0.07 + "s";

      var imageClass = p.imageClass || "project-image--none";
      var imgSrc = getProjectImageSrc(p);
      var tech = p.tech || [];
      var techHtml = tech
        .slice(0, 5)
        .map(function (t) {
          return "<li>" + escapeHtml(t) + "</li>";
        })
        .join("");
      if (tech.length > 5) techHtml += "<li>+" + (tech.length - 5) + "</li>";

      var linksHtml = buildProjectLinksHtml(p, { wrapClass: "pj-card-links" });

      card.innerHTML =
        '<div class="pj-card-banner ' +
        escapeAttr(imageClass) +
        (imgSrc ? " has-featured-image" : "") +
        '">' +
        projectBannerImgHtml(imgSrc, p.title) +
        '<span class="pj-card-tag">' +
        escapeHtml(p.tag || "Project") +
        "</span></div>" +
        '<div class="pj-card-body">' +
        "<h4 class=\"pj-card-title\">" +
        escapeHtml(p.title) +
        "</h4>" +
        '<p class="pj-card-desc">' +
        escapeHtml(p.description || "") +
        "</p>" +
        (techHtml ? '<ul class="pj-card-tech">' + techHtml + "</ul>" : "") +
        (linksHtml || "") +
        '<div class="pj-card-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit-project="' +
        escapeAttr(p.id) +
        '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-delete-project="' +
        escapeAttr(p.id) +
        '">Delete</button>' +
        "</div></div>";
      grid.appendChild(card);
    });

    grid.querySelectorAll("[data-edit-project]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openProjectModal(btn.getAttribute("data-edit-project"));
      });
    });

    grid.querySelectorAll("[data-delete-project]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteProject(btn.getAttribute("data-delete-project"));
      });
    });
  }

  function setProjectImageStatus(message, type) {
    var el = document.getElementById("project-image-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "pj-image-status" + (type ? " is-" + type : "");
  }

  function getModalPreviewImageSrc() {
    if (pendingProjectImage) return pendingProjectImage;
    var urlInput = document.getElementById("project-image-url");
    if (urlInput && urlInput.value.trim()) return urlInput.value.trim();
    return null;
  }

  function updateProjectSelectDecor() {
    var progressWrap = document.getElementById("project-progress-wrap");
    var progressSelect = document.getElementById("project-progress");
    if (progressWrap && progressSelect) {
      progressWrap.dataset.progress = normalizeProgress(progressSelect.value);
    }

    var swatch = document.getElementById("project-gradient-swatch");
    var imageSelect = document.getElementById("project-image");
    if (swatch && imageSelect) {
      swatch.className = "pj-select-swatch " + imageSelect.value;
    }
  }

  function updateProjectModalPreview() {
    var banner = document.getElementById("pj-modal-preview-banner");
    var previewImg = document.getElementById("pj-modal-preview-img");
    var tag = document.getElementById("pj-modal-preview-tag");
    var imageSelect = document.getElementById("project-image");
    var tagInput = document.getElementById("project-tag");
    var titleInput = document.getElementById("project-title");
    if (!banner) return;

    updateProjectSelectDecor();

    var theme = imageSelect ? imageSelect.value : "project-image--none";
    var src = getModalPreviewImageSrc();
    banner.className = "pj-modal-preview-banner " + theme + (src ? " has-featured-image" : "");

    if (previewImg) {
      if (src) {
        previewImg.src = src;
        previewImg.alt = titleInput ? titleInput.value.trim() || "Preview" : "Preview";
        previewImg.hidden = false;
      } else {
        previewImg.removeAttribute("src");
        previewImg.hidden = true;
      }
    }

    if (tag && tagInput) tag.textContent = tagInput.value.trim() || "Tag";

    var clearBtn = document.getElementById("project-image-clear-btn");
    if (clearBtn) clearBtn.hidden = !src;
  }

  function resetProjectImageFields() {
    pendingProjectImage = null;
    var urlInput = document.getElementById("project-image-url");
    var fileInput = document.getElementById("project-image-file");
    if (urlInput) urlInput.value = "";
    if (fileInput) fileInput.value = "";
    setProjectImageStatus("");
  }

  function openProjectModal(id) {
    var modal = document.getElementById("project-modal");
    var form = document.getElementById("project-form");
    var title = document.getElementById("project-modal-title");
    if (!form) return;

    form.reset();
    document.getElementById("project-id").value = "";
    resetProjectImageFields();

    if (id) {
      var p = getProjects().find(function (x) {
        return x.id === id;
      });
      if (!p) return;
      if (title) title.textContent = "Edit Project";
      document.getElementById("project-id").value = p.id;
      document.getElementById("project-title").value = p.title;
      document.getElementById("project-tag").value = p.tag || "";
      document.getElementById("project-description").value = p.description || "";
      document.getElementById("project-tech").value = (p.tech || []).join(", ");
      document.getElementById("project-demo").value = projectLinkUrl(p.demoUrl);
      document.getElementById("project-source").value = projectLinkUrl(p.sourceUrl);
      document.getElementById("project-image").value =
        p.imageClass || "project-image--none";
      document.getElementById("project-progress").value =
        p.progress === "in-progress" ? "in-progress" : "done";
      pendingProjectImage = p.imageData || null;
      var urlInput = document.getElementById("project-image-url");
      if (urlInput) urlInput.value = p.imageUrl || "";
      if (p.imageData) setProjectImageStatus("Using uploaded image.", "success");
      else if (p.imageUrl) setProjectImageStatus("Using image URL.", "success");
    } else {
      if (title) title.textContent = "Add Project";
    }

    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }
    updateProjectModalPreview();

    var titleInput = document.getElementById("project-title");
    if (titleInput) {
      setTimeout(function () {
        titleInput.focus();
      }, 100);
    }
  }

  function closeProjectModal() {
    var modal = document.getElementById("project-modal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
    clearTimeout(featuredImageFetchTimer);
    featuredImageFetchTimer = null;
    featuredImageFetchInFlight = false;
    pendingProjectSaveAfterFetch = false;
  }

  function deleteProject(id) {
    if (!confirm("Delete this project?")) return;
    saveProjects(
      getProjects().filter(function (p) {
        return p.id !== id;
      })
    );
    renderProjects();
    refreshDashboard(true);
    showToast("Project removed.");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;");
  }

  function truncate(str, len) {
    var s = String(str == null ? "" : str);
    return s.length <= len ? s : s.slice(0, len) + "…";
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  if (typeof FirehubSync !== "undefined") {
    FirehubSync.onSync(function (type) {
      if (type === "messages") handleMessagesSync();
    });
  }

  /* Init */
  if (isAuthenticated()) {
    showShell();
    refreshMessagesFromRemote(handleMessagesSync);
  } else {
    showLogin();
    var savedBrand = getSettings();
    applyLogoBranding(savedBrand);
    applyFavicon(savedBrand);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = document.getElementById("login-email");
      var passwordInput = document.getElementById("login-password");
      var error = document.getElementById("login-error");
      if (!emailInput || !passwordInput) return;

      emailInput.classList.remove("is-invalid");
      passwordInput.classList.remove("is-invalid");
      if (error) error.textContent = "";

      var email = emailInput.value.trim();
      var password = passwordInput.value;

      if (email !== password) {
        if (error) error.textContent = "Email and password must be the same.";
        emailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
        return;
      }

      if (email === getLoginEmail() && password === getLoginPassword()) {
        sessionStorage.setItem(STORAGE.auth, "1");
        showShell();
        refreshMessagesFromRemote(handleMessagesSync);
        showToast("Welcome back.");
      } else {
        if (error) error.textContent = "Incorrect email or password.";
        emailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      showLogin();
      showToast("Signed out.");
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      switchPanel(link.dataset.panel);
    });
  });

  if (menuToggle && adminSidebar) {
    menuToggle.addEventListener("click", function () {
      adminSidebar.classList.toggle("is-open");
    });
  }

  var contentForm = document.getElementById("content-form");
  var contentSaveTimer = null;

  function pushContentToSite(live) {
    var data = collectContentFormData();
    if (live) {
      try {
        localStorage.setItem(STORAGE.settings, JSON.stringify(data));
      } catch (e) {}
      notifySite("settings", data);
      applyLogoBranding(data);
      applyFavicon(data);
      return;
    }
    saveSettings(data);
  }

  var aboutPhotoUrl = document.getElementById("setting-aboutPhotoUrl");
  var aboutPhotoFile = document.getElementById("setting-aboutPhoto-file");
  var aboutPhotoUploadBtn = document.getElementById("about-photo-upload-btn");
  var aboutPhotoClearBtn = document.getElementById("about-photo-clear-btn");

  if (aboutPhotoUploadBtn && aboutPhotoFile) {
    aboutPhotoUploadBtn.addEventListener("click", function () {
      aboutPhotoFile.click();
    });
  }

  if (aboutPhotoFile) {
    aboutPhotoFile.addEventListener("change", function () {
      var file = aboutPhotoFile.files && aboutPhotoFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//)) {
        setAboutPhotoStatus("Please choose a JPEG, PNG, WebP, or GIF image.", "error");
        return;
      }

      if (file.size > MAX_ABOUT_PHOTO_BYTES) {
        setAboutPhotoStatus("Image is too large. Use a file under 900 KB or paste a URL.", "error");
        aboutPhotoFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingAboutPhoto = reader.result;
        if (aboutPhotoUrl) aboutPhotoUrl.value = "";
        setAboutPhotoStatus("Photo ready — save or wait for auto-sync.", "success");
        updateContentPreview();
      };
      reader.onerror = function () {
        setAboutPhotoStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (aboutPhotoClearBtn) {
    aboutPhotoClearBtn.addEventListener("click", function () {
      pendingAboutPhoto = null;
      if (aboutPhotoUrl) aboutPhotoUrl.value = "";
      if (aboutPhotoFile) aboutPhotoFile.value = "";
      var data = getSettings();
      data.aboutPhotoUrl = "";
      data.aboutPhotoData = "";
      saveSettings(data);
      setAboutPhotoStatus("");
      loadSettingsForm();
      showToast("About photo removed.");
    });
  }

  if (aboutPhotoUrl) {
    aboutPhotoUrl.addEventListener("input", function () {
      if (aboutPhotoUrl.value.trim()) pendingAboutPhoto = null;
      updateContentPreview();
    });
  }

  var heroPhotoUrl = document.getElementById("setting-heroPhotoUrl");
  var heroPhotoFile = document.getElementById("setting-heroPhoto-file");
  var heroPhotoUploadBtn = document.getElementById("hero-photo-upload-btn");
  var heroPhotoClearBtn = document.getElementById("hero-photo-clear-btn");

  if (heroPhotoUploadBtn && heroPhotoFile) {
    heroPhotoUploadBtn.addEventListener("click", function () {
      heroPhotoFile.click();
    });
  }

  if (heroPhotoFile) {
    heroPhotoFile.addEventListener("change", function () {
      var file = heroPhotoFile.files && heroPhotoFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//)) {
        setHeroPhotoStatus("Please choose a JPEG, PNG, WebP, or GIF image.", "error");
        return;
      }

      if (file.size > MAX_HERO_PHOTO_BYTES) {
        setHeroPhotoStatus("Image is too large. Use a file under 900 KB or paste a URL.", "error");
        heroPhotoFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingHeroPhoto = reader.result;
        if (heroPhotoUrl) heroPhotoUrl.value = "";
        setHeroPhotoStatus("Image ready — save or wait for auto-sync.", "success");
        updateContentPreview();
      };
      reader.onerror = function () {
        setHeroPhotoStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (heroPhotoClearBtn) {
    heroPhotoClearBtn.addEventListener("click", function () {
      pendingHeroPhoto = null;
      if (heroPhotoUrl) heroPhotoUrl.value = "";
      if (heroPhotoFile) heroPhotoFile.value = "";
      var data = getSettings();
      data.heroPhotoUrl = DEFAULT_SETTINGS.heroPhotoUrl;
      data.heroPhotoData = "";
      saveSettings(data);
      setHeroPhotoStatus("");
      loadSettingsForm();
      showToast("Hero portrait reset to default.");
    });
  }

  if (heroPhotoUrl) {
    heroPhotoUrl.addEventListener("input", function () {
      if (heroPhotoUrl.value.trim()) pendingHeroPhoto = null;
      updateContentPreview();
    });
  }

  if (contentForm) {
    contentForm.addEventListener("input", function () {
      updateContentPreview();
      clearTimeout(contentSaveTimer);
      contentSaveTimer = setTimeout(function () {
        pushContentToSite(true);
      }, 350);
    });

    contentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearTimeout(contentSaveTimer);
      var saveBtn = contentForm.querySelector(".sc-save-btn");
      if (saveBtn) saveBtn.classList.add("is-saving");

      pushContentToSite(false);
      pendingAboutPhoto = null;
      pendingHeroPhoto = null;
      loadSettingsForm();
      refreshDashboard(true);
      if (saveBtn) saveBtn.classList.remove("is-saving");
      showToast("Site content saved.");
    });
  }

  var resetContentBtn = document.getElementById("reset-content");
  if (resetContentBtn) {
    resetContentBtn.addEventListener("click", function () {
      if (!confirm("Reset all site content to defaults?")) return;
      localStorage.removeItem(STORAGE.settings);
      notifySite("settings");
      pendingAboutPhoto = null;
      pendingHeroPhoto = null;
      loadSettingsForm();
      loadLogoForm();
      updateContentPreview();
      animateContentPanel();
      refreshDashboard(true);
      showToast("Content reset to defaults.");
    });
  }

  var logoForm = document.getElementById("logo-form");
  var logoImageUrl = document.getElementById("setting-logoUrl");
  var logoImageFile = document.getElementById("setting-logo-file");
  var logoImageUploadBtn = document.getElementById("logo-image-upload-btn");
  var logoImageClearBtn = document.getElementById("logo-image-clear-btn");
  var logoTextInput = document.getElementById("setting-logoText");

  if (logoImageUploadBtn && logoImageFile) {
    logoImageUploadBtn.addEventListener("click", function () {
      logoImageFile.click();
    });
  }

  if (logoImageFile) {
    logoImageFile.addEventListener("change", function () {
      var file = logoImageFile.files && logoImageFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//)) {
        setLogoFormStatus("Please choose a JPEG, PNG, WebP, GIF, or SVG image.", "error");
        return;
      }

      if (file.size > MAX_LOGO_BYTES) {
        setLogoFormStatus("Logo is too large. Use a file under 500 KB or paste an image URL.", "error");
        logoImageFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingLogoImage = reader.result;
        if (logoImageUrl) logoImageUrl.value = "";
        setLogoFormStatus("Logo ready — click Save brand to apply.", "success");
        updateLogoPreview();
      };
      reader.onerror = function () {
        setLogoFormStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (logoImageClearBtn) {
    logoImageClearBtn.addEventListener("click", function () {
      pendingLogoImage = null;
      if (logoImageUrl) logoImageUrl.value = "";
      if (logoImageFile) logoImageFile.value = "";
      var data = getSettings();
      data.logoUrl = "";
      data.logoData = "";
      saveSettings(data);
      setLogoFormStatus("");
      loadLogoForm();
      showToast("Logo reset to default.");
    });
  }

  if (logoImageUrl) {
    logoImageUrl.addEventListener("input", function () {
      if (logoImageUrl.value.trim()) pendingLogoImage = null;
      updateLogoPreview();
    });
  }

  if (logoTextInput) {
    logoTextInput.addEventListener("input", updateLogoPreview);
  }

  if (logoForm) {
    logoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collectLogoFormData();
      try {
        saveSettings(data);
        pendingLogoImage = null;
        pendingFaviconImage = null;
        loadLogoForm();
        showToast("Brand saved. Portfolio updates automatically.");
      } catch (err) {
        setLogoFormStatus("Could not save — image may be too large. Try a smaller file or URL.", "error");
        showToast("Could not save brand settings.");
      }
    });
  }

  var faviconImageUrl = document.getElementById("setting-faviconUrl");
  var faviconImageFile = document.getElementById("setting-favicon-file");
  var faviconImageUploadBtn = document.getElementById("favicon-image-upload-btn");
  var faviconImageClearBtn = document.getElementById("favicon-image-clear-btn");

  if (faviconImageUploadBtn && faviconImageFile) {
    faviconImageUploadBtn.addEventListener("click", function () {
      faviconImageFile.click();
    });
  }

  if (faviconImageFile) {
    faviconImageFile.addEventListener("change", function () {
      var file = faviconImageFile.files && faviconImageFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//) && !/\.ico$/i.test(file.name)) {
        setFaviconFormStatus("Please choose a PNG, SVG, ICO, JPEG, WebP, or GIF.", "error");
        return;
      }

      if (file.size > MAX_FAVICON_BYTES) {
        setFaviconFormStatus("Favicon is too large. Use a file under 250 KB or paste a URL.", "error");
        faviconImageFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingFaviconImage = reader.result;
        if (faviconImageUrl) faviconImageUrl.value = "";
        setFaviconFormStatus("Favicon ready — click Save brand to apply.", "success");
        updateLogoPreview();
      };
      reader.onerror = function () {
        setFaviconFormStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (faviconImageClearBtn) {
    faviconImageClearBtn.addEventListener("click", function () {
      pendingFaviconImage = null;
      if (faviconImageUrl) faviconImageUrl.value = "";
      if (faviconImageFile) faviconImageFile.value = "";
      var data = getSettings();
      data.faviconUrl = "";
      data.faviconData = "";
      saveSettings(data);
      setFaviconFormStatus("");
      loadLogoForm();
      showToast("Favicon reset to default.");
    });
  }

  if (faviconImageUrl) {
    faviconImageUrl.addEventListener("input", function () {
      if (faviconImageUrl.value.trim()) pendingFaviconImage = null;
      updateLogoPreview();
    });
  }

  var socialLinksForm = document.getElementById("social-links-form");
  if (socialLinksForm) {
    socialLinksForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveSettings(collectSocialLinksFormData());
      loadSocialLinksForm();
      showToast("Social links saved. Portfolio updates automatically.");
    });
  }

  function bindAddProject(btn) {
    if (btn) {
      btn.addEventListener("click", function () {
        openProjectModal(null);
      });
    }
  }

  bindAddProject(document.getElementById("add-project-btn"));
  bindAddProject(document.getElementById("add-project-empty-btn"));

  function bindAddExperience(btn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      openExperienceModal(null);
    });
  }

  bindAddExperience(document.getElementById("add-experience-btn"));
  bindAddExperience(document.getElementById("add-experience-empty-btn"));

  var experienceForm = document.getElementById("experience-form");
  var experienceImageUrl = document.getElementById("experience-image-url");
  var experienceImageFile = document.getElementById("experience-image-file");
  var experienceImageUploadBtn = document.getElementById("experience-image-upload-btn");
  var experienceImageClearBtn = document.getElementById("experience-image-clear-btn");

  if (experienceImageUploadBtn && experienceImageFile) {
    experienceImageUploadBtn.addEventListener("click", function () {
      experienceImageFile.click();
    });
  }

  if (experienceImageFile) {
    experienceImageFile.addEventListener("change", function () {
      var file = experienceImageFile.files && experienceImageFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//)) {
        setExperienceImageStatus("Please choose a JPEG, PNG, WebP, or GIF image.", "error");
        return;
      }

      if (file.size > MAX_EXPERIENCE_IMAGE_BYTES) {
        setExperienceImageStatus("Image is too large. Use a file under 900 KB or paste a URL.", "error");
        experienceImageFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingExperienceImage = reader.result;
        if (experienceImageUrl) experienceImageUrl.value = "";
        setExperienceImageStatus("Image ready — save to apply.", "success");
        updateExperienceModalPreview();
      };
      reader.onerror = function () {
        setExperienceImageStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (experienceImageClearBtn) {
    experienceImageClearBtn.addEventListener("click", function () {
      resetExperienceImageFields();
      updateExperienceModalPreview();
    });
  }

  if (experienceImageUrl) {
    experienceImageUrl.addEventListener("input", function () {
      if (experienceImageUrl.value.trim()) pendingExperienceImage = null;
      updateExperienceModalPreview();
    });
  }

  if (experienceForm) {
    experienceForm.addEventListener("input", updateExperienceModalPreview);

    experienceForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var id = document.getElementById("experience-id").value;
      var imageUrl = experienceImageUrl ? experienceImageUrl.value.trim() : "";
      var entry = {
        id: id || generateId(),
        period: document.getElementById("experience-period").value.trim(),
        dateTime: document.getElementById("experience-datetime").value.trim(),
        title: document.getElementById("experience-title").value.trim(),
        organization: document.getElementById("experience-organization").value.trim(),
        description: document.getElementById("experience-description").value.trim(),
        imageUrl: imageUrl,
        imageData: pendingExperienceImage,
      };

      if (entry.imageData) entry.imageUrl = "";

      if (!entry.period || !entry.title || !entry.organization || !entry.description) return;

      var list = getExperiences();
      var idx = list.findIndex(function (exp) {
        return exp.id === entry.id;
      });
      if (idx >= 0) list[idx] = entry;
      else list.unshift(entry);

      try {
        saveExperiences(list);
      } catch (err) {
        showToast("Could not save — image may be too large. Try a URL instead.");
        return;
      }
      closeExperienceModal();
      renderExperiences();
      refreshDashboard(true);
      showToast("Experience saved.");
    });
  }

  var projectForm = document.getElementById("project-form");
  var projectImageUrl = document.getElementById("project-image-url");
  var projectImageFile = document.getElementById("project-image-file");
  var projectImageUploadBtn = document.getElementById("project-image-upload-btn");
  var projectImageClearBtn = document.getElementById("project-image-clear-btn");

  if (projectImageUploadBtn && projectImageFile) {
    projectImageUploadBtn.addEventListener("click", function () {
      projectImageFile.click();
    });
  }

  if (projectImageFile) {
    projectImageFile.addEventListener("change", function () {
      var file = projectImageFile.files && projectImageFile.files[0];
      if (!file) return;

      if (!file.type.match(/^image\//)) {
        setProjectImageStatus("Please choose a JPEG, PNG, WebP, or GIF image.", "error");
        return;
      }

      if (file.size > MAX_PROJECT_IMAGE_BYTES) {
        setProjectImageStatus("Image is too large. Use a file under 900 KB or paste an image URL.", "error");
        projectImageFile.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        pendingProjectImage = reader.result;
        if (projectImageUrl) projectImageUrl.value = "";
        setProjectImageStatus("Image ready — save the project to apply.", "success");
        updateProjectModalPreview();
      };
      reader.onerror = function () {
        setProjectImageStatus("Could not read that file.", "error");
      };
      reader.readAsDataURL(file);
    });
  }

  if (projectImageClearBtn) {
    projectImageClearBtn.addEventListener("click", function () {
      resetProjectImageFields();
      updateProjectModalPreview();
    });
  }

  if (projectImageUrl) {
    projectImageUrl.addEventListener("input", function () {
      if (projectImageUrl.value.trim()) pendingProjectImage = null;
      updateProjectModalPreview();
    });
  }

  function finishFeaturedImageFetch(err, imageUrl, storedDataUrl) {
    featuredImageFetchInFlight = false;
    if ((imageUrl || storedDataUrl) && !projectModalHasFeaturedImage()) {
      applyFetchedFeaturedImage(imageUrl, storedDataUrl);
    } else if (err && !projectModalHasFeaturedImage()) {
      setProjectImageStatus("Could not fetch preview — paste a URL or upload an image.", "error");
    }
    if (pendingProjectSaveAfterFetch) {
      pendingProjectSaveAfterFetch = false;
      saveProjectFromForm();
    }
  }

  function tryAutoFetchFeaturedImage() {
    if (projectModalHasFeaturedImage() || featuredImageFetchInFlight) return;

    var demoInput = document.getElementById("project-demo");
    var sourceInput = document.getElementById("project-source");
    var demoUrl = demoInput ? demoInput.value.trim() : "";
    var sourceUrl = sourceInput ? sourceInput.value.trim() : "";
    var targetUrl = getProjectFeaturedImageTargetUrl(demoUrl, sourceUrl);
    if (!targetUrl) return;

    featuredImageFetchInFlight = true;
    setProjectImageStatus("Capturing landing page preview…", "");

    fetchFeaturedImageFromProjectLinks(demoUrl, sourceUrl, finishFeaturedImageFetch);
  }

  function scheduleFeaturedImageFetch() {
    clearTimeout(featuredImageFetchTimer);
    featuredImageFetchTimer = setTimeout(tryAutoFetchFeaturedImage, 900);
  }

  ["project-demo", "project-source"].forEach(function (inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", scheduleFeaturedImageFetch);
    input.addEventListener("blur", tryAutoFetchFeaturedImage);
  });

  if (projectForm) {
    projectForm.addEventListener("input", updateProjectModalPreview);

    var progressSelect = document.getElementById("project-progress");
    var imageSelect = document.getElementById("project-image");
    if (progressSelect) {
      progressSelect.addEventListener("change", updateProjectModalPreview);
    }
    if (imageSelect) {
      imageSelect.addEventListener("change", updateProjectModalPreview);
    }
  }

  function saveProjectFromForm() {
    var id = document.getElementById("project-id").value;
    var techRaw = document.getElementById("project-tech").value;
    var imageUrl = projectImageUrl ? projectImageUrl.value.trim() : "";
    var project = {
      id: id || generateId(),
      title: document.getElementById("project-title").value.trim(),
      tag: document.getElementById("project-tag").value.trim(),
      description: document.getElementById("project-description").value.trim(),
      tech: techRaw
        .split(",")
        .map(function (t) {
          return t.trim();
        })
        .filter(Boolean),
      demoUrl: document.getElementById("project-demo").value.trim(),
      sourceUrl: document.getElementById("project-source").value.trim(),
      imageClass:
        document.getElementById("project-image").value.trim() || "project-image--none",
      progress: normalizeProgress(
        document.getElementById("project-progress").value || "done"
      ),
      imageUrl: imageUrl,
      imageData: pendingProjectImage,
    };

    if (project.imageData) project.imageUrl = "";

    if (!project.title) return;

    var list = getProjects();
    var idx = list.findIndex(function (p) {
      return p.id === project.id;
    });
    if (idx >= 0) list[idx] = project;
    else list.push(project);

    try {
      saveProjects(list);
    } catch (err) {
      showToast("Could not save — image may be too large. Try a URL instead.");
      return;
    }
    closeProjectModal();
    renderProjects();
    refreshDashboard(true);
    showToast("Project saved.");
  }

  if (projectForm) {
    projectForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!document.getElementById("project-title").value.trim()) return;

      if (projectModalHasFeaturedImage()) {
        saveProjectFromForm();
        return;
      }

      var demoUrl = document.getElementById("project-demo").value.trim();
      var sourceUrl = document.getElementById("project-source").value.trim();
      if (!getProjectFeaturedImageTargetUrl(demoUrl, sourceUrl)) {
        saveProjectFromForm();
        return;
      }

      if (featuredImageFetchInFlight) {
        pendingProjectSaveAfterFetch = true;
        setProjectImageStatus("Capturing landing page preview — saving when ready…", "");
        return;
      }

      featuredImageFetchInFlight = true;
      setProjectImageStatus("Capturing landing page preview…", "");

      fetchFeaturedImageFromProjectLinks(demoUrl, sourceUrl, function (err, imageUrl, storedDataUrl) {
        if ((imageUrl || storedDataUrl) && !projectModalHasFeaturedImage()) {
          applyFetchedFeaturedImage(imageUrl, storedDataUrl);
        } else if (err) {
          setProjectImageStatus("Could not fetch preview — saving without an image.", "error");
        }
        featuredImageFetchInFlight = false;
        saveProjectFromForm();
      });
    });
  }

  var passwordForm = document.getElementById("password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var current = document.getElementById("current-password");
      var next = document.getElementById("new-password");
      var confirm = document.getElementById("confirm-password");
      var err = document.getElementById("password-error");

      if (!current || !next || !confirm) return;
      if (current.value !== getLoginPassword()) {
        if (err) err.textContent = "Current password is incorrect.";
        return;
      }
      if (next.value.length < 6) {
        if (err) err.textContent = "New password must be at least 6 characters.";
        return;
      }
      if (next.value !== confirm.value) {
        if (err) err.textContent = "Passwords do not match.";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.value)) {
        if (err) err.textContent = "Use a valid email address (email and password stay the same).";
        return;
      }

      setLoginCredentials(next.value.trim());
      if (err) err.textContent = "";
      passwordForm.reset();
      updateSettingsPanel();
      showToast("Login email and password updated.");
    });
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-close-modal");
      if (target === "project-modal") {
        closeProjectModal();
        return;
      }
      if (target === "experience-modal") {
        closeExperienceModal();
        return;
      }
      var modal = document.getElementById(target);
      if (modal) {
        modal.hidden = true;
        if (target === "message-modal") document.body.style.overflow = "";
      }
    });
  });

  document.querySelectorAll(".admin-modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target !== overlay) return;
      if (overlay.id === "project-modal") {
        closeProjectModal();
      } else if (overlay.id === "experience-modal") {
        closeExperienceModal();
      } else {
        overlay.hidden = true;
        if (overlay.id === "message-modal") document.body.style.overflow = "";
      }
    });
  });

  document.querySelectorAll("[data-stg-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchSettingsTab(btn.getAttribute("data-stg-tab"));
    });
  });

  document.querySelectorAll("[data-msg-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = btn.getAttribute("data-msg-filter");
      if (!next || next === messageFilter) return;
      messageFilter = next;
      renderMessages();
    });
  });

  var markAllRead = document.getElementById("mark-all-read");
  if (markAllRead) {
    markAllRead.addEventListener("click", function () {
      var list = getMessages().map(function (m) {
        m.read = true;
        return m;
      });
      saveMessages(list);
      renderMessages();
      refreshDashboard(true);
      showToast("All messages marked as read.");
    });
  }

  var exportBtn = document.getElementById("export-data");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportBtn.classList.add("is-exporting");
      var blob = new Blob(
        [
          JSON.stringify(
            {
              settings: getSettings(),
              projects: getProjects(),
              experiences: getExperiences(),
              messages: getMessages(),
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "firehub-export.json";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Data exported.");
      setTimeout(function () {
        exportBtn.classList.remove("is-exporting");
      }, 1200);
    });
  }
})();
