module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Asegúrate de que otros plugins que puedas tener estén antes de reanimated.
    
    // IMPORTANTE: El plugin de Reanimated DEBE ser el último en esta lista.
    'react-native-reanimated/plugin',
  ],
};
