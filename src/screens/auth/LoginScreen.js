import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const {login, isLoading, resetPassword} = useAuth();

  // Validar email
  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar formulario
  const validateForm = () => {
    let isValid = true;

    // Reset errores
    setEmailError('');
    setPasswordError('');

    // Validar email
    if (!email.trim()) {
      setEmailError('El email es requerido');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Email inválido');
      isValid = false;
    }

    // Validar contraseña
    if (!password.trim()) {
      setPasswordError('La contraseña es requerida');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      isValid = false;
    }

    return isValid;
  };

  // Manejar login
  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email.trim(), password);

    if (!result.success) {
      Alert.alert('Error de Inicio de Sesión', result.error);
    }
    // Si es exitoso, el AuthContext manejará la navegación
  };

  // Manejar reset de contraseña
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Requerido',
        'Por favor ingresa tu email para recuperar la contraseña',
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Email Inválido', 'Por favor ingresa un email válido');
      return;
    }

    Alert.alert(
      'Recuperar Contraseña',
      `¿Enviar email de recuperación a ${email}?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Enviar',
          onPress: async () => {
            const result = await resetPassword(email);

            if (result.success) {
              Alert.alert(
                'Email Enviado',
                'Revisa tu correo para recuperar la contraseña',
              );
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6200EE" barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={styles.title}>Bienvenido</Text>
              <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={[
                    styles.input,
                    passwordError ? styles.inputError : null,
                  ]}
                  placeholder="Tu contraseña"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginButton, {marginTop: -10}]}
                onPress={() => navigation.navigate('CalendarScreen')}>
                <Text style={styles.loginButtonText}>
                  Go to Calender Screen
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Regístrate aquí</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#6200EE',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#6200EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#666666',
  },
  registerLink: {
    fontSize: 16,
    color: '#6200EE',
    fontWeight: '600',
  },
});

export default LoginScreen;
