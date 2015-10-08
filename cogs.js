module.exports = {
  manifestPath: 'manifest.json',
  in: {
    json: {
      out: 'js',
      transformers: {name: 'json', options: {modules: 'amd', compact: false}}
    },
    es6: {
      out: 'js',
      transformers: [
        'directives',
        {name: 'babel', options: {modules: 'amd', stage: 0}}
      ]
    },
    js: {
      transformers: [
        'directives',
        {
          name: 'browserify',
          only: [
            'node_modules/react-addons-css-transition-group/index.js',
            'node_modules/react-addons-update/index.js',
            'node_modules/superagent/lib/client.js'
          ]
        },
        {name: 'prepend-path', options: {before: '// '}},
        {
          name: 'concat-amd',
          options: {base: 'src', extensions: ['js', 'es6', 'json']}
        }
      ]
    },
    scss: {
      out: 'css',
      transformers: ['directives', 'sass']
    },
    css: {
      transformers: [
        'autoprefixer',
        'directives',
        {name: 'prepend-path', options: {before: '/* ', after: ' */'}}
      ]
    }
  },
  builds: {
    'src/orgsync-widgets.es6': 'dist',
    'styles/orgsync-widgets.scss': 'dist'
  }
};
