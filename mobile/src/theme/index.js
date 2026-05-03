import { COLORS } from './colors';
import { StyleSheet } from 'react-native';

export { COLORS };

export const theme = {
  colors: COLORS,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 999,
  },
};

export const commonStyles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 30,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
  },
  premiumBtnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumBtnSecondary: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  btnTextSecondary: {
    color: COLORS.slate[900],
  },
  input: {
    width: '100%',
    padding: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.slate[200],
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.slate[900],
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate[600],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
