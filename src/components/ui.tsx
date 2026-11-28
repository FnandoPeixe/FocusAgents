import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type IonName = React.ComponentProps<typeof Ionicons>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type SoftPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

/** Botão com feedback imediato de toque, sem alterar o layout em repouso. */
export function SoftPressable({ style, children, ...rest }: SoftPressableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [style, pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export function IconBadge({
  name,
  color,
  background,
  size = 18,
}: {
  name: IonName;
  color: string;
  background: string;
  size?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.badge, { backgroundColor: background }]}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const APP_MARKS: Record<string, { name: MciName; color: string; background: string }> = {
  instagram: { name: 'instagram', color: '#C13584', background: '#FDECF3' },
  tiktok: { name: 'music-note', color: '#1E2A24', background: '#F4F1E8' },
  x: { name: 'alpha-x', color: '#1E2A24', background: '#EEF1F0' },
  youtube: { name: 'youtube', color: '#C4302B', background: '#FDECEC' },
  reddit: { name: 'reddit', color: '#D4520E', background: '#FFF1EB' },
};

export function AppMark({ appId, fallback }: { appId: string; fallback: string }) {
  const mark = APP_MARKS[appId];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.appMark, { backgroundColor: mark?.background ?? '#EFF2EF' }]}
    >
      {mark ? (
        <MaterialCommunityIcons name={mark.name} size={20} color={mark.color} />
      ) : (
        <Text style={styles.fallbackText}>{fallback.slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { fontWeight: '700', color: '#24312B', fontSize: 12 },
});
