// Fallback for using MaterialIcons and MaterialCommunityIcons on Android and web.
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type IconSource = 'material' | 'community';

type IconConfig = {
  name:
    | ComponentProps<typeof MaterialIcons>['name']
    | ComponentProps<typeof MaterialCommunityIcons>['name'];
  source: IconSource;
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 * - Use 'material' for MaterialIcons, 'community' for MaterialCommunityIcons
 */
const MAPPING = {
  house: { name: 'home', source: 'material' },
  map: { name: 'map', source: 'material' },
  'info.circle': { name: 'info-outline', source: 'material' },
  'rectangle.portrait.and.arrow.right': { name: 'logout', source: 'material' },
  globe: { name: 'language', source: 'material' },
  'person.3': { name: 'groups', source: 'material' },
  binoculars: { name: 'binoculars', source: 'community' },
  'mappin.and.ellipse': {
    name: 'map-marker-radius',
    source: 'community',
  },
  clock: { name: 'schedule', source: 'material' },
  // Neue Icons für Mandantenfähigkeit
  'building.2': { name: 'domain', source: 'material' },
  graduationcap: { name: 'school', source: 'material' },
  'arrow.backward': { name: 'arrow-back', source: 'material' },
} as Record<string, IconConfig>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 * Falls back to MaterialCommunityIcons if the icon is not available in MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  // Keep signature compatible with iOS variant which supports `weight`
  weight?: any;
}) {
  const iconConfig = MAPPING[name];

  if (iconConfig.source === 'community') {
    return (
      <MaterialCommunityIcons
        color={color}
        size={size}
        name={
          iconConfig.name as ComponentProps<
            typeof MaterialCommunityIcons
          >['name']
        }
        style={style}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconConfig.name as ComponentProps<typeof MaterialIcons>['name']}
      style={style}
    />
  );
}
