import { Platform } from 'react-native';

const tintColorLight = '#9B7CF2';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#333333',
    background: '#F8F9FB',
    tint: tintColorLight,
    icon: '#9B7CF2',
    tabIconDefault: '#C0ADEF',
    tabIconSelected: tintColorLight,
    primary: '#9B7CF2',
    secondary: '#D1C4E9',
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    purpleStrong: '#6B4EB8',
    purpleLight: '#D0BCFF',
    statusScheduled: '#D0BCFF',
    statusCompleted: '#6B4EB8',
    textSecondary: '#666666',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#9B7CF2',
    secondary: '#4A3B7B',
    cardBackground: '#1E1E1E',
    border: '#333333',
    purpleStrong: '#9B7CF2',
    purpleLight: '#2A1F4B',
    statusScheduled: '#9B7CF2',
    statusCompleted: '#D1C4E9',
    textSecondary: '#AAAAAA',
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
