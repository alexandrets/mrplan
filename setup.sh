#!/bin/bash

# Mr. Plan - Setup Script
# Automatiza la instalación de dependencias y creación de estructura

echo "🚀 Setting up Mr. Plan Dashboard..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en un proyecto React Native
if [ ! -f "package.json" ]; then
    print_error "No package.json found. Make sure you're in a React Native project directory."
    exit 1
fi

# Crear estructura de carpetas
print_status "Creating folder structure..."
mkdir -p src/styles
mkdir -p src/utils  
mkdir -p src/redux/slices
mkdir -p src/components/common
mkdir -p src/components/tasks
mkdir -p src/components/sections
mkdir -p src/screens/main
mkdir -p src/hooks

print_success "Folder structure created!"

# Instalar dependencias Redux
print_status "Installing Redux dependencies..."
npm install @reduxjs/toolkit react-redux redux-persist @react-native-async-storage/async-storage

# Instalar dependencias Firebase
print_status "Installing Firebase dependencies..."
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Instalar dependencias UI y animaciones
print_status "Installing UI and animation dependencies..."
npm install styled-components react-native-reanimated react-native-gesture-handler react-native-svg

# Instalar dependencias de navegación (para el futuro)
print_status "Installing navigation dependencies..."
npm install @react-navigation/native @react-navigation/stack

print_success "All dependencies installed!"

# Crear babel.config.js si no existe o actualizarlo
print_status "Configuring Babel for Reanimated..."

if [ -f "babel.config.js" ]; then
    # Hacer backup del babel.config.js actual
    cp babel.config.js babel.config.js.backup
    print_warning "Backed up existing babel.config.js to babel.config.js.backup"
fi

# Crear nuevo babel.config.js
cat > babel.config.js << 'EOF'
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // MUST be the last plugin
  ],
};
EOF

print_success "Babel configuration updated!"

# Instrucciones para Firebase
print_warning "⚠️  IMPORTANT: Firebase Configuration Required"
echo ""
echo "Please complete these Firebase setup steps:"
echo ""
echo "1. Go to https://console.firebase.google.com"
echo "2. Create a new project called 'MrPlan'"
echo "3. Enable Authentication and Firestore Database"
echo ""
echo "For Android:"
echo "  - Add Android app to Firebase project"
echo "  - Download google-services.json"
echo "  - Place in android/app/ directory"
echo ""
echo "For iOS:"
echo "  - Add iOS app to Firebase project"  
echo "  - Download GoogleService-Info.plist"
echo "  - Add to Xcode project in ios/MrPlan/"
echo ""

# Instrucciones para archivos
print_warning "📁 Next Steps: Copy the component files"
echo ""
echo "Copy all the provided files to their respective directories:"
echo ""
echo "Styles & Utils:"
echo "  - src/styles/colors.js"
echo "  - src/styles/typography.js"
echo "  - src/utils/constants.js"
echo ""
echo "Redux:"
echo "  - src/redux/store.js"
echo "  - src/redux/slices/authSlice.js"
echo "  - src/redux/slices/tasksSlice.js"
echo "  - src/redux/slices/categoriesSlice.js"
echo "  - src/redux/slices/settingsSlice.js"
echo ""
echo "Components:"
echo "  - src/components/common/Button.js"
echo "  - src/components/common/ProgressCircle.js"
echo "  - src/components/common/AddTaskModal.js"
echo "  - src/components/tasks/TaskCard.js"
echo "  - src/components/sections/GTDSection.js"
echo ""
echo "Screens & Hooks:"
echo "  - src/screens/main/DashboardScreen.js"
echo "  - src/hooks/useTasks.js"
echo ""
echo "Main App:"
echo "  - App.js (replace existing)"
echo ""

# Instrucciones para testing
print_status "🧪 Testing Instructions"
echo ""
echo "After copying all files and configuring Firebase:"
echo ""
echo "1. Clean cache:"
echo "   npx react-native start --reset-cache"
echo ""
echo "2. Run the app:"
echo "   npx react-native run-android  # for Android"
echo "   npx react-native run-ios      # for iOS"
echo ""

# Verificar plataforma y dar instrucciones específicas
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "🍎 macOS detected - iOS development available"
    echo ""
    echo "For iOS setup:"
    echo "  cd ios && pod install"
    echo ""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "🐧 Linux detected - Android development only"
elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32"* ]]; then
    print_status "🪟 Windows detected - Android development recommended"
fi

print_success "🎉 Mr. Plan setup complete!"
echo ""
echo "Next: Configure Firebase and copy the component files."
echo "Follow the IMPLEMENTATION_GUIDE.md for detailed instructions."
echo ""
echo "Happy coding! 🚀"