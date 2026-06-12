(function (global) {
  "use strict";

  var CHANNEL_NAME = "firehub-sync";
  var KEYS = {
    settings: "firehub_settings",
    projects: "firehub_projects",
    experiences: "firehub_experiences",
    messages: "firehub_messages",
  };

  var channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

  function broadcast(type, data) {
    var msg = { type: type, at: Date.now() };
    if (data !== undefined) {
      msg.live = true;
      msg.data = data;
    }
    if (channel) {
      try {
        channel.postMessage(msg);
      } catch (e) {}
    }
  }

  function onSync(callback) {
    if (typeof callback !== "function") return;

    window.addEventListener("storage", function (e) {
      if (e.key === KEYS.settings) {
        callback("settings", e.newValue, null);
      } else if (e.key === KEYS.projects) {
        callback("projects", e.newValue, null);
      } else if (e.key === KEYS.experiences) {
        callback("experiences", e.newValue, null);
      } else if (e.key === KEYS.messages) {
        callback("messages", e.newValue, null);
      }
    });

    if (channel) {
      channel.onmessage = function (e) {
        if (e.data && e.data.type) {
          callback(e.data.type, null, e.data);
        }
      };
    }
  }

  global.FirehubSync = {
    KEYS: KEYS,
    broadcast: broadcast,
    onSync: onSync,
  };
})("undefined" !== typeof window ? window : this);
