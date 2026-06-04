import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lawapp.app',
  appName: 'LawApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    QQLogin: {
      appId: '1904114043',
      appKey: 'eEcmxxoYCdwBJFxS'
    }
  }
};

export default config;
