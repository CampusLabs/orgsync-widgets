module.exports = {
  manifestPath: 'manifest.json',
  in: {
    json: {out: 'js', transformers: {name: 'json', options: {modules: 'amd'}}},
    es6: {
      out: 'js',
      transformers: [
        'directives',
        {name: 'babel', options: {modules: 'amd'}}
      ]
    },
    js: {
      transformers: [
        'directives',
        {name: 'prepend-path', options: {before: '// '}},
        {
          name: 'concat-amd',
          options: {base: 'scripts', extensions: ['js', 'es6', 'json']}
        }
      ]
    },
    scss: {
      out: 'css',
      transformers: ['directives', 'sass']
    },
    css: {
      transformers: [
        'directives',
        {name: 'prepend-path', options: {before: '/* ', after: ' */'}}
      ]
    }
  },
  builds: {
    'scripts/orgsync-widgets.es6': 'dist',
    'styles/orgsync-widgets.scss': 'dist'
  }
};
