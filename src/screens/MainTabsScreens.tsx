import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { calculateWeeklyStats } from '../services/rulesEngine';
import { AppMark, IconBadge, SoftPressable } from '../components/ui';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HOURLY = [
  { label: '6h', minutes: 14 },
  { label: '7h', minutes: 18 },
  { label: '8h', minutes: 12 },
  { label: '9h', minutes: 34 },
  { label: '10h', minutes: 20 },
  { label: '11h', minutes: 16 },
  { label: '12h', minutes: 22 },
  { label: '13h', minutes: 15 },
  { label: '14h', minutes: 42 },
  { label: '15h', minutes: 24 },
  { label: '16h', minutes: 16 },
  { label: '17h', minutes: 12 },
];

const SPIKE_MINUTES = 30;
const HOUR_CHART_HEIGHT = 72;

const WEEK_DAYS = [
  { day: 'Seg', mins: 86, sessions: 24 },
  { day: 'Ter', mins: 78, sessions: 22 },
  { day: 'Qua', mins: 91, sessions: 26 },
  { day: 'Qui', mins: 65, sessions: 18 },
  { day: 'Sex', mins: 59, sessions: 16 },
  { day: 'Sáb', mins: 54, sessions: 15 },
  { day: 'Dom', mins: 72, sessions: 18, active: true },
];

const WEEK_CHART_HEIGHT = 112;

function animateNextLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

/* =========================================================
   1. TELA INÍCIO (Painel diário + atalho para o Simulador)
   ========================================================= */
