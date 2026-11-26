import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { evaluateSessionRules } from '../services/rulesEngine';
import { guideUserWithAgent } from '../services/agentsService';
import { GuideRecommendation, IntentionTag } from '../types/focusAgents';

const MOCK_POSTS = [
  { id: '1', author: 'estudiocalmo', text: 'Luz da tarde entrando na sala e um café coado sem pressa.' },
  { id: '2', author: 'notasdedesign', text: 'Pequenos espaços de respiro mudam como você lê o que está ao redor.' },
  { id: '3', author: 'leituras.curtas', text: 'Você não precisa terminar o feed inteiro para saber o que importa hoje.' },
  { id: '4', author: 'ritmo.diario', text: 'Atenção plena não é rigidez — é perceber quando o piloto automático ligou.' },
  { id: '5', author: 'caderno.aberto', text: 'Qual foi a última coisa que você abriu este app para fazer?' },
];

const INTENTIONS: IntentionTag[] = ['Relaxar', 'Inspiração', 'Tédio'];

export const FeedSimulatorScreen: React.FC<{ onCloseSimulator: () => void }> = ({
  onCloseSimulator,
}) => {
  const { apps, rules, recordSession } = useAppContext();
  const activeApp = apps.find((a) => a.monitored) || apps[0];

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rapidScrolls, setRapidScrolls] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertReason, setAlertReason] = useState('');
  const [selectedIntention, setSelectedIntention] = useState<IntentionTag>('Relaxar');
  const [customInput, setCustomInput] = useState('');
  const [recommendation, setRecommendation] = useState<GuideRecommendation | null>(null);
  const [chosenActivity, setChosenActivity] = useState<string | null>(null);

  const lastScrollTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (modalVisible) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [modalVisible]);

  const triggerIntervention = async (customReason?: string) => {
    const hour = new Date().getHours();
    const isEvening = hour >= 19 || hour < 5;

    const evalResult = evaluateSessionRules({
      app: activeApp,
      elapsedSeconds,
      rapidScrollCount: rapidScrolls,
      rules,
      isEvening,
    });

    setAlertReason(
      customReason ||
        evalResult.reason ||
        `Você está rolando o feed há ${Math.max(1, Math.floor(elapsedSeconds / 60))} min.`
    );
    setChosenActivity(null);
    const rec = await guideUserWithAgent({
      intention: selectedIntention,
      customText: customInput,
      appName: activeApp.name,
    });
    setRecommendation(rec);
    setModalVisible(true);
  };

  useEffect(() => {
    if (modalVisible) return;
    const hour = new Date().getHours();
    const isEvening = hour >= 19 || hour < 5;
    const res = evaluateSessionRules({
      app: activeApp,
      elapsedSeconds,
      rapidScrollCount: rapidScrolls,
      rules,
      isEvening,
    });
    if (res.shouldIntervene) {
      triggerIntervention(res.reason);
    }
  }, [elapsedSeconds, rapidScrolls, modalVisible]);

  const handleScroll = () => {
    const now = Date.now();
    const delta = now - lastScrollTimeRef.current;
    lastScrollTimeRef.current = now;
    if (delta < 350) {
      setRapidScrolls((prev) => prev + 1);
    }
  };

  const handleSelectIntention = async (intent: IntentionTag) => {
    setSelectedIntention(intent);
    const rec = await guideUserWithAgent({
      intention: intent,
      customText: customInput,
      appName: activeApp.name,
    });
    setRecommendation(rec);
  };

  const handleContinueAnyway = () => {
    setRapidScrolls(0);
    setModalVisible(false);
  };

  const handleFinishSession = () => {
    recordSession({
      appId: activeApp.id,
      appName: activeApp.name,
      durationMinutes: Math.max(1, Math.ceil(elapsedSeconds / 60)),
      scrollSpikes: Math.max(1, Math.floor(rapidScrolls / 3)),
      period: 'evening',
    });
    setModalVisible(false);
    onCloseSimulator();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.simLabel}>SIMULADOR · {activeApp.name.toUpperCase()}</Text>
          <Text style={styles.timerText}>
            Sessão: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s · Rolagens rápidas:{' '}
            {rapidScrolls}
          </Text>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={handleFinishSession}>
          <Text style={styles.exitBtnText}>Encerrar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.demoTriggerBtn}
        onPress={() => triggerIntervention('Você está rolando o feed há 20 min.')}
      >
        <Text style={styles.demoTriggerText}>Testar intervenção do Agente Orientador agora</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.feed}
        onScroll={handleScroll}
        scrollEventThrottle={120}
      >
        {[...MOCK_POSTS, ...MOCK_POSTS, ...MOCK_POSTS].map((post, idx) => (
          <View key={`${post.id}-${idx}`} style={styles.postCard}>
            <Text style={styles.postAuthor}>@{post.author}</Text>
            <Text style={styles.postBody}>{post.text}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>● Agente Orientador</Text>
            </View>
            <Text style={styles.subPrompt}>Um momento para se escutar</Text>
            <Text style={styles.mainTitle}>
              {alertReason} O que você procura agora?
            </Text>

            <View style={styles.chipsRow}>
              {INTENTIONS.map((intent) => {
                const active = selectedIntention === intent;
                return (
                  <TouchableOpacity
                    key={intent}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => handleSelectIntention(intent)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {intent}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Ou me conte com suas próprias palavras..."
              placeholderTextColor="#8B9590"
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={() => handleSelectIntention(selectedIntention)}
            />

            {recommendation && (
              <View style={styles.recBox}>
                <Text style={styles.recAck}>{recommendation.acknowledgment}</Text>
                <View style={styles.altRow}>
                  {recommendation.alternatives.map((alt) => (
                    <TouchableOpacity
                      key={alt.id}
                      style={[
                        styles.altCard,
                        chosenActivity === alt.title && styles.altCardSelected,
                      ]}
                      onPress={() => setChosenActivity(alt.title)}
                    >
                      <Text style={styles.altTitle}>{alt.title}</Text>
                      <Text style={styles.altSub}>{alt.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {chosenActivity && (
                  <TouchableOpacity style={styles.doneBtn} onPress={handleFinishSession}>
                    <Text style={styles.doneBtnText}>
                      Iniciar "{chosenActivity}" e sair do feed
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinueAnyway}>
              <Text style={styles.continueText}>Continuar rolando mesmo assim</Text>
            </TouchableOpacity>
            <Text style={styles.footerNote}>
              A escolha é sua. Sem julgamentos.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F5', paddingTop: 48 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  simLabel: { fontSize: 11, fontWeight: '700', color: '#3D6B7D', letterSpacing: 0.6 },
  timerText: { fontSize: 13, color: '#4A5550', marginTop: 2 },
  exitBtn: {
    backgroundColor: '#E5EAE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  exitBtnText: { color: '#24312B', fontWeight: '600', fontSize: 13 },
  demoTriggerBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#EAF2EC',
    borderColor: '#BFD3C4',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoTriggerText: { color: '#2F5B3E', fontWeight: '600', fontSize: 13 },
  feed: { flex: 1, paddingHorizontal: 16 },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEFEA',
  },
  postAuthor: { fontWeight: '700', color: '#24312B', marginBottom: 6 },
  postBody: { color: '#4A5550', lineHeight: 20 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 24, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6DDD8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  agentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  agentBadgeText: { color: '#2F5B3E', fontSize: 12, fontWeight: '600' },
  subPrompt: { fontSize: 13, color: '#6D7873', marginBottom: 4 },
  mainTitle: { fontSize: 20, fontWeight: '700', color: '#1E2A24', lineHeight: 26, marginBottom: 14 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D5DDD7',
    backgroundColor: '#FAFBF9',
  },
  chipActive: { backgroundColor: '#EAF2EC', borderColor: '#4A7C59' },
  chipText: { color: '#4A5550', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#2F5B3E' },
  input: {
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E2A24',
    marginBottom: 14,
  },
  recBox: { marginBottom: 14 },
  recAck: { fontSize: 13, color: '#4A5550', lineHeight: 18, marginBottom: 10 },
  altRow: { flexDirection: 'row', gap: 10 },
  altCard: {
    flex: 1,
    backgroundColor: '#F4F7F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3EAE5',
  },
  altCardSelected: { borderColor: '#4A7C59', backgroundColor: '#EAF2EC' },
  altTitle: { fontWeight: '700', color: '#1E2A24', fontSize: 14, marginBottom: 4 },
  altSub: { fontSize: 12, color: '#6D7873' },
  doneBtn: {
    marginTop: 10,
    backgroundColor: '#4A7C59',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  continueBtn: {
    borderWidth: 1,
    borderColor: '#DCE3DE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  continueText: { color: '#3D6B7D', fontWeight: '600', fontSize: 14 },
  footerNote: { textAlign: 'center', color: '#8B9590', fontSize: 12, marginTop: 8 },
});