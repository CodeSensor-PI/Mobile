import { Platform } from 'react-native';

const tintColorLight = '#643BA1'; // Roxo do protótipo
const tintColorDark = '#9B7CF2'; // Roxo mais brilhante para o modo escuro

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#666666',
    background: '#FAF7F2', // Creme do protótipo
    tint: tintColorLight,
    primary: tintColorLight, // alias usado em botões/realces

    // Configurações de Inputs
    inputLabel: '#000000',
    inputBackground: '#F1E9F5', // Lilás clarinho do protótipo
    inputPlaceholder: '#A9A9A9',
    
    // Configurações de Botões
    buttonPrimary: '#643BA1',
    buttonPrimaryText: '#FFFFFF',
    buttonOutline: '#643BA1',
    buttonOutlineText: '#643BA1',
    
    // Outros
    purpleStrong: '#643BA1',
    purpleLight: '#CBB2FF',
    secondary: '#D1C4E9',
    cardBackground: '#FFFFFF',
    border: '#E2D5ED',
    statusScheduled: '#643BA1',
    statusCompleted: '#16a34a',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    background: '#151718',
    tint: tintColorDark,
    primary: tintColorDark, // alias usado em botões/realces

    // Configurações de Inputs
    inputLabel: '#FFFFFF',
    inputBackground: '#2A2A2A', // Cinza escuro para o modo dark
    inputPlaceholder: '#777777',
    
    // Configurações de Botões
    buttonPrimary: '#9B7CF2',
    buttonPrimaryText: '#FFFFFF',
    buttonOutline: '#9B7CF2',
    buttonOutlineText: '#9B7CF2',
    
    // Outros
    purpleStrong: '#9B7CF2',
    purpleLight: '#2A1F4B',
    secondary: '#333333',
    cardBackground: '#1E1E1E',
    border: '#333333',
    statusScheduled: '#9B7CF2',
    statusCompleted: '#4CAF50',
  },
};
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
