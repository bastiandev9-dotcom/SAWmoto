const config = {
  theme: 'deepSpace',
  darkMode: true,
  layout: 'modern',
  hideModels: false,
  hideDownloadButton: false,
  defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
  metaData: {
    title: 'SAWmoto API Docs',
    description: 'Backend pemilihan motor — metode SAW. Klik "Test Request" buat coba langsung.',
  },
};

const el = document.getElementById('api-reference');
if (el) el.dataset.configuration = JSON.stringify(config);
