import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { calculateWeeklyStats } from '../services/rulesEngine';

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brandTitle}>FocusAgents</Text>
      <Text style={styles.brandSub}>Mais intenção no seu dia</Text>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>● Analista de Padrões ativo</Text>
      </View>

      {/* Card Resumo de Hoje */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardLabel}>Resumo de hoje</Text>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>↓ 18% na semana</Text>
          </View>
        </View>

        <Text style={styles.bigMetric}>
          {hours}h {mins}m
        </Text>
        <Text style={styles.mutedSmall}>
          em {sessions.length + 14} sessões conscientes
        </Text>

        {/* Mini gráfico por horário */}
        <View style={styles.miniBarsRow}>
          {[14, 18, 12, 34, 20, 16, 22, 15, 42, 24, 16, 12].map((val, idx) => {
            const isSpike = val > 30;
            return (
              <View
                key={idx}
                style={[
                  styles.miniBar,
                  {
                    height: val,
                    backgroundColor: isSpike ? '#D97757' : '#8FB399',
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendItem}>● Tempo em redes</Text>
          <Text style={[styles.legendItem, { color: '#D97757' }]}>
            ● Picos de rolagem
          </Text>
        </View>
      </View>

      {/* Botão de demonstração ao vivo */}
      <TouchableOpacity style={styles.simCta} onPress={onOpenSimulator}>
        <Text style={styles.simCtaTitle}>Simular uso em feed agora</Text>
        <Text style={styles.simCtaSub}>
          Testar detecção de scrolling e intervenção do Agente Orientador
        </Text>
      </TouchableOpacity>

      {/* Apps monitorados */}
      <View style={[styles.rowBetween, { marginTop: 8, marginBottom: 10 }]}>
        <Text style={styles.sectionTitle}>Apps monitorados</Text>
        <TouchableOpacity onPress={onGoToRules}>
          <Text style={styles.linkText}>+ Gerenciar</Text>
        </TouchableOpacity>
      </View>

      {apps.slice(0, 3).map((app) => (
        <View key={app.id} style={styles.appCard}>
          <View style={styles.appAvatar}>
            <Text style={styles.appAvatarText}>
              {app.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
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
            trackColor={{ false: '#D6DDD8', true: '#4A7C59' }}
          />
        </View>
      ))}
    </ScrollView>
  );
};

/* =========================================================
   2. TELA AGENTES (Visão dos 3 agentes e suas funções)
   ========================================================= */
export const AgentsScreen: React.FC = () => {
  const { rules } = useAppContext();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Sua equipe de foco</Text>
      <Text style={styles.brandSub}>Três agentes. Uma intenção: a sua.</Text>
      <Text style={styles.kicker}>SEMPRE AO SEU LADO</Text>

      <View style={styles.card}>
        <Text style={styles.agentTitle}>Analista de Padrões</Text>
        <Text style={styles.agentStatus}>● Ativo · aprendendo seu ritmo</Text>
        <Text style={styles.bodyText}>
          Frequência: análise contínua, todos os dias. Mapeia horários, duração e
          picos de rolagem usando regras locais e análise comportamental.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.agentTitle}>Agente Orientador</Text>
        <Text style={styles.agentStatus}>● Ativo · disponível quando precisar</Text>
        <Text style={styles.bodyText}>
          Intervenções: ao atingir o limite de cada app ou limite noturno (
          {rules.eveningLimitMinutes}m). Sugere pausas com acolhimento, sem
          bloqueios ou julgamentos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.agentTitle}>Agente Reflexivo</Text>
        <Text style={styles.agentStatus}>● Ativo · reflexão semanal pronta</Text>
        <Text style={styles.bodyText}>
          Relatórios semanais com padrões e avanços. Sugere ajustes a partir do
          seu uso e sempre pede autorização antes de mudar regras.
        </Text>
      </View>
    </ScrollView>
  );
};

/* =========================================================
   3. TELA INSIGHTS (Agente Reflexivo + aprovação de regra)
   ========================================================= */
export const InsightsScreen: React.FC = () => {
  const { pendingSuggestion, approveSuggestion, dismissSuggestion } =
    useAppContext();

  const weekDays = [
    { day: 'Seg', mins: 86, sessions: 24 },
    { day: 'Ter', mins: 78, sessions: 22 },
    { day: 'Qua', mins: 91, sessions: 26 },
    { day: 'Qui', mins: 65, sessions: 18 },
    { day: 'Sex', mins: 59, sessions: 16 },
    { day: 'Sáb', mins: 54, sessions: 15 },
    { day: 'Dom', mins: 72, sessions: 18, active: true },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Reflexão semanal</Text>
      <Text style={styles.brandSub}>9–15 de junho · Um novo olhar</Text>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>● Agente Reflexivo</Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#EBF1EE' }]}>
        <Text style={styles.kicker}>PEQUENAS MUDANÇAS, PROGRESSO REAL</Text>
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
          <Text style={styles.agentTitle}>Sua semana em equilíbrio</Text>
          <Text style={styles.statusPillText}>Média: 72 min/dia</Text>
        </View>

        <View style={styles.weekChartRow}>
          {weekDays.map((item) => (
            <View key={item.day} style={styles.weekCol}>
              <Text style={styles.tinyLabel}>{item.mins}</Text>
              <View
                style={[
                  styles.weekBar,
                  {
                    height: item.mins * 0.9,
                    backgroundColor: item.active ? '#4A7C59' : '#B7CBBF',
                  },
                ]}
              />
              <Text style={styles.dayLabel}>{item.day}</Text>
              <Text style={styles.tinyLabel}>{item.sessions}</Text>
            </View>
          ))}
        </View>
      </View>

      {pendingSuggestion ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>SUGESTÃO DE AJUSTE</Text>
          <Text style={styles.agentTitle}>{pendingSuggestion.title}</Text>
          <Text style={styles.mutedSmall}>{pendingSuggestion.description}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={approveSuggestion}
            >
              <Text style={styles.approveText}>Aprovar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={dismissSuggestion}
            >
              <Text style={styles.dismissText}>Dispensar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.mutedSmall}>
            Nenhuma sugestão pendente no momento. Suas regras atuais estão
            sincronizadas.
          </Text>
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
    addMonitoredApp(newAppName, 15);
    setNewAppName('');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Regras</Text>
      <Text style={styles.brandSub}>Seus limites, no seu ritmo</Text>

      {/* Limites gerais */}
      <View style={styles.card}>
        <Text style={styles.agentTitle}>Limites gerais</Text>

        <View style={[styles.rowBetween, { marginTop: 12 }]}>
          <Text style={styles.bodyText}>Limite noturno</Text>
          <View style={styles.limitPill}>
            <Text style={styles.statusPillText}>
              {rules.eveningLimitMinutes}m
            </Text>
          </View>
        </View>

        <View style={styles.presetRow}>
          {[15, 20, 30, 45, 60].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.presetChip,
                rules.eveningLimitMinutes === val && styles.presetChipActive,
              ]}
              onPress={() => updateGeneralRules({ eveningLimitMinutes: val })}
            >
              <Text
                style={[
                  styles.presetText,
                  rules.eveningLimitMinutes === val && styles.presetTextActive,
                ]}
              >
                {val}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Alertas suaves</Text>
            <Text style={styles.mutedSmall}>Pausas sem pressão, no seu ritmo</Text>
          </View>
          <Switch
            value={rules.gentleScrollAlerts}
            onValueChange={(v) => updateGeneralRules({ gentleScrollAlerts: v })}
            trackColor={{ false: '#D6DDD8', true: '#4A7C59' }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
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
            trackColor={{ false: '#D6DDD8', true: '#4A7C59' }}
          />
        </View>
      </View>

      {/* Limites por app */}
      <Text style={styles.sectionTitle}>Limites por app</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar apps..."
        placeholderTextColor="#8B9590"
        value={search}
        onChangeText={setSearch}
      />

      {filteredApps.map((app) => (
        <View key={app.id} style={styles.appRuleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{app.name}</Text>
            <Text style={styles.mutedSmall}>
              Limite de rolagem: {app.scrollLimitMinutes} min
            </Text>
          </View>

          <View style={styles.timePills}>
            {[10, 15, 20].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.miniPill,
                  app.scrollLimitMinutes === min && styles.miniPillActive,
                ]}
                onPress={() => setAppScrollLimit(app.id, min)}
              >
                <Text
                  style={[
                    styles.miniPillText,
                    app.scrollLimitMinutes === min && styles.miniPillTextActive,
                  ]}
                >
                  {min}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Switch
            value={app.monitored}
            onValueChange={() => toggleAppMonitored(app.id)}
            trackColor={{ false: '#D6DDD8', true: '#4A7C59' }}
          />
        </View>
      ))}

      {/* Adicionar novo app */}
      <View style={styles.addRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1, marginBottom: 0 }]}
          placeholder="Adicionar outro app (ex.: Pinterest)..."
          placeholderTextColor="#8B9590"
          value={newAppName}
          onChangeText={setNewAppName}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddApp}>
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7F5' },
  content: { padding: 20, paddingTop: 54, paddingBottom: 32 },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#1E2A24' },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1E2A24' },
  brandSub: { fontSize: 14, color: '#6D7873', marginTop: 2, marginBottom: 12 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D7873',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  statusPillText: { color: '#2F5B3E', fontWeight: '600', fontSize: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEFEA',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#4A5550' },
  trendBadge: {
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: { fontSize: 11, fontWeight: '700', color: '#2F5B3E' },
  bigMetric: { fontSize: 32, fontWeight: '700', color: '#1E2A24', marginTop: 6 },
  mutedSmall: { fontSize: 12, color: '#6D7873', marginTop: 2 },
  miniBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 50,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  miniBar: { width: 8, borderRadius: 4 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { fontSize: 11, color: '#4A7C59', fontWeight: '600' },
  simCta: {
    backgroundColor: '#4A7C59',
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
  },
  simCtaTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  simCtaSub: { color: '#E2EFE6', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E2A24', marginBottom: 8 },
  linkText: { color: '#3D6B7D', fontWeight: '700', fontSize: 13 },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEFEA',
    gap: 12,
  },
  appAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF2EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: { fontWeight: '700', color: '#24312B', fontSize: 12 },
  appName: { fontWeight: '700', color: '#1E2A24', fontSize: 14 },
  agentTitle: { fontSize: 16, fontWeight: '700', color: '#1E2A24' },
  agentStatus: { fontSize: 12, color: '#2F5B3E', fontWeight: '600', marginVertical: 4 },
  bodyText: { fontSize: 13, color: '#4A5550', lineHeight: 19 },
  highlightTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E2A24',
    marginBottom: 6,
  },
  weekChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 8,
  },
  weekCol: { alignItems: 'center', flex: 1 },
  weekBar: { width: 20, borderRadius: 6, marginVertical: 4 },
  dayLabel: { fontSize: 12, fontWeight: '700', color: '#24312B' },
  tinyLabel: { fontSize: 10, color: '#6D7873' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#4A7C59',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  dismissBtn: {
    flex: 1,
    backgroundColor: '#F2F4F2',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissText: { color: '#4A5550', fontWeight: '600', fontSize: 13 },
  limitPill: {
    backgroundColor: '#EAF2EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 8 },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F3F5F3',
    alignItems: 'center',
  },
  presetChipActive: { backgroundColor: '#EAF2EC', borderWidth: 1, borderColor: '#4A7C59' },
  presetText: { fontSize: 12, fontWeight: '600', color: '#4A5550' },
  presetTextActive: { color: '#2F5B3E', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2EF',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E2A24',
    marginBottom: 12,
  },
  appRuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECEFEA',
    gap: 8,
  },
  timePills: { flexDirection: 'row', gap: 4 },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F2F4F2',
  },
  miniPillActive: { backgroundColor: '#EAF2EC' },
  miniPillText: { fontSize: 11, fontWeight: '600', color: '#6D7873' },
  miniPillTextActive: { color: '#2F5B3E', fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  addBtn: {
    backgroundColor: '#3D6B7D',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});