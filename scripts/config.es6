export default {
  api: {
    key: window.OSW_API_KEY,
    urlRoot: window.OSW_API_URL_ROOT || 'https://api.orgsync.com/api/v3'
  },

  elementQuery: {
    '.orgsync-widget, .osw-popup': {
      'min-width': [
        '231px',
        '251px',
        '401px',
        '461px',
        '480px',
        '501px',
        '640px',
        '691px',
        '751px',
        '800px',
        '921px',
        '960px',
        '1001px'
      ]
    }
  },

  live: {
    url: `${window.OSW_IO_URL || 'https://orgsync.com'}/io`
      .replace(/^http/, 'ws')
  }
};
