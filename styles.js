/**
 * styles.js
 *
 * A central stylesheet for the Site Right app.
 */
import { StyleSheet } from 'react-native';

// --- Color Palette ---
export const colors = {
  primary: '#1e40af', // Blue
  primary_light: '#3b82f6',
  secondary: '#16a34a', // Green
  accent: '#9333ea',   // Purple
  background: '#f3f4f6',
  surface: '#ffffff',
  text: '#111827',
  text_secondary: '#6b7280',
  border: '#d1d5db',
  error: '#ef4444',
  success: '#22c55e',
};

// --- Font Sizes & Weights ---
export const typography = StyleSheet.create({
  title1: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  title2: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  title3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, color: colors.text },
  label: { fontSize: 14, fontWeight: '500', color: colors.text_secondary },
  caption: { fontSize: 12, color: colors.text_secondary },
});

// --- Common Component Styles ---
export const commonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
});

