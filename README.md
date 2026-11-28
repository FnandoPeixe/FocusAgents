# FocusAgents

Aplicativo mobile desenvolvido como projeto acadêmico para monitorar hábitos de uso em redes sociais, identificar padrões de *scrolling automático* e oferecer intervenções leves e personalizadas — ajudando o usuário a reduzir o tempo de tela sem precisar abandonar as redes sociais completamente.

---

## Arquitetura de Agentes (Lógica Tradicional + IA)

O sistema separa regras determinísticas (rápidas, previsíveis e executadas localmente) da camada de Inteligência Artificial (LLMs):

1. **Agente Analista de Padrões (`src/services/rulesEngine.ts` + `src/services/agentsService.ts`)**
   - Monitora frequência, horários e duração das sessões.
   - Verifica limites configurados pelo usuário e ritmo de rolagem contínua por lógica determinística.
   - Utiliza análise comportamental para identificar padrões menos óbvios de uso.

2. **Agente Orientador (`src/services/agentsService.ts` + `src/screens/FeedSimulatorScreen.tsx`)**
   - Recebe os alertas disparados pelo Analista de Padrões durante o uso.
   - Pergunta ao usuário qual é a sua intenção naquele momento (via tags rápidas ou texto livre).
   - Interpreta a resposta com LLM (com *fallback* local) e recomenda atividades alternativas leves, respeitando integralmente a decisão caso o usuário escolha continuar navegando.

3. **Agente Reflexivo (`src/services/agentsService.ts` + `src/screens/MainTabsScreens.tsx`)**
   - Analisa o histórico semanal de sessões e identifica evoluções nos hábitos.
   - Gera resumos claros e personalizados sobre frequência, duração e horários de pico.
   - Propõe ajustes nas regras e limites, aplicando mudanças **somente após autorização explícita** do usuário.

---

## Estrutura de Pastas

```text
FocusAgents1.0/
├── App.tsx                         # Ponto de entrada e navegação inferior
├── .env.example                    # Exemplo de variáveis de ambiente
├── .gitignore                      # Arquivos e pastas ignorados pelo Git
└── src/
    ├── types/
    │   └── focusAgents.ts          # Interfaces e tipos do domínio
    ├── services/
    │   ├── rulesEngine.ts          # Regras determinísticas de tempo e rolagem
    │   └── agentsService.ts        # Lógica dos 3 agentes (LLM + fallback offline)
    ├── context/
    │   └── AppContext.tsx          # Estado global persistido com AsyncStorage
    └── screens/
        ├── MainTabsScreens.tsx     # Telas: Início, Agentes, Insights e Regras
        └── FeedSimulatorScreen.tsx # Simulador de feed com detecção de scroll e modal de intervenção
```
      
### Como executar

## Pré-requisitos

- Node.js instalado na máquina

- Aplicativo Expo Go no celular (Android ou iOS) ou navegador web

- (Opcional) Chave de API de LLM caso queira testar chamadas reais em vez do fallback local

## Como executar passo a passo

Clone o repositório e entre na pasta do projeto:

```Bash
git clone [https://github.com/FnandoPeixe/FocusAgents.git](https://github.com/FnandoPeixe/FocusAgents.git)
cd FocusAgents
```

Instale as dependências:

```Bash
npm install
```

(Opcional) Configure as variáveis de ambiente:
Crie um arquivo .env na raiz a partir do .env.example:

Snippet de código
EXPO_PUBLIC_OPENAI_API_KEY=sua_chave_aqui

Sem chave configurada (ou sem conexão com a internet), o aplicativo continua funcionando normalmente usando as respostas de contingência (fallback).

Inicie o servidor do Expo:

```Bash
npx expo start
```
- No celular: abra o Expo Go e escaneie o QR Code exibido no terminal.

- No navegador: aperte w no terminal (ou rode npx expo start --web).

- Se o celular não estiver conectado na mesma rede local: rode npx expo start --tunnel.

## Limitações desta versão (Protótipo Acadêmico)
1. Monitoramento externo e sobreposição de tela: Em sistemas mobile reais (Android e iOS), monitorar o uso de outros aplicativos e exibir intervenções por cima deles     exige APIs específicas e permissões do sistema operacional (como UsageStats / Accessibility no Android ou Screen Time no iOS, com regras estritas de plataforma). Nesta versão, esse comportamento é demonstrado por meio de um simulador de feed integrado ao aplicativo.

2. Métricas iniciais ilustrativas: Parte dos dados exibidos nos gráficos diários e semanais começa com valores pré-carregados para facilitar a demonstração imediata, somando-se às novas sessões registradas durante o uso.

3. Dependência opcional de API externa de LLM: As chamadas aos modelos de linguagem dependem de chave configurada em variável de ambiente; sem ela (ou sem internet), o sistema recorre a respostas locais de contingência (fallback).

## Próximas evoluções
- Integração completa com LLM: Conectar e refinar os prompts dos agentes (Analista de Padrões, Agente Orientador e Agente Reflexivo) com respostas reais e validação de formato.

- Cálculo 100% dinâmico de métricas: Atualizar os gráficos de horário, picos de rolagem e médias semanais exclusivamente a partir do histórico real de sessões e interações do usuário.

- Testes com usuários e pesquisa nativa: Avaliar a clareza e a não invasividade das intervenções com colegas/usuários-teste e investigar viabilidade de módulos nativos no sistema alvo.
