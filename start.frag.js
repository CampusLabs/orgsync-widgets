((function (root, factory) {
  if (typeof define === 'function' && define.amd) define(factory);
  else root.OrgSyncWidgets = factory();
})(this, function () {
  return (function () {

    // Neither require.js nor almond.js were working properly with the simple
    // task of handling these `defines` and `requires` in a circular-dependency
    // fashion, so this chunk of code acts as a more foolproof replacement for
    // this project. It's also smaller in size than either of the above-
    // mentioned.
    var define, require;
    (function () {
      'use strict';

      // Store modules in an object.
      var mods = {
        require: {
          isResolved: true,
          exports: require
        }
      };

      // Define just adds to the module storage.
      define = function (name, deps, cb) {
        if (!cb) {
          cb = deps;
          deps = [];
        }
        mods[name] = {isResolved: false, deps: deps, exports: {}, cb: cb};
      };

      // Fool the masses.
      define.amd = {};

      // Require the given module, recursively resolving dependencies as
      // necessary.
      require = function (name, requester) {

        // Special cases...
        if (name === 'module') return mods[requester];
        if (name === 'exports') return mods[requester].exports;

        // Pull the module from the storage object.
        var mod = mods[name];

        // Return immediately if the module has already been resolved.
        if (mod.isResolved) return mod.exports;

        // Otherwise, resolve all dependencies.
        mod.isResolved = true;
        var deps = mod.deps || [];
        for (var i = 0, l = deps.length; i < l; ++i) {
          deps[i] = require(deps[i], name);
        }
        var val =
          typeof mod.cb === 'function' ?
          mod.cb.apply(mod.exports, deps) :
          mod.cb;

        // Delete obsolete variables.
        delete mod.cb;
        delete mod.deps;

        // Finally, return the module's return value, or fallback to exports.
        if (val !== undefined) mod.exports = val;
        return mod.exports;
      };
    })();

    var globals = {$: null, jQuery: null, Select2: null};
    for (var key in globals) {
      globals[key] = window[key];
      delete window[key];
    }
