export default {
  api: {
    key: window.OSW_API_KEY,
    urlRoot: window.OSW_API_URL_ROOT || 'https://api.orgsync.com/api/v3'
  },

  live: {
    url: `${window.OSW_IO_URL || 'https://orgsync.com'}/io`
      .replace(/^http/, 'ws')
  }
};
