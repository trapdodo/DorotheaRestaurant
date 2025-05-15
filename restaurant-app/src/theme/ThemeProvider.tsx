import React from 'react';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { colors } from './colors';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary.main,
    onPrimary: '#ffffff',
    primaryContainer: colors.primary.light,
    onPrimaryContainer: colors.primary.dark,
    secondary: colors.secondary.main,
    onSecondary: '#ffffff',
    secondaryContainer: colors.secondary.light,
    onSecondaryContainer: colors.secondary.dark,
    tertiary: colors.info.main,
    onTertiary: '#ffffff',
    tertiaryContainer: colors.info.light,
    onTertiaryContainer: colors.info.dark,
    error: colors.error.main,
    onError: '#ffffff',
    errorContainer: colors.error.light,
    onErrorContainer: colors.error.dark,
    background: colors.background.default,
    onBackground: colors.text.primary,
    surface: colors.background.paper,
    onSurface: colors.text.primary,
    surfaceVariant: colors.background.paper,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.divider,
    outlineVariant: colors.divider,
    shadow: colors.text.primary,
    scrim: colors.text.primary,
    inverseSurface: colors.text.primary,
    inverseOnSurface: colors.background.default,
    inversePrimary: colors.primary.light,
    elevation: {
      level0: 'transparent',
      level1: colors.background.paper,
      level2: colors.background.paper,
      level3: colors.background.paper,
      level4: colors.background.paper,
      level5: colors.background.paper,
    },
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}; 