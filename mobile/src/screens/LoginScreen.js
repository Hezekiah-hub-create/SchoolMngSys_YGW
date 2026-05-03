import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { COLORS, commonStyles } from '../theme';
import { PremiumButton } from '../components/PremiumButton';
import { PremiumInput } from '../components/PremiumInput';
import { LogIn, ShieldCheck } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Blobs */}
      <View style={StyleSheet.absoluteFill}>
        <MotiView
          from={{ translateX: -100, translateY: -100, scale: 1 }}
          animate={{ translateX: 50, translateY: -50, scale: 1.2 }}
          transition={{ loop: true, type: 'timing', duration: 7000, repeatReverse: true }}
          style={[styles.blob, { backgroundColor: COLORS.primaryLight, top: -50, left: -50 }]}
        />
        <MotiView
          from={{ translateX: 200, translateY: 300, scale: 1 }}
          animate={{ translateX: 100, translateY: 200, scale: 1.1 }}
          transition={{ loop: true, type: 'timing', duration: 8000, repeatReverse: true }}
          style={[styles.blob, { backgroundColor: COLORS.secondaryLight, bottom: 50, right: -50 }]}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <ShieldCheck color={COLORS.primary} size={48} />
            </View>
            <Text style={styles.title}>UHAS BASIC SCHOOL</Text>
            <Text style={styles.subtitle}>Empowering the Next Generation</Text>
          </MotiView>

          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            style={commonStyles.glassCard}
          >
            <Text style={styles.cardTitle}>Login to Portal</Text>
            
            <PremiumInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
            />

            <PremiumInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PremiumButton
              title="Sign In to Portal"
              onPress={handleLogin}
              loading={loading}
              icon={LogIn}
              style={styles.loginBtn}
            />
          </MotiView>

          <Text style={styles.footerText}>
            © 2026 UHAS Basic School. All Rights Reserved.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate[600],
    marginTop: 4,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginBottom: 24,
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    marginTop: 8,
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.slate[400],
    fontSize: 12,
    fontWeight: '600',
    marginTop: 40,
  }
});

export default LoginScreen;
