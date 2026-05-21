const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimization: Use cache and more workers for speed
config.resetCache = false;
config.maxWorkers = 4;

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Ensure modern extensions are supported and resolve react-native-video explicitly
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, "mjs", "cjs"],
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    "react-native-video": require.resolve("react-native-video"),
  },
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
