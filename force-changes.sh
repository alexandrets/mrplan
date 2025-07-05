#!/bin/bash

echo "🔧 Forzando aplicación de cambios..."

echo "1. Eliminando TODOS los bundles..."
rm -f ./android/app/src/main/assets/index.android.bundle
rm -f ./android/app/build/intermediates/assets/debug/mergeDebugAssets/index.android.bundle
rm -rf ./android/app/build/intermediates/assets
rm -rf ./android/app/build/intermediates/compressed_assets

echo "2. Limpiando build completo..."
cd android && ./gradlew clean && cd ..

echo "3. Desinstalando app del emulador..."
adb -s emulator-5554 uninstall com.mrplan

echo "4. Matando Metro..."
killall node 2>/dev/null || true

echo "5. Iniciando Metro fresco..."
npx react-native start --reset-cache &
METRO_PID=$!

echo "6. Esperando que Metro inicie..."
sleep 10

echo "7. Instalando app fresh..."
npx react-native run-android --deviceId=emulator-5554

echo "✅ Proceso completado! Deberías ver los cambios ahora"