import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

const WelcomeScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <StatusBar backgroundColor="#6200EE" barStyle="light-content" />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Mr. Universo</Text>
            <Text style={styles.subtitle}>Tu Sistema GTD Personal</Text>
            <Text style={styles.description}>
              Organiza tu vida, captura ideas y mantén el control de tus
              proyectos con el método Getting Things Done.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📥</Text>
              <Text style={styles.featureText}>Captura ideas al instante</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📋</Text>
              <Text style={styles.featureText}>Organiza por contextos</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Enfócate en lo importante</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('CalendarScreen')}>
              <Text style={styles.primaryButtonText}>Go to Calender Screen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}>
              <Text style={styles.primaryButtonText}>Comenzar Gratis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6200EE',
    fontWeight: '600',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  features: {
    marginVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#6200EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#6200EE',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
