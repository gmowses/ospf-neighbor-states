import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, GitBranch, ChevronRight } from 'lucide-react'

const translations = {
  en: {
    title: 'OSPF Neighbor States',
    subtitle: 'Interactive state machine diagram for OSPF neighbor adjacency. Click any state to explore transitions and troubleshooting tips.',
    clickState: 'Click a state to see details',
    stateDetail: 'State Detail',
    description: 'Description',
    triggers: 'Transition Triggers',
    troubleshoot: 'Troubleshooting',
    fullPath: 'Full Adjacency Path',
    references: 'References',
    refList: ['RFC 2328 - OSPF Version 2 (Section 10: Neighbor State Machine)'],
    builtBy: 'Built by',
    states: {
      Down: {
        description: 'No Hello packets have been received from the neighbor recently (or the neighbor has been manually reset). This is the initial state.',
        triggers: ['Start event: initial neighbor discovery', 'HelloInterval*DeadInterval timer expired', 'Neighbor explicitly removed (Kill Nbr event)'],
        troubleshoot: ['Check physical connectivity and Layer 2', 'Verify OSPF is enabled on the interface', 'Ensure hello/dead timers match on both sides'],
      },
      Attempt: {
        description: 'Applies to NBMA and point-to-multipoint non-broadcast networks only. The router is sending Hello packets to statically configured neighbors but has not yet received a Hello back.',
        triggers: ['Start event on NBMA or P2MP-NB interface', 'Triggered after the poll interval expires without response'],
        troubleshoot: ['Verify neighbor IP is reachable at Layer 3', 'Check NBMA neighbor statements on both routers', 'Ensure poll interval is correctly configured'],
      },
      Init: {
        description: 'A Hello packet has been received from the neighbor, but this router\'s own Router ID has not appeared in the neighbor\'s Hello yet (one-way communication).',
        triggers: ['HelloReceived event: a valid Hello arrived', 'Router ID not yet seen in neighbor\'s Hello neighbor list'],
        troubleshoot: ['Check that both routers share the same subnet (matching network/mask)', 'Verify area ID matches on both interfaces', 'Confirm MTU matches (or ip ospf mtu-ignore is configured)'],
      },
      '2-Way': {
        description: 'Bidirectional communication established. Both routers see each other in their Hello packets. DR/BDR election happens here on broadcast/NBMA networks.',
        triggers: ['2-WayReceived event: this router\'s RID appears in neighbor\'s Hello', 'DR/BDR election may occur at this point'],
        troubleshoot: ['If stuck here on broadcast: check DR/BDR election (priority, RID)', 'Non-DR/BDR neighbors on broadcast networks stay at 2-Way with each other (this is normal)', 'Verify OSPF network type is consistent'],
      },
      ExStart: {
        description: 'Neighbors negotiate master/slave roles and the initial DBD sequence number. The router with the higher Router ID becomes master.',
        triggers: ['AdjOK event: the routers decide to form a full adjacency', 'DBD packets exchanged to negotiate master/slave'],
        troubleshoot: ['Stuck in ExStart: most commonly caused by MTU mismatch', 'Run "ip ospf mtu-ignore" as a temporary fix, but resolve MTU at Layer 3', 'Check for duplicate Router IDs in the area'],
      },
      Exchange: {
        description: 'Routers exchange Database Description (DBD) packets containing their LSDB summaries. Each router builds a list of LSAs it needs.',
        triggers: ['NegotiationDone event: master/slave negotiation complete', 'DBD packets exchanged with LSA header summaries'],
        troubleshoot: ['Stuck in Exchange: check for corrupted or incompatible DBD packets', 'Verify that the same OSPF options are negotiated (E-bit, O-bit)', 'Look for interface flapping or packet loss'],
      },
      Loading: {
        description: 'Routers send Link State Request (LSR) packets to request full LSAs that they need. The neighbor responds with Link State Update (LSU) packets.',
        triggers: ['ExchangeDone event: all DBD packets processed', 'LSR/LSU/LSAck packets exchanged to synchronize LSDBs'],
        troubleshoot: ['Stuck in Loading: often indicates packet loss or MTU issue', 'Check for asymmetric MTU or fragmentation', 'Verify ACL/firewall is not blocking OSPF packets (IP proto 89)'],
      },
      Full: {
        description: 'The LSDB is fully synchronized. The adjacency is complete. The neighbor relationship is operational and routes are computed via SPF.',
        triggers: ['LoadingDone event: all requested LSAs received', 'SPF algorithm runs to compute routing table'],
        troubleshoot: ['If adjacency flaps: check for keepalive/hello timer mismatches', 'Monitor for LSA retransmissions (high retransmit count = connectivity issues)', 'Check CPU on routers — high SPF frequency can cause instability'],
      },
    },
  },
  pt: {
    title: 'Estados de Vizinho OSPF',
    subtitle: 'Diagrama interativo da maquina de estados de adjacencia OSPF. Clique em um estado para explorar transicoes e dicas de troubleshooting.',
    clickState: 'Clique em um estado para ver detalhes',
    stateDetail: 'Detalhe do Estado',
    description: 'Descricao',
    triggers: 'Gatilhos de Transicao',
    troubleshoot: 'Troubleshooting',
    fullPath: 'Caminho Completo de Adjacencia',
    references: 'Referencias',
    refList: ['RFC 2328 - OSPF Versao 2 (Secao 10: Maquina de Estados de Vizinho)'],
    builtBy: 'Criado por',
    states: {
      Down: {
        description: 'Nenhum pacote Hello foi recebido do vizinho recentemente (ou o vizinho foi reiniciado manualmente). Este e o estado inicial.',
        triggers: ['Evento Start: descoberta inicial de vizinho', 'Timer HelloInterval*DeadInterval expirou', 'Vizinho removido explicitamente (evento Kill Nbr)'],
        troubleshoot: ['Verifique conectividade fisica e Camada 2', 'Confirme que o OSPF esta habilitado na interface', 'Garanta que os timers hello/dead coincidem em ambos os lados'],
      },
      Attempt: {
        description: 'Aplica-se apenas a redes NBMA e ponto-a-multiponto nao-broadcast. O roteador esta enviando Hellos a vizinhos configurados estaticamente mas ainda nao recebeu resposta.',
        triggers: ['Evento Start em interface NBMA ou P2MP-NB', 'Disparado apos o poll interval expirar sem resposta'],
        troubleshoot: ['Verifique que o IP do vizinho e alcancavel na Camada 3', 'Confirme os comandos neighbor NBMA em ambos os roteadores', 'Verifique o poll interval configurado corretamente'],
      },
      Init: {
        description: 'Um pacote Hello foi recebido do vizinho, mas o Router ID deste roteador ainda nao apareceu no Hello do vizinho (comunicacao unidirecional).',
        triggers: ['Evento HelloReceived: um Hello valido chegou', 'Router ID ainda nao visto na lista de vizinhos do Hello recebido'],
        troubleshoot: ['Verifique que ambos compartilham a mesma sub-rede (network/mask)', 'Confirme que o ID da area e o mesmo em ambas as interfaces', 'Verifique MTU (ou configure ip ospf mtu-ignore)'],
      },
      '2-Way': {
        description: 'Comunicacao bidirecional estabelecida. Ambos os roteadores se enxergam nos Hellos. Eleicao DR/BDR ocorre aqui em redes broadcast/NBMA.',
        triggers: ['Evento 2-WayReceived: o RID deste roteador aparece no Hello do vizinho', 'Eleicao DR/BDR pode ocorrer neste ponto'],
        troubleshoot: ['Se preso aqui em broadcast: verifique eleicao DR/BDR (prioridade, RID)', 'Vizinhos nao-DR/BDR em broadcast ficam em 2-Way entre si (comportamento normal)', 'Verifique que o tipo de rede OSPF e consistente'],
      },
      ExStart: {
        description: 'Vizinhos negociam papeis master/slave e o numero de sequencia inicial do DBD. O roteador com maior Router ID torna-se master.',
        triggers: ['Evento AdjOK: roteadores decidem formar adjacencia completa', 'Pacotes DBD trocados para negociar master/slave'],
        troubleshoot: ['Preso em ExStart: causa mais comum e incompatibilidade de MTU', 'Use "ip ospf mtu-ignore" temporariamente, mas resolva o MTU na Camada 3', 'Verifique Router IDs duplicados na area'],
      },
      Exchange: {
        description: 'Roteadores trocam pacotes Database Description (DBD) com sumarios do LSDB. Cada roteador cria uma lista de LSAs que precisa solicitar.',
        triggers: ['Evento NegotiationDone: negociacao master/slave concluida', 'Pacotes DBD trocados com sumarios de cabecalhos LSA'],
        troubleshoot: ['Preso em Exchange: verifique pacotes DBD corrompidos ou incompativeis', 'Confirme que as mesmas opcoes OSPF sao negociadas (E-bit, O-bit)', 'Procure flapping de interface ou perda de pacotes'],
      },
      Loading: {
        description: 'Roteadores enviam pacotes Link State Request (LSR) para solicitar LSAs completos. O vizinho responde com Link State Update (LSU).',
        triggers: ['Evento ExchangeDone: todos os pacotes DBD processados', 'Pacotes LSR/LSU/LSAck trocados para sincronizar LSDBs'],
        troubleshoot: ['Preso em Loading: geralmente indica perda de pacotes ou problema de MTU', 'Verifique MTU assimetrico ou fragmentacao', 'Confirme que ACL/firewall nao bloqueia OSPF (IP proto 89)'],
      },
      Full: {
        description: 'O LSDB esta completamente sincronizado. A adjacencia esta completa e operacional. Rotas sao calculadas pelo algoritmo SPF.',
        triggers: ['Evento LoadingDone: todos os LSAs solicitados recebidos', 'Algoritmo SPF executa para calcular a tabela de rotas'],
        troubleshoot: ['Se a adjacencia flutua: verifique timers hello/dead', 'Monitore retransmissoes de LSA (alto numero indica problemas de conectividade)', 'Verifique CPU dos roteadores — alta frequencia de SPF pode causar instabilidade'],
      },
    },
  },
} as const

