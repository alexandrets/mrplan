#!/bin/bash

echo "🔧 Arreglando hot reload - Paso a paso..."

echo "1. Matando procesos Node..."
killall node 2>/dev/null || true

echo "2. Reiniciando ADB..."
adb kill-server
adb start-server

echo "3. Creando directorio assets..."
mkdir -p android/app/src/main/assets

echo "4. Generando bundle limpio con cambios..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

echo "5. Instalando app con cambios..."
npx react-native run-android --deviceId=emulator-5554

echo "✅ Proceso completado! Deberías ver 'HOY' y 'AÑADIR TAREA - CAMBIO APLICADO'"