
    // jQuery insists it should bind to `window`, so politely unbind it.
    window.jQuery.noConflict(true);

    return require('app');
  }).call({});
}));
