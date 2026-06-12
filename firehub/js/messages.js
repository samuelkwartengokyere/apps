(function (global) {
  "use strict";

  var STORAGE_KEY = "firehub_messages";
  var DEFAULT_API_PATH = "/api/messages";

  function getApiBase() {
    try {
      var raw = localStorage.getItem("firehub_settings");
      if (raw) {
        var settings = JSON.parse(raw);
        if (settings.messagesApiUrl && String(settings.messagesApiUrl).trim()) {
          return String(settings.messagesApiUrl).trim().replace(/\/$/, "");
        }
      }
    } catch (e) {}
    return DEFAULT_API_PATH;
  }

  function getMessages() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveMessagesLocal(list, silent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (!silent && typeof FirehubSync !== "undefined") {
      FirehubSync.broadcast("messages");
    }
  }

  function pushRemote(list) {
    return fetch(getApiBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    }).catch(function () {});
  }

  function saveMessages(list, silent) {
    saveMessagesLocal(list, silent);
    return pushRemote(list);
  }

  function createMessage(name, email, message) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      message: String(message || "").trim(),
      date: new Date().toISOString(),
      read: false,
    };
  }

  function submitContact(name, email, message) {
    var msg = createMessage(name, email, message);
    var list = getMessages().concat(msg);
    return saveMessages(list).then(function () {
      return msg;
    });
  }

  function pullRemote() {
    return fetch(getApiBase())
      .then(function (r) {
        if (!r.ok) throw new Error("remote unavailable");
        return r.json();
      })
      .then(function (remote) {
        if (!Array.isArray(remote)) return getMessages();
        saveMessagesLocal(remote, true);
        return remote;
      })
      .catch(function () {
        return getMessages();
      });
  }

  global.FirehubMessages = {
    STORAGE_KEY: STORAGE_KEY,
    getMessages: getMessages,
    saveMessages: saveMessages,
    createMessage: createMessage,
    submitContact: submitContact,
    pullRemote: pullRemote,
  };
})(typeof window !== "undefined" ? window : this);