type Lang = keyof typeof translations
type StateName = keyof typeof translations.en.states

const STATE_ORDER: StateName[] = ['Down', 'Attempt', 'Init', '2-Way', 'ExStart', 'Exchange', 'Loading', 'Full']

const STATE_COLORS: Record<StateName, string> = {
  Down:     'bg-red-500',
  Attempt:  'bg-orange-400',
  Init:     'bg-amber-400',
  '2-Way':  'bg-yellow-400',
  ExStart:  'bg-lime-500',
  Exchange: 'bg-green-500',
  Loading:  'bg-teal-500',
  Full:     'bg-teal-600',
}

const STATE_BORDER: Record<StateName, string> = {
  Down:     'border-red-500',
  Attempt:  'border-orange-400',
  Init:     'border-amber-400',
  '2-Way':  'border-yellow-400',
  ExStart:  'border-lime-500',
  Exchange: 'border-green-500',
  Loading:  'border-teal-500',
  Full:     'border-teal-600',
}

const STATE_TEXT: Record<StateName, string> = {
  Down:     'text-red-600 dark:text-red-400',
  Attempt:  'text-orange-600 dark:text-orange-400',
  Init:     'text-amber-600 dark:text-amber-400',
  '2-Way':  'text-yellow-600 dark:text-yellow-400',
  ExStart:  'text-lime-600 dark:text-lime-400',
  Exchange: 'text-green-600 dark:text-green-400',
  Loading:  'text-teal-600 dark:text-teal-400',
  Full:     'text-teal-700 dark:text-teal-300',
}

