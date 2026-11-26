import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { FeedSimulatorScreen } from './src/screens/FeedSimulatorScreen';
import {
  AgentsScreen,
  HomeScreen,
  InsightsScreen,
  RulesScreen,
} from './src/screens/MainTabsScreens';

type TabKey = 'inicio' | 'agentes' | 'insights' | 'regras';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  if (simulatorOpen) {
    return (
      <FeedSimulatorScreen onCloseSimulator={() => setSimulatorOpen(false)} />
    );
  }

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

      {/* Barra de navegação inferior */}
      <View style={styles.tabBar}>
        {(
          [
            { key: 'inicio', label: 'Início' },
            { key: 'agentes', label: 'Agentes' },
            { key: 'insights', label: 'Insights' },
            { key: 'regras', label: 'Regras' },
          ] as { key: TabKey; label: string }[]
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {active && <View style={styles.activeDot} />}
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingBottom: 16,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#7A8580' },
  tabTextActive: { color: '#2F5B3E', fontWeight: '700' },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4A7C59',
    marginTop: 4,
  },
});