module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // react-native-reanimated/plugin debe ser el último
    'react-native-reanimated/plugin',
  ],
};