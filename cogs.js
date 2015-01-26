module.exports = {
  manifestPath: 'manifest.json',
  in: {
    json: {out: 'js', transformers: {name: 'json', options: {modules: 'amd'}}},
    es6: {
      out: 'js',
      transformers: [
        'extract-directives',
        {name: '6to5', options: {modules: 'amd'}}
      ]
    },
    js: {
      transformers: [
        'extract-directives',
        {name: 'concat-amd', options: {base: 'scripts'}},
        {name: 'prepend-path', options: {before: '// '}}
      ]
    },
    scss: {
      out: 'css',
      transformers: ['extract-directives', 'sass']
    },
    css: {
      transformers: [
        'extract-directives',
        {name: 'prepend-path', options: {before: '/* ', after: ' */'}}
      ]
    }
  },
  builds: {
    'scripts/orgsync-widgets.es6': 'dist',
    'styles/orgsync-widgets.scss': 'dist'
  }
};
