import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppProvider } from './src/context/AppContext';
import { FeedSimulatorScreen } from './src/screens/FeedSimulatorScreen';
import {
  AgentsScreen,
  HomeScreen,
  InsightsScreen,
  RulesScreen,
} from './src/screens/MainTabsScreens';

type TabKey = 'inicio' | 'agentes' | 'insights' | 'regras';
type IonName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: TabKey; label: string; icon: IonName; iconActive: IonName }[] = [
  { key: 'inicio', label: 'Início', icon: 'home-outline', iconActive: 'home' },
  { key: 'agentes', label: 'Agentes', icon: 'people-outline', iconActive: 'people' },
  { key: 'insights', label: 'Insights', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { key: 'regras', label: 'Regras', icon: 'options-outline', iconActive: 'options' },
];

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;

  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [activeIndex, indicator]);

  if (simulatorOpen) {
    return (
      <FeedSimulatorScreen onCloseSimulator={() => setSimulatorOpen(false)} />
    );
  }

  const tabWidth = barWidth / TABS.length;
  const indicatorX = indicator.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [6, Math.max(6, tabWidth * (TABS.length - 1) + 6)],
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        {activeTab === 'inicio' && (
          <HomeScreen
            onOpenSimulator={() => setSimulatorOpen(true)}
            onGoToRules={() => setActiveTab('regras')}
          />
        )}
        {activeTab === 'agentes' && <AgentsScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'regras' && <RulesScreen />}
      </View>

      <View
        style={styles.tabBar}
        accessibilityRole="tablist"
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      >
        {barWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: Math.max(0, tabWidth - 12),
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        )}
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={22}
                color={active ? '#2F5B3E' : '#4E5853'}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F7F5' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAE7',
    paddingTop: 8,
    paddingBottom: 14,
    minHeight: 64,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EAF2EC',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    zIndex: 1,
  },
  tabPressed: { opacity: 0.7 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#4E5853' },
  tabTextActive: { color: '#2F5B3E', fontWeight: '700' },
});
