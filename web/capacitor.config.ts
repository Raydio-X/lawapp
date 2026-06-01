import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lawapp.app',
  appName: 'LawApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
