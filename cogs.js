module.exports = {
  manifestPath: 'manifest.json',
  pipe: [
    {name: 'directives', only: '**/*.+(js|scss|css)'},
    {name: 'json', only: '**/*.json', ext: '.js'},
    {
      name: 'replace',
      options: {
        flags: 'g',
        patterns: {'process.env.NODE_ENV': "'development'"}
      }
    },
    {
      name: 'babel',
      only: 'src/**/*.js',
      options: {presets: ['es2015', 'stage-0', 'react']}
    },
    {
      name: 'concat-commonjs',
      only: '**/*.js',
      options: {extensions: ['.js', '.json']}
    },
    {name: 'prepend-path', only: '**/*.js', options: {before: '// '}},
    {name: 'sass', only: '**/*.scss', ext: '.css'},
    {name: 'autoprefixer', only: '**/*.css'},
    {
      name: 'prepend-path',
      only: '**/*.css',
      options: {before: '/* ', after: ' */'}
    }
  ],
  builds: {
    'src/orgsync-widgets.js': 'dist',
    'styles/orgsync-widgets.scss': 'dist'
  }
};
