/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- Bloque de Configuración ---
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  
  // ▼▼▼ DEBES REEMPLAZAR ESTA LÍNEA ▼▼▼
  webClientId: '1052366362950-ke7l5pqvj3up93bo2cm4kmviirs8s9t3.apps.googleusercontent.com', 
  
  // Este ID es el correcto para tu app de iOS
  iosClientId: '1052366362950-jsgj7licnm0t43jg8s9110qh0ksq87q3.apps.googleusercontent.com', 
});
// -----------------------------

AppRegistry.registerComponent(appName, () => App);