// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This is the most important part:
// We are explicitly telling the Metro bundler to include '.ttf' files as assets.
config.resolver.assetExts.push('ttf');

module.exports = config;