
    for (var key in globals) {
      if (!(window[key] = globals[key])) delete window[key];
    }

    return require('app');
  }).call({});
}));
