import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';

const TAB_ICON: Record<string, string> = {
  home: '🏠',
  explore: '🔍',
  messages: '💬',
  profile: '👤',
};

const TAB_LABEL: Record<string, string> = {
  home: '홈',
  explore: '탐색',
  messages: '메시지',
  profile: '내정보',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{TAB_ICON[route.name]}</Text>
            <Text style={[styles.label, focused && styles.labelActive]}>
              {TAB_LABEL[route.name]}
            </Text>
            <View style={[styles.indicator, focused && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.gray,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  indicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
});