export const HomeScreen: React.FC<{
  onOpenSimulator: () => void;
  onGoToRules: () => void;
}> = ({ onOpenSimulator, onGoToRules }) => {
  const { apps, sessions, toggleAppMonitored } = useAppContext();
  const { totalMinutes } = calculateWeeklyStats(sessions);

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const peak = HOURLY.reduce((best, item) =>
    item.minutes > best.minutes ? item : best
  );
  const hourlySummary = `Tempo em redes por hora, das 6h às 17h. O pico foi de ${peak.minutes} minutos às ${peak.label}. Barras mais altas e com marca de pico passam de ${SPIKE_MINUTES} minutos.`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brandTitle}>FocusAgents</Text>
      <Text style={styles.brandSub}>Mais intenção no seu dia</Text>

      <View style={styles.statusPill} accessibilityRole="text">
        <Ionicons name="pulse" size={12} color="#2F5B3E" />
        <Text style={styles.statusPillText}>Analista de Padrões ativo</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <IconBadge name="time-outline" color="#2F5B3E" background="#EAF2EC" size={16} />
            <Text style={styles.cardLabel}>Resumo de hoje</Text>
          </View>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-down" size={12} color="#2F5B3E" />
            <Text style={styles.trendText}>18% na semana</Text>
          </View>
        </View>

        <Text style={styles.bigMetric} accessibilityRole="header">
          {hours}h {mins}m
        </Text>
        <Text style={styles.mutedSmall}>
          em {sessions.length + 14} sessões conscientes
        </Text>

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={hourlySummary}
          style={styles.chartBlock}
        >
          <View style={[styles.barsArea, { height: HOUR_CHART_HEIGHT }]}>
            <View style={styles.chartBaseline} />
            {HOURLY.map((item) => {
              const isSpike = item.minutes > SPIKE_MINUTES;
              const height = Math.max(
                6,
                (item.minutes / 48) * (HOUR_CHART_HEIGHT - 14)
              );
              return (
                <View key={item.label} style={styles.barCol}>
                  <View style={styles.barSlot}>
                    {isSpike && <View style={styles.peakDiamond} />}
                    <View
                      style={[
                        styles.miniBar,
                        {
                          height,
                          backgroundColor: isSpike ? '#A34B2E' : '#3F6B4C',
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.axisRow}>
            {HOURLY.map((item) => (
              <Text key={item.label} style={styles.axisLabel}>
                {item.label.replace('h', '')}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#3F6B4C' }]} />
            <Text style={styles.legendText}>Tempo em redes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#A34B2E' }]} />
            <View style={styles.peakDiamondSmall} />
            <Text style={styles.legendText}>Picos de rolagem</Text>
          </View>
        </View>
      </View>

      <SoftPressable
        style={styles.simCta}
        onPress={onOpenSimulator}
        accessibilityLabel="Simular uso em feed agora"
        accessibilityHint="Abre o simulador para testar a detecção de rolagem e a intervenção do Agente Orientador"
      >
        <IconBadge name="play" color="#FFFFFF" background="rgba(255,255,255,0.16)" />
        <View style={styles.ctaCopy}>
          <Text style={styles.simCtaTitle}>Simular uso em feed agora</Text>
          <Text style={styles.simCtaSub}>
            Testar detecção de scrolling e intervenção do Agente Orientador
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#E2EFE6" />
      </SoftPressable>

      <View style={[styles.rowBetween, { marginTop: 8, marginBottom: 10 }]}>
        <Text style={styles.sectionTitle}>Apps monitorados</Text>
        <SoftPressable
          onPress={onGoToRules}
          accessibilityLabel="Gerenciar aplicativos monitorados"
          hitSlop={8}
        >
          <Text style={styles.linkText}>+ Gerenciar</Text>
        </SoftPressable>
      </View>

      {apps.slice(0, 3).map((app) => (
        <View key={app.id} style={styles.appCard}>
          <AppMark appId={app.id} fallback={app.name} />
          <View style={styles.flex}>
            <Text style={styles.appName}>{app.name}</Text>
            <Text style={styles.mutedSmall}>
              {app.sessionsToday} sessões · Pico {app.peakWindow}
            </Text>
            <Text style={styles.mutedSmall}>
              Limite de rolagem: {app.scrollLimitMinutes} min
            </Text>
          </View>
          <Switch
            value={app.monitored}
            onValueChange={() => toggleAppMonitored(app.id)}
            trackColor={{ false: '#C5CEC8', true: '#3F6B4C' }}
            thumbColor="#FFFFFF"
            accessibilityLabel={`Monitorar ${app.name}`}
          />
        </View>
      ))}
    </ScrollView>
  );
};

/* =========================================================
   2. TELA AGENTES (Visão dos 3 agentes e suas funções)
   ========================================================= */
const AGENTS = [
  {
    title: 'Analista de Padrões',
    status: 'Ativo · aprendendo seu ritmo',
    icon: 'analytics-outline' as const,
    body: (_eveningLimit: number) =>
      'Frequência: análise contínua, todos os dias. Mapeia horários, duração e picos de rolagem usando regras locais e análise comportamental.',
  },
  {
    title: 'Agente Orientador',
    status: 'Ativo · disponível quando precisar',
    icon: 'compass-outline' as const,
    body: (evening: number) =>
      `Intervenções: ao atingir o limite de cada app ou limite noturno (${evening}m). Sugere pausas com acolhimento, sem bloqueios ou julgamentos.`,
  },
  {
    title: 'Agente Reflexivo',
    status: 'Ativo · reflexão semanal pronta',
    icon: 'book-outline' as const,
    body: (_eveningLimit: number) =>
      'Relatórios semanais com padrões e avanços. Sugere ajustes a partir do seu uso e sempre pede autorização antes de mudar regras.',
  },
];

export const AgentsScreen: React.FC = () => {
  const { rules } = useAppContext();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Sua equipe de foco</Text>
      <Text style={styles.brandSub}>Três agentes. Uma intenção: a sua.</Text>
      <Text style={styles.kicker}>SEMPRE AO SEU LADO</Text>

      {AGENTS.map((agent) => (
        <View key={agent.title} style={styles.card}>
          <View style={styles.agentHeader}>
            <IconBadge
              name={agent.icon}
              color="#2F5B3E"
              background="#EAF2EC"
            />
            <View style={styles.flex}>
              <Text style={styles.agentTitle}>{agent.title}</Text>
              <View style={styles.statusLine}>
                <View style={styles.liveDot} />
                <Text style={styles.agentStatus}>{agent.status}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.bodyText}>{agent.body(rules.eveningLimitMinutes)}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

/* =========================================================
   3. TELA INSIGHTS (Agente Reflexivo + aprovação de regra)
   ========================================================= */
export const InsightsScreen: React.FC = () => {
  const { pendingSuggestion, approveSuggestion, dismissSuggestion } =
    useAppContext();

  const maxMins = Math.max(...WEEK_DAYS.map((item) => item.mins));
  const average = Math.round(
    WEEK_DAYS.reduce((sum, item) => sum + item.mins, 0) / WEEK_DAYS.length
  );
  const averageBottom = (average / maxMins) * WEEK_CHART_HEIGHT;
  const weekSummary = `Semana em minutos por dia. Média de ${average} minutos. ${WEEK_DAYS.map(
    (item) =>
      `${item.day}: ${item.mins} minutos e ${item.sessions} sessões${item.active ? ', dia atual' : ''}`
  ).join('. ')}.`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Reflexão semanal</Text>
      <Text style={styles.brandSub}>9–15 de junho · Um novo olhar</Text>

      <View style={styles.statusPill}>
        <Ionicons name="sparkles-outline" size={12} color="#2F5B3E" />
        <Text style={styles.statusPillText}>Agente Reflexivo</Text>
      </View>

      <View style={[styles.card, styles.highlightCard]}>
        <View style={styles.titleRow}>
          <IconBadge name="moon-outline" color="#2F5B3E" background="#FFFFFF" />
          <Text style={styles.kickerInline}>PEQUENAS MUDANÇAS, PROGRESSO REAL</Text>
        </View>
        <Text style={styles.highlightTitle}>
          Rolagem noturna caiu 35% esta semana
        </Text>
        <Text style={styles.bodyText}>
          Você abriu espaço para descansar em 5 noites. Pequenas mudanças fazem
          diferença.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <IconBadge name="calendar-outline" color="#2F5B3E" background="#EAF2EC" size={16} />
            <Text style={styles.agentTitle}>Sua semana</Text>
          </View>
          <Text style={styles.averageLabel}>Média {average} min</Text>
        </View>

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={weekSummary}
          style={styles.weekChart}
        >
          <View style={styles.weekValueRow}>
            {WEEK_DAYS.map((item) => (
              <Text
                key={item.day}
                style={[styles.weekValue, item.active && styles.tinyLabelActive]}
              >
                {item.mins}
              </Text>
            ))}
          </View>
          <View style={[styles.weekPlot, { height: WEEK_CHART_HEIGHT }]}>
            <View style={[styles.averageLine, { bottom: averageBottom }]} />
            {WEEK_DAYS.map((item) => {
              const height = Math.max(8, (item.mins / maxMins) * (WEEK_CHART_HEIGHT - 4));
              return (
                <View key={item.day} style={styles.weekCol}>
                  <View
                    style={[
                      styles.weekBar,
                      {
                        height,
                        backgroundColor: item.active ? '#2F5B3E' : '#4F7D5E',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.weekMetaRow}>
            {WEEK_DAYS.map((item) => (
              <View
                key={item.day}
                style={[styles.weekMeta, item.active && styles.weekMetaActive]}
              >
                <Text style={[styles.dayLabel, item.active && styles.dayLabelActive]}>
                  {item.day}
                </Text>
                <Text style={styles.tinyLabel}>{item.sessions}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#4F7D5E' }]} />
            <Text style={styles.legendText}>Minutos no dia</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#8A6A32' }]} />
            <Text style={styles.legendText}>Média diária</Text>
          </View>
          <Text style={styles.legendText}>Acima: min · abaixo: sessões</Text>
        </View>
      </View>

      {pendingSuggestion ? (
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <IconBadge name="bulb-outline" color="#3D6B7D" background="#E7F0F3" />
            <Text style={styles.kickerInline}>SUGESTÃO DE AJUSTE</Text>
          </View>
          <Text style={styles.agentTitle}>{pendingSuggestion.title}</Text>
          <Text style={styles.mutedSmall}>{pendingSuggestion.description}</Text>

          <View style={styles.actionsRow}>
            <SoftPressable
              style={styles.approveBtn}
              accessibilityLabel="Aprovar sugestão"
              onPress={() => {
                animateNextLayout();
                approveSuggestion();
              }}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.approveText}>Aprovar</Text>
            </SoftPressable>
            <SoftPressable
              style={styles.dismissBtn}
              accessibilityLabel="Dispensar sugestão"
              onPress={() => {
                animateNextLayout();
                dismissSuggestion();
              }}
            >
              <Text style={styles.dismissText}>Dispensar</Text>
            </SoftPressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <IconBadge name="checkmark-circle-outline" color="#2F5B3E" background="#EAF2EC" />
            <Text style={styles.mutedSmall}>
              Nenhuma sugestão pendente no momento. Suas regras atuais estão
              sincronizadas.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

/* =========================================================
   4. TELA REGRAS (Limites gerais + limites por aplicativo)
   ========================================================= */
export const RulesScreen: React.FC = () => {
  const {
    apps,
    rules,
    toggleAppMonitored,
    setAppScrollLimit,
    addMonitoredApp,
    updateGeneralRules,
  } = useAppContext();

  const [search, setSearch] = useState('');
  const [newAppName, setNewAppName] = useState('');

  const filteredApps = apps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddApp = () => {
    if (!newAppName.trim()) return;
    animateNextLayout();
    addMonitoredApp(newAppName, 15);
    setNewAppName('');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Regras</Text>
      <Text style={styles.brandSub}>Seus limites, no seu ritmo</Text>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <IconBadge name="moon-outline" color="#2F5B3E" background="#EAF2EC" />
          <Text style={styles.agentTitle}>Limites gerais</Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 14 }]}>
          <Text style={styles.bodyText}>Limite noturno</Text>
          <View style={styles.limitPill}>
            <Text style={styles.statusPillText}>
              {rules.eveningLimitMinutes} min
            </Text>
          </View>
        </View>

        <View style={styles.presetRow} accessibilityRole="radiogroup">
          {[15, 20, 30, 45, 60].map((val) => {
            const selected = rules.eveningLimitMinutes === val;
            return (
              <SoftPressable
                key={val}
                style={[styles.presetChip, selected && styles.presetChipActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Limite noturno de ${val} minutos`}
                onPress={() => updateGeneralRules({ eveningLimitMinutes: val })}
              >
                <Text
                  style={[styles.presetText, selected && styles.presetTextActive]}
                >
                  {val}m
                </Text>
              </SoftPressable>
            );
          })}
        </View>

        <View style={styles.switchRow}>
          <IconBadge name="notifications-outline" color="#3D6B7D" background="#E7F0F3" size={16} />
          <View style={styles.flex}>
            <Text style={styles.appName}>Alertas suaves</Text>
            <Text style={styles.mutedSmall}>Pausas sem pressão, no seu ritmo</Text>
          </View>
          <Switch
            value={rules.gentleScrollAlerts}
            onValueChange={(v) => updateGeneralRules({ gentleScrollAlerts: v })}
            trackColor={{ false: '#C5CEC8', true: '#3F6B4C' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Alertas suaves"
          />
        </View>

        <View style={styles.switchRow}>
          <IconBadge name="shield-checkmark-outline" color="#3D6B7D" background="#E7F0F3" size={16} />
          <View style={styles.flex}>
            <Text style={styles.appName}>Confirmar alterações de regras</Text>
            <Text style={styles.mutedSmall}>
              Você sempre tem a palavra final.
            </Text>
          </View>
          <Switch
            value={rules.confirmBeforeRuleChanges}
            onValueChange={(v) =>
              updateGeneralRules({ confirmBeforeRuleChanges: v })
            }
            trackColor={{ false: '#C5CEC8', true: '#3F6B4C' }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Confirmar alterações de regras"
          />
        </View>
      </View>

      <View style={styles.titleRow}>
        <Ionicons name="phone-portrait-outline" size={18} color="#1E2A24" />
        <Text style={styles.sectionTitle}>Limites por app</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar apps..."
        placeholderTextColor="#5C6762"
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Pesquisar aplicativos"
        clearButtonMode="while-editing"
      />

      {filteredApps.length === 0 && (
        <Text style={styles.emptySearch}>Nenhum app com esse nome.</Text>
      )}

      {filteredApps.map((app) => (
        <View key={app.id} style={styles.appRuleCard}>
          <AppMark appId={app.id} fallback={app.name} />
          <View style={styles.flex}>
            <Text style={styles.appName}>{app.name}</Text>
            <Text style={styles.mutedSmall}>
              Limite de rolagem: {app.scrollLimitMinutes} min
            </Text>
            <View
              style={styles.timePills}
              accessibilityRole="radiogroup"
              accessibilityLabel={`Limite de rolagem de ${app.name}`}
            >
              {[10, 15, 20].map((min) => {
                const selected = app.scrollLimitMinutes === min;
                return (
                  <SoftPressable
                    key={min}
                    style={[styles.miniPill, selected && styles.miniPillActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${min} minutos`}
                    onPress={() => setAppScrollLimit(app.id, min)}
                  >
                    <Text
                      style={[
                        styles.miniPillText,
                        selected && styles.miniPillTextActive,
                      ]}
                    >
                      {min}m
                    </Text>
                  </SoftPressable>
                );
              })}
            </View>
          </View>

          <Switch
            value={app.monitored}
            onValueChange={() => toggleAppMonitored(app.id)}
            trackColor={{ false: '#C5CEC8', true: '#3F6B4C' }}
            thumbColor="#FFFFFF"
            accessibilityLabel={`Monitorar ${app.name}`}
          />
        </View>
      ))}

      <View style={styles.addRow}>
        <TextInput
          style={[styles.searchInput, styles.addInput]}
          placeholder="Adicionar outro app (ex.: Pinterest)..."
          placeholderTextColor="#5C6762"
          value={newAppName}
          onChangeText={setNewAppName}
          onSubmitEditing={handleAddApp}
          accessibilityLabel="Nome do aplicativo para monitorar"
          returnKeyType="done"
        />
        <SoftPressable
          style={styles.addBtn}
          onPress={handleAddApp}
          accessibilityLabel="Adicionar aplicativo"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </SoftPressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7F5' },
  content: { padding: 20, paddingTop: 54, paddingBottom: 32 },
  flex: { flex: 1 },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#1E2A24' },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1E2A24' },
  brandSub: { fontSize: 14, color: '#4E5853', marginTop: 2, marginBottom: 12 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4E5853',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  kickerInline: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#4E5853',
    letterSpacing: 0.6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  statusPillText: { color: '#234832', fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E3E8E4',
  },
  highlightCard: { backgroundColor: '#E7F0EA' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#1E2A24' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  trendText: { fontSize: 11, fontWeight: '700', color: '#234832' },
  bigMetric: { fontSize: 32, fontWeight: '700', color: '#1E2A24', marginTop: 12 },
  mutedSmall: { fontSize: 13, color: '#4E5853', marginTop: 2, lineHeight: 18 },
  chartBlock: { marginTop: 16 },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#D5DDD8',
  },
  barCol: { flex: 1, alignItems: 'center' },
  barSlot: { alignItems: 'center', justifyContent: 'flex-end' },
  miniBar: { width: 8, borderRadius: 4 },
  peakDiamond: {
    width: 6,
    height: 6,
    backgroundColor: '#A34B2E',
    transform: [{ rotate: '45deg' }],
    marginBottom: 3,
  },
  peakDiamondSmall: {
    width: 6,
    height: 6,
    backgroundColor: '#A34B2E',
    transform: [{ rotate: '45deg' }],
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    color: '#4E5853',
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendLine: { width: 14, height: 2, borderRadius: 1 },
  legendText: { fontSize: 12, color: '#24312B', fontWeight: '600' },
  simCta: {
    backgroundColor: '#3F6B4C',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaCopy: { flex: 1 },
  simCtaTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  simCtaSub: { color: '#E7F3EA', fontSize: 12, marginTop: 2, lineHeight: 17 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E2A24' },
  linkText: { color: '#24566A', fontWeight: '700', fontSize: 13 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3E8E4',
    gap: 12,
  },
  appName: { fontWeight: '700', color: '#1E2A24', fontSize: 14 },
  agentHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#3F6B4C',
  },
  agentTitle: { fontSize: 16, fontWeight: '700', color: '#1E2A24' },
  agentStatus: { fontSize: 12, color: '#234832', fontWeight: '600' },
  bodyText: { fontSize: 14, color: '#24312B', lineHeight: 21 },
  highlightTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E2A24',
    marginTop: 12,
    marginBottom: 6,
  },
  averageLabel: { fontSize: 12, fontWeight: '700', color: '#234832' },
  weekChart: { marginTop: 16 },
  weekValueRow: { flexDirection: 'row', marginBottom: 6 },
  weekValue: { flex: 1, textAlign: 'center', fontSize: 11, color: '#4E5853', fontWeight: '600' },
  weekPlot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#8A6A32',
    borderRadius: 1,
  },
  weekCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weekBar: { width: 16, borderRadius: 6 },
  weekMetaRow: { flexDirection: 'row', marginTop: 8 },
  weekMeta: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 4 },
  weekMetaActive: { backgroundColor: '#EAF2EC' },
  dayLabel: { fontSize: 12, fontWeight: '700', color: '#24312B' },
  dayLabelActive: { color: '#234832' },
  tinyLabel: { fontSize: 11, color: '#4E5853', fontWeight: '600' },
  tinyLabelActive: { color: '#234832' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#3F6B4C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
  },
  approveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  dismissBtn: {
    flex: 1,
    backgroundColor: '#EEF1EF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  dismissText: { color: '#24312B', fontWeight: '700', fontSize: 14 },
  limitPill: {
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  presetChip: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: { backgroundColor: '#EAF2EC', borderWidth: 1.5, borderColor: '#2F5B3E' },
  presetText: { fontSize: 13, fontWeight: '600', color: '#24312B' },
  presetTextActive: { color: '#234832', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E6EBE7',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D2CC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E2A24',
    marginBottom: 12,
    marginTop: 10,
  },
  emptySearch: { color: '#4E5853', fontSize: 13, marginBottom: 12 },
  appRuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3E8E4',
    gap: 10,
  },
  timePills: { flexDirection: 'row', gap: 6, marginTop: 8 },
  miniPill: {
    minWidth: 40,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPillActive: { backgroundColor: '#EAF2EC', borderWidth: 1, borderColor: '#2F5B3E' },
  miniPillText: { fontSize: 12, fontWeight: '600', color: '#24312B' },
  miniPillTextActive: { color: '#234832', fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'flex-start' },
  addInput: { flex: 1, marginBottom: 0, marginTop: 0 },
  addBtn: {
    backgroundColor: '#24566A',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