export default function OspfNeighborStates() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [selected, setSelected] = useState<StateName>('Full')

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const stateData = t.states[selected]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <GitBranch size={18} className="text-white" />
            </div>
            <span className="font-semibold">OSPF Neighbor States</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/ospf-neighbor-states" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* State machine diagram */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <h2 className="font-semibold mb-4">{t.fullPath}</h2>
              <div className="flex flex-col items-center gap-1">
                {STATE_ORDER.map((state, i) => (
                  <div key={state} className="flex flex-col items-center w-full">
                    <button
                      onClick={() => setSelected(state)}
                      className={`w-full text-center rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                        selected === state
                          ? `${STATE_COLORS[state]} text-white ${STATE_BORDER[state]} scale-105 shadow-lg`
                          : `${STATE_BORDER[state]} ${STATE_TEXT[state]} hover:bg-zinc-50 dark:hover:bg-zinc-800`
                      }`}
                    >
                      {state}
                    </button>
                    {i < STATE_ORDER.length - 1 && (
                      <ChevronRight size={14} className="text-zinc-400 rotate-90 my-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className={`rounded-xl border-2 ${STATE_BORDER[selected]} bg-white dark:bg-zinc-900 overflow-hidden`}>
                <div className={`${STATE_COLORS[selected]} px-6 py-4`}>
                  <h2 className="text-white font-bold text-lg">{selected}</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 font-medium mb-2">{t.description}</h3>
                    <p className="text-sm leading-relaxed">{stateData.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-zinc-400 font-medium mb-2">{t.triggers}</h3>
                    <ul className="space-y-1.5">
                      {stateData.triggers.map((trigger, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${STATE_COLORS[selected]}`} />
                          <span className="text-zinc-600 dark:text-zinc-400">{trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4">
                    <h3 className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-medium mb-2">{t.troubleshoot}</h3>
                    <ul className="space-y-1.5">
                      {stateData.troubleshoot.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                          <span className="text-zinc-600 dark:text-zinc-400">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {STATE_ORDER.indexOf(selected) > 0 && (
                  <button
                    onClick={() => setSelected(STATE_ORDER[STATE_ORDER.indexOf(selected) - 1])}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center"
                  >
                    &larr; {STATE_ORDER[STATE_ORDER.indexOf(selected) - 1]}
                  </button>
                )}
                {STATE_ORDER.indexOf(selected) < STATE_ORDER.length - 1 && (
                  <button
                    onClick={() => setSelected(STATE_ORDER[STATE_ORDER.indexOf(selected) + 1])}
                    className="flex-1 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors text-center"
                  >
                    {STATE_ORDER[STATE_ORDER.indexOf(selected) + 1]} &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold mb-3">{t.references}</h2>
            <ul className="space-y-1">
              {t.refList.map(ref => (
                <li key={ref} className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5">•</span>{ref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-teal-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
