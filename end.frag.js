    for (var key in globals) window[key] = globals[key];

    return require('app');
  }).call({});
}));
