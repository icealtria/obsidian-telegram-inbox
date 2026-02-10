const Module = require("node:module");

const originalLoad = Module._load;

Module._load = function (request, _parent, _isMain) {
  if (request === "obsidian") {
    const moment = require("moment");

    return {
      moment,
      normalizePath: (path) => path,
      requestUrl: async () => ({}),
      Notice: class {},
      Plugin: class {},
      Setting: class {},
      PluginSettingTab: class {},
      App: class {},
    };
  }

  return originalLoad.apply(this, arguments);
};
