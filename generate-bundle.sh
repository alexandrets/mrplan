#!/bin/bash

# Crear directorio de assets si no existe
mkdir -p android/app/src/main/assets

# Generar el bundle
npx react-native bundle \
  --platform android \
  --dev true \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# Ejecutar la app
npx react-native run-android