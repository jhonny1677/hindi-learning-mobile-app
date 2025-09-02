const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle import.meta issues
config.resolver.unstable_enablePackageExports = true;

module.exports = config;