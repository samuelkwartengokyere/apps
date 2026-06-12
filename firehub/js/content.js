(function () {
  "use strict";

  var SETTINGS_KEY = "firehub_settings";
  var PROJECTS_KEY = "firehub_projects";
  var EXPERIENCES_KEY = "firehub_experiences";

  var DEFAULT_SOCIAL = {
    githubUrl: "https://github.com/samuelkwartengokyere",
    linkedinUrl: "https://linkedin.com/in/samuel-kwarteng-okyere",
    email: "samfine278@gmail.com",
  };

  function loadJson(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function applySettingsData(settings) {
    if (!settings) {
      window.__firehubStaticRole = false;
      applyLogoBranding({ logoText: "FireHub" });
      applyFavicon(null);
      applySocialLinks(DEFAULT_SOCIAL);
      return;
    }

    setText(".hero-title .text-gradient", settings.heroName);
    setText(".hero-description", settings.heroDescription);
    applyHeroPhoto(settings);
    applyAboutSection(settings);

    if (settings.heroRole && typeof window.FirehubHeroTyping !== "undefined") {
      window.FirehubHeroTyping.applyFromSettings(settings);
    } else if (settings.heroRole) {
      var roles = settings.heroRole.split(/\s*\|\|\s*|\s*\|\s*/).map(function (r) {
        return r.trim();
      }).filter(Boolean);
      setText("#typed-role", roles[0] || settings.heroRole);
    } else if (typeof window.FirehubHeroTyping !== "undefined") {
      window.FirehubHeroTyping.applyFromSettings(null);
    }

    var stats = document.querySelectorAll(".hero-stats .stat");
    if (stats[0] && settings.statProjects) {
      stats[0].querySelector(".stat-value").textContent = settings.statProjects;
    }
    if (stats[1] && settings.statYears) {
      stats[1].querySelector(".stat-value").textContent = settings.statYears;
    }
    if (stats[2] && settings.statPassion) {
      stats[2].querySelector(".stat-value").textContent = settings.statPassion;
    }

    if (settings.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
        link.href = "mailto:" + settings.email;
        if (link.textContent.indexOf("@") !== -1) {
          link.textContent = settings.email;
        }
      });
    }

    applySocialLinks(settings);
    applyLogoBranding(settings);
    applyFavicon(settings);
  }

  var SOCIAL_PLATFORMS = [
    {
      id: "github",
      settingKey: "githubUrl",
      label: "GitHub",
      external: true,
      svg:
        '<path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.86-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.55 1.07 1.55 1.07.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.83.01 1.67.11 2.45.33 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/>',
    },
    {
      id: "linkedin",
      settingKey: "linkedinUrl",
      label: "LinkedIn",
      external: true,
      svg:
        '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/>',
    },
    {
      id: "email",
      settingKey: "email",
      label: "Email",
      external: false,
      svg:
        '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/>',
    },
  ];

  function getSocialHref(platform, value) {
    if (platform.id === "email") return "mailto:" + value;
    return value;
  }

  function buildSocialIconLink(platform, href) {
    var link = document.createElement("a");
    link.href = href;
    link.className = "social-icon social-icon--" + platform.id;
    link.setAttribute("aria-label", platform.label);
    if (platform.external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + platform.svg + "</svg>";
    return link;
  }

  function renderSocialIcons(container, settings) {
    if (!container || !settings) return 0;

    container.innerHTML = "";
    var count = 0;

    SOCIAL_PLATFORMS.forEach(function (platform) {
      var value = settings[platform.settingKey];
      if (!value || !String(value).trim()) return;
      value = String(value).trim();
      container.appendChild(buildSocialIconLink(platform, getSocialHref(platform, value)));
      count += 1;
    });

    return count;
  }

  function applySocialLinks(settings) {
    if (!settings) return;

    var totalIcons = 0;

    document.querySelectorAll(".social-links").forEach(function (container) {
      totalIcons = Math.max(totalIcons, renderSocialIcons(container, settings));
    });

    document.querySelectorAll(".contact-social-icons").forEach(function (container) {
      totalIcons = Math.max(totalIcons, renderSocialIcons(container, settings));
    });

    var contactSocialItem = document.getElementById("contact-social-item");
    if (contactSocialItem) {
      contactSocialItem.hidden = totalIcons === 0;
    }
  }

  var DEFAULT_FAVICON = "assets/favicon.svg";

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

  function getLogoSrcFromSettings(settings) {
    if (!settings) return "";
    if (settings.logoData) return settings.logoData;
    if (settings.logoUrl && String(settings.logoUrl).trim()) return String(settings.logoUrl).trim();
    return "";
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
      } else {
        img.removeAttribute("src");
        img.hidden = true;
        logo.classList.remove("has-custom-logo");
        if (mark) mark.hidden = false;
        if (textEl) textEl.hidden = false;
      }
    });
  }

  function applySettings() {
    applySettingsData(loadJson(SETTINGS_KEY));
  }

  function applyAboutSection(settings) {
    if (!settings) return;

    setText("#about-heading", settings.aboutHeading || "About Me");
    setText("#about-lead", settings.aboutLead);

    var body1 = document.getElementById("about-body-1");
    var body2 = document.getElementById("about-body-2");
    if (body1) body1.textContent = settings.aboutBody1 || "";
    if (body2) body2.textContent = settings.aboutBody2 || "";

    setText("#about-badge-text", settings.aboutBadge);

    var cta = document.getElementById("about-cta");
    if (cta) cta.textContent = settings.aboutCtaText || "Let's Talk";

    var factLoc = document.getElementById("about-fact-location");
    if (factLoc && settings.aboutLocation) {
      factLoc.innerHTML =
        "<strong>Location:</strong> " + escapeHtml(settings.aboutLocation);
    }
    var factFocus = document.getElementById("about-fact-focus");
    if (factFocus && settings.aboutFocus) {
      factFocus.innerHTML = "<strong>Focus:</strong> " + escapeHtml(settings.aboutFocus);
    }
    var factEdu = document.getElementById("about-fact-education");
    if (factEdu && settings.aboutEducation) {
      factEdu.innerHTML =
        "<strong>Education:</strong> " + escapeHtml(settings.aboutEducation);
    }

    var photoSrc = getAboutPhotoSrc(settings);
    var img = document.getElementById("about-photo-img");
    var initial = document.getElementById("about-photo-initial");
    var photoWrap = document.getElementById("about-photo");

    var letter =
      (settings.aboutPhotoInitial && String(settings.aboutPhotoInitial).trim().charAt(0)) ||
      (settings.heroName && String(settings.heroName).trim().charAt(0).toUpperCase()) ||
      "S";

    if (img) {
      if (photoSrc) {
        img.src = photoSrc;
        img.alt = settings.heroName ? settings.heroName + " profile photo" : "Profile photo";
        img.hidden = false;
        if (photoWrap) photoWrap.classList.add("has-photo");
      } else {
        img.removeAttribute("src");
        img.hidden = true;
        if (photoWrap) photoWrap.classList.remove("has-photo");
      }
    }
    if (initial) {
      initial.textContent = letter;
      initial.hidden = !!photoSrc;
    }
  }

  function applyHeroPhoto(settings) {
    var img = document.getElementById("hero-profile-img");
    var initial = document.getElementById("hero-profile-initial");
    var wrap = document.querySelector(".profile-placeholder");
    if (!img) return;

    var defaultSrc = img.getAttribute("data-default-src");
    if (!defaultSrc && img.getAttribute("src")) {
      defaultSrc = img.getAttribute("src");
      img.setAttribute("data-default-src", defaultSrc);
    }

    var customSrc = "";
    if (settings) {
      if (settings.heroPhotoData) customSrc = settings.heroPhotoData;
      else if (settings.heroPhotoUrl && String(settings.heroPhotoUrl).trim()) {
        customSrc = String(settings.heroPhotoUrl).trim();
      }
    }

    var src = customSrc || defaultSrc || "";
    if (src) {
      img.src = src;
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }

    var name = (settings && settings.heroName && String(settings.heroName).trim()) || "Samuel";
    img.alt = name + " portrait";

    var letter = name.charAt(0).toUpperCase() || "S";
    if (wrap) wrap.classList.toggle("has-photo", !!src);
    if (initial) {
      initial.textContent = letter;
      initial.hidden = !!src;
    }
  }

  function getAboutPhotoSrc(settings) {
    if (!settings) return "";
    if (settings.aboutPhotoData) return settings.aboutPhotoData;
    if (settings.aboutPhotoUrl && String(settings.aboutPhotoUrl).trim()) {
      return String(settings.aboutPhotoUrl).trim();
    }
    return "";
  }

  function setText(selector, text) {
    if (!text) return;
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

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

  /** Live demo first, then source — one “Visit Site” link. */
  function getProjectVisitUrl(p) {
    return projectLinkUrl(p.demoUrl) || projectLinkUrl(p.sourceUrl);
  }

  function buildProjectLinksHtml(p) {
    if (!isProjectDone(p)) {
      return (
        '<div class="project-links">' +
        '<span class="project-status project-status--progress">In Progress</span>' +
        "</div>"
      );
    }

    var url = getProjectVisitUrl(p);
    var linkHtml = url
      ? '<a href="' +
        escapeAttr(url) +
        '" class="project-link" target="_blank" rel="noopener noreferrer">Visit Site</a>'
      : '<a href="#" class="project-link project-link--no-url">Visit Site</a>';

    return '<div class="project-links">' + linkHtml + "</div>";
  }

  function showSiteToast(message) {
    var toast = document.getElementById("site-toast");
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showSiteToast._timer);
    showSiteToast._timer = setTimeout(function () {
      toast.classList.remove("is-visible");
      toast.hidden = true;
    }, 2800);
  }

  function bindVisitSiteClicks(grid) {
    if (!grid || grid.dataset.visitSiteBound) return;
    grid.dataset.visitSiteBound = "1";
    grid.addEventListener("click", function (e) {
      var link = e.target.closest("a.project-link--no-url");
      if (!link) return;
      e.preventDefault();
      showSiteToast("Not published");
    });
  }

  var FEATURED_EXPERIENCE_LIMIT = 4;

  function getExperienceLimit(timeline) {
    if (!timeline || timeline.dataset.experienceLimit === undefined) return 0;
    var n = parseInt(timeline.dataset.experienceLimit, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  function appendExperienceItem(timeline, exp) {
    var article = document.createElement("article");
    article.className = "timeline-item reveal is-visible";
    var dateTime = exp.dateTime ? String(exp.dateTime).trim() : "";
    var timeHtml = dateTime
      ? '<time datetime="' + escapeAttr(dateTime) + '">' + escapeHtml(exp.period || "") + "</time>"
      : "<time>" + escapeHtml(exp.period || "") + "</time>";
    var imgSrc =
      exp.imageData ||
      (exp.imageUrl && String(exp.imageUrl).trim() ? String(exp.imageUrl).trim() : "");
    var imageHtml = imgSrc
      ? '<figure class="timeline-figure">' +
        '<img class="timeline-featured-img" src="' +
        escapeAttr(imgSrc) +
        '" alt="' +
        escapeAttr(
          (exp.organization ? exp.organization + " — " : "") + (exp.title || "Experience")
        ) +
        '" loading="lazy" />' +
        "</figure>"
      : "";
    article.innerHTML =
      '<div class="timeline-marker" aria-hidden="true"></div>' +
      '<div class="timeline-content' +
      (imgSrc ? " timeline-content--has-image" : "") +
      '">' +
      imageHtml +
      timeHtml +
      "<h3>" +
      escapeHtml(exp.title || "") +
      "</h3>" +
      '<p class="timeline-org">' +
      escapeHtml(exp.organization || "") +
      "</p>" +
      "<p>" +
      escapeHtml(exp.description || "") +
      "</p>" +
      "</div>";
    timeline.appendChild(article);
  }

  function updateExperienceViewAll(experiences, limit) {
    var moreEl = document.getElementById("experience-more");
    if (!moreEl) return;
    var show = limit > 0 && experiences.length > limit;
    moreEl.hidden = !show;
    if (show) {
      var link = moreEl.querySelector(".experience-view-all");
      if (link) {
        link.textContent = "View all experience (" + experiences.length + ")";
      }
    }
  }

  function applyExperiences() {
    var experiences = loadJson(EXPERIENCES_KEY);
    var timelines = document.querySelectorAll(".timeline");
    if (!timelines.length) return;

    if (experiences === null) return;

    if (!experiences.length) {
      timelines.forEach(function (timeline) {
        timeline.innerHTML =
          '<p class="section-intro">No experience entries yet.</p>';
      });
      var homeEmpty = document.getElementById("experience-timeline");
      if (homeEmpty) updateExperienceViewAll([], getExperienceLimit(homeEmpty));
      var countEmpty = document.getElementById("experience-all-count");
      if (countEmpty) countEmpty.textContent = "0";
      return;
    }

    timelines.forEach(function (timeline) {
      var limit = getExperienceLimit(timeline);
      var visible = limit > 0 ? experiences.slice(0, limit) : experiences;

      timeline.innerHTML = "";

      visible.forEach(function (exp) {
        appendExperienceItem(timeline, exp);
      });
    });

    var homeTimeline = document.getElementById("experience-timeline");
    if (homeTimeline) {
      updateExperienceViewAll(experiences, getExperienceLimit(homeTimeline));
    }

    var countEl = document.getElementById("experience-all-count");
    if (countEl) countEl.textContent = String(experiences.length);
  }

  var FEATURED_PROJECTS_LIMIT = 3;

  function getProjectsLimit(grid) {
    if (!grid || !grid.dataset.projectsLimit) return 0;
    var n = parseInt(grid.dataset.projectsLimit, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  function appendProjectCard(grid, p) {
    var techHtml = (p.tech || [])
      .map(function (t) {
        return "<li>" + escapeHtml(t) + "</li>";
      })
      .join("");

    var imageClass = p.imageClass || "project-image--none";
    var imgSrc = p.imageData || (p.imageUrl && String(p.imageUrl).trim()) || null;
    var imgHtml = imgSrc
      ? '<img class="project-featured-img" src="' +
        escapeAttr(imgSrc) +
        '" alt="' +
        escapeAttr(p.title || "Project") +
        '" loading="lazy" />'
      : "";

    var article = document.createElement("article");
    article.className = "project-card reveal is-visible";
    article.innerHTML =
      '<div class="project-image ' +
      escapeAttr(imageClass) +
      (imgSrc ? " has-featured-image" : "") +
      '">' +
      imgHtml +
      '<span class="project-tag">' +
      escapeHtml(p.tag || "") +
      "</span></div>" +
      '<div class="project-body">' +
      "<h3>" +
      escapeHtml(p.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(p.description) +
      "</p>" +
      '<ul class="project-tech">' +
      techHtml +
      "</ul>" +
      buildProjectLinksHtml(p) +
      "</div>";
    grid.appendChild(article);
  }

  function updateProjectsViewAll(projects, limit) {
    var moreEl = document.getElementById("projects-more");
    if (!moreEl) return;
    var show = limit > 0 && projects.length > limit;
    moreEl.hidden = !show;
    if (show) {
      var link = moreEl.querySelector(".projects-view-all");
      if (link) {
        link.textContent = "View all projects (" + projects.length + ")";
      }
    }
  }

  function applyProjects() {
    var projects = loadJson(PROJECTS_KEY);
    var grid = document.querySelector(".projects-grid");
    if (!grid) return;

    if (projects === null) return;

    if (!projects.length) {
      grid.innerHTML =
        '<p class="section-intro" style="grid-column:1/-1">No featured projects yet.</p>';
      updateProjectsViewAll([], getProjectsLimit(grid));
      return;
    }

    var limit = getProjectsLimit(grid);
    var visible = limit > 0 ? projects.slice(0, limit) : projects;

    grid.innerHTML = "";
    bindVisitSiteClicks(grid);

    visible.forEach(function (p) {
      appendProjectCard(grid, p);
    });

    updateProjectsViewAll(projects, limit);

    var countEl = document.getElementById("projects-all-count");
    if (countEl) countEl.textContent = String(projects.length);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;");
  }

  function handleSync(type, newValue, message) {
    if (message && message.live && message.data && type === "settings") {
      applySettingsData(message.data);
      return;
    }

    if (type === "settings") {
      if (newValue === null && !message) {
        window.location.reload();
        return;
      }
      applySettings();
      return;
    }

    if (type === "projects") {
      applyProjects();
    }

    if (type === "experiences") {
      applyExperiences();
    }
  }

  if (typeof FirehubSync !== "undefined") {
    FirehubSync.onSync(handleSync);
  }

  window.FirehubContent = {
    applySettings: applySettings,
    applyProjects: applyProjects,
    applyExperiences: applyExperiences,
    applySettingsData: applySettingsData,
  };

  applySettings();
  applyProjects();
  applyExperiences();

  var projectsGrid = document.querySelector(".projects-grid");
  if (projectsGrid) bindVisitSiteClicks(projectsGrid);
})();
