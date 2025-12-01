// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
  // Ensure proper resolution of Firebase packages
  '@react-native-firebase/app': '@react-native-firebase/app/lib/index.js',
  '@react-native-firebase/auth': '@react-native-firebase/auth/lib/index.js',
};


module.exports = config;
