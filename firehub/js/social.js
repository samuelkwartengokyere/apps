(function () {
  "use strict";

  var PLATFORMS = [
    {
      id: "github",
      label: "GitHub",
      external: true,
      placeholder: "https://github.com/username",
      svg:
        '<path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.86-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.55 1.07 1.55 1.07.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.222-.26-4.556-1.14-4.556-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.83.01 1.67.11 2.45.33 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/>',
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      external: true,
      placeholder: "https://linkedin.com/in/your-profile",
      svg:
        '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/>',
    },
    {
      id: "email",
      label: "Email",
      external: false,
      placeholder: "hello@yourdomain.dev",
      svg:
        '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/>',
    },
    {
      id: "twitter",
      label: "X (Twitter)",
      external: true,
      placeholder: "https://x.com/username",
      svg:
        '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
    },
    {
      id: "instagram",
      label: "Instagram",
      external: true,
      placeholder: "https://instagram.com/username",
      svg:
        '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
    },
    {
      id: "youtube",
      label: "YouTube",
      external: true,
      placeholder: "https://youtube.com/@channel",
      svg:
        '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
    },
    {
      id: "tiktok",
      label: "TikTok",
      external: true,
      placeholder: "https://tiktok.com/@username",
      svg:
        '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.75-.01-9.49.02-14.24z"/>',
    },
    {
      id: "facebook",
      label: "Facebook",
      external: true,
      placeholder: "https://facebook.com/username",
      svg:
        '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
    },
    {
      id: "discord",
      label: "Discord",
      external: true,
      placeholder: "https://discord.gg/invite",
      svg:
        '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>',
    },
    {
      id: "twitch",
      label: "Twitch",
      external: true,
      placeholder: "https://twitch.tv/username",
      svg:
        '<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>',
    },
    {
      id: "threads",
      label: "Threads",
      external: true,
      placeholder: "https://threads.net/@username",
      svg:
        '<path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.023.88-.73 2.115-1.111 3.584-1.098 1.036.008 1.96.18 2.77.51-.003-.39-.053-.78-.15-1.167-.337-1.435-1.33-2.215-2.96-2.32-1.08-.07-2.1.248-2.87.89-.77.64-1.18 1.55-1.18 2.63h-2.16c0-1.66.64-3.09 1.84-4.14C8.94 1.32 10.32.84 11.88.91c2.33.15 4.02 1.4 4.62 3.51.47 1.66.32 3.45-.09 4.99 1.75.63 3.05 1.76 3.73 3.26.75 1.72.78 4.02-1.17 5.94-1.9 1.86-4.39 2.65-7.77 2.69Z"/>',
    },
    {
      id: "website",
      label: "Website",
      external: true,
      placeholder: "https://yourwebsite.com",
      svg:
        '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>',
    },
  ];

  var DEFAULT_LINKS = [
    { platform: "github", url: "https://github.com/samuelkwartengokyere" },
    { platform: "linkedin", url: "https://linkedin.com/in/samuel-kwarteng-okyere" },
    { platform: "email", url: "samfine278@gmail.com" },
  ];

  var platformMap = {};
  PLATFORMS.forEach(function (platform) {
    platformMap[platform.id] = platform;
  });

  function getPlatform(id) {
    return platformMap[id] || null;
  }

  function normalizeLink(link) {
    if (!link || !link.platform || !link.url) return null;
    var url = String(link.url).trim();
    if (!url || !getPlatform(link.platform)) return null;
    return { platform: link.platform, url: url };
  }

  function getSocialLinks(settings) {
    if (settings && Array.isArray(settings.socialLinks) && settings.socialLinks.length) {
      var normalized = settings.socialLinks.map(normalizeLink).filter(Boolean);
      if (normalized.length) return normalized;
    }

    if (settings) {
      var legacy = [];
      if (settings.githubUrl) legacy.push({ platform: "github", url: settings.githubUrl });
      if (settings.linkedinUrl) legacy.push({ platform: "linkedin", url: settings.linkedinUrl });
      if (settings.email) legacy.push({ platform: "email", url: settings.email });
      if (legacy.length) return legacy;
    }

    return DEFAULT_LINKS.slice();
  }

  function getHref(platformId, url) {
    if (platformId === "email") return "mailto:" + url;
    return url;
  }

  function buildIconLink(link) {
    var platform = getPlatform(link.platform);
    if (!platform) return null;

    var anchor = document.createElement("a");
    anchor.href = getHref(link.platform, link.url);
    anchor.className = "social-icon social-icon--" + link.platform;
    anchor.setAttribute("aria-label", platform.label);
    if (platform.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
    anchor.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + platform.svg + "</svg>";
    return anchor;
  }

  function renderIcons(container, settings) {
    if (!container) return 0;

    container.innerHTML = "";
    var count = 0;

    getSocialLinks(settings).forEach(function (link) {
      var icon = buildIconLink(link);
      if (!icon) return;
      container.appendChild(icon);
      count += 1;
    });

    return count;
  }

  function syncLegacyFields(links) {
    var legacy = { githubUrl: "", linkedinUrl: "", email: "" };
    links.forEach(function (link) {
      if (link.platform === "github") legacy.githubUrl = link.url;
      if (link.platform === "linkedin") legacy.linkedinUrl = link.url;
      if (link.platform === "email") legacy.email = link.url;
    });
    return legacy;
  }

  window.FirehubSocial = {
    PLATFORMS: PLATFORMS,
    DEFAULT_LINKS: DEFAULT_LINKS,
    getPlatform: getPlatform,
    getSocialLinks: getSocialLinks,
    getHref: getHref,
    buildIconLink: buildIconLink,
    renderIcons: renderIcons,
    syncLegacyFields: syncLegacyFields,
  };
})();
