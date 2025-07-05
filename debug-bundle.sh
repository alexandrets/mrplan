#!/bin/bash

echo "🔍 Investigando el problema del bundle..."

echo "1. Buscando todos los bundles en el proyecto:"
find . -name "*.bundle" -type f

echo ""
echo "2. Verificando assets en Android:"
ls -la android/app/src/main/assets/ 2>/dev/null || echo "No hay directorio assets"

echo ""
echo "3. Verificando si hay bundles en res:"
find android/app/src/main/res -name "*.bundle" -type f 2>/dev/null || echo "No hay bundles en res"

echo ""
echo "4. Verificando el contenido del bundle actual:"
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
    echo "Bundle encontrado. Primeras líneas:"
    head -10 android/app/src/main/assets/index.android.bundle
else
    echo "No hay bundle en assets"
fi

echo ""
echo "5. Verificando si hay otros directorios assets:"
find . -name "assets" -type d

echo ""
echo "6. Verificando APK instalado:"
adb shell pm list packages | grep mrplan
adb shell dumpsys package com.mrplan | grep versionName