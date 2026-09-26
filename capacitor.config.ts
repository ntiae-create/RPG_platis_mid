import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.platis.rpg',
  appName: 'RPG Platis',
  webDir: 'dist',
  server: {
    url: 'https://rpg-platis-mid.vercel.app',
    cleartext: false
  }
};

export default config;
