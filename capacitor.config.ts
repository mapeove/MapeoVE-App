import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mapeove.app',
  appName: 'MapeoVE',
  webDir: 'public',
  server: {
    url: 'https://mapeo-ve-app.vercel.app',
    cleartext: false
  }
};

export default config;
