// Fallback for using Ionicons/MaterialIcons on Android and web.
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Mappings for SF Symbols to Expo Vector Icons.
 */
const MAPPING = {
  'house.fill': { family: 'Ionicons', name: 'home' },
  'paperplane.fill': { family: 'Ionicons', name: 'send' },
  'chevron.left.forwardslash.chevron.right': { family: 'Ionicons', name: 'code-working' },
  'chevron.right': { family: 'Ionicons', name: 'chevron-forward' },
  'xmark': { family: 'Ionicons', name: 'close' },
  'house': { family: 'Ionicons', name: 'home' },
  'gear': { family: 'Ionicons', name: 'settings' },
  'doc.text': { family: 'Ionicons', name: 'document-text' },
  'rectangle.portrait.and.arrow.right': { family: 'Ionicons', name: 'log-out' },
  'pencil': { family: 'Ionicons', name: 'pencil' },
  'checkmark': { family: 'Ionicons', name: 'checkmark' },
  'square.and.arrow.up': { family: 'Ionicons', name: 'share' },
  'trash': { family: 'Ionicons', name: 'trash' },
  'lock': { family: 'Ionicons', name: 'lock-closed' },
  'sentiment.very.satisfied': { family: 'MaterialIcons', name: 'sentiment-very-satisfied' },
  'sentiment.satisfied': { family: 'MaterialIcons', name: 'sentiment-satisfied' },
  'sentiment.neutral': { family: 'MaterialIcons', name: 'sentiment-neutral' },
  'sentiment.dissatisfied': { family: 'MaterialIcons', name: 'sentiment-dissatisfied' },
  'sentiment.very.dissatisfied': { family: 'MaterialIcons', name: 'sentiment-very-dissatisfied' },
  'sun.max.fill': { family: 'Ionicons', name: 'sunny' },
  'cloud.sun.fill': { family: 'Ionicons', name: 'partly-sunny' },
  'cloud.rain.fill': { family: 'Ionicons', name: 'rainy' },
  'checkmark.circle.fill': { family: 'Ionicons', name: 'checkmark-circle' },
  'xmark.circle.fill': { family: 'Ionicons', name: 'close-circle' },
  'calendar': { family: 'Ionicons', name: 'calendar' },
  'bubble.left.and.bubble.right': { family: 'Ionicons', name: 'chatbubbles' },
  'person.3': { family: 'Ionicons', name: 'people' },
  'person.2': { family: 'Ionicons', name: 'people-outline' },
  'line.3.horizontal.decrease': { family: 'Ionicons', name: 'filter' },
  'magnifyingglass': { family: 'Ionicons', name: 'search' },
  'plus': { family: 'Ionicons', name: 'add' },
  'pencil.and.scribble': { family: 'Ionicons', name: 'create-outline' },
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}) {
  const mapping = MAPPING[name];
  
  if (!mapping) {
    console.warn(`IconSymbol: No mapping found for icon name "${name}"`);
    return <Ionicons color={color} size={size} name="help-circle-outline" style={style} />;
  }
  
  if (mapping.family === 'MaterialIcons') {
    return <MaterialIcons color={color} size={size} name={mapping.name} style={style} />;
  }
  
  return <Ionicons color={color} size={size} name={mapping.name} style={style} />;
}
