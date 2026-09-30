import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  UserCheck,
  Coins,
  Scroll,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Swords,
  Crown,
  Compass,
  Store,
  Check,
  Copy,
  Zap,
  Heart,
  Shield,
  HelpCircle,
  Play,
  RotateCcw,
  Palette,
  ScrollText,
  FlaskConical,
  Hammer,
} from 'lucide-react';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
import { CurrencyType } from '../types/rpg';

export type TutorialViewTarget =
  | 'lobby'
  | 'sheet'
  | 'bank'
  | 'master'
  | 'inventory'
  | 'shop'
  | 'ledger'
  | 'rules'
  | 'bestiary'
  | 'map'
  | 'journal'
  | 'alchemy';

interface PlayerTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateSheet?: () => void;
  onNavigateView?: (view: TutorialViewTarget) => void;
  campaignCode?: string;
}

interface TutorialStep {
  id: string;
  badge: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  renderContent: () => React.ReactNode;
}

export const PlayerTutorialModal: React.FC<PlayerTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateSheet,
  onNavigateView,
  campaignCode = 'NX-SALA',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Interactive currency preview selector
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('ORO');

  // "Don't show again" preference
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexaria_tutorial_seen_v1') === 'true';
    } catch {
      return false;
    }
  });

  // Keyboard navigation (Escape to close, Arrows to paginate)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(prev + 1, 7));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleDontShow = (checked: boolean) => {
    setDontShowAgain(checked);
    try {
      if (checked) {
        localStorage.setItem('nexaria_tutorial_seen_v1', 'true');
      } else {
        localStorage.removeItem('nexaria_tutorial_seen_v1');
      }
    } catch {
      // ignore
    }
  };

  const handleCopyCode = () => {
    sound.playCoinClink('PRT');
    navigator.clipboard.writeText(campaignCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currencyDetails: Record<
    CurrencyType,
    { name: string; valueBrz: string; description: string; role: string }
  > = {
    BRZ: {
      name: 'Bronze Ancestral (BRZ)',
      valueBrz: '1 BRZ (Base do lastro)',
      description: 'Moeda corrente para estalagens, refeições, munições e compras cotidianas.',
      role: 'Uso diário para qualquer viajante.',
    },
    PRT: {
      name: 'Prata Rúnica (PRT)',
      valueBrz: '10 BRZ',
      description: 'Utilizada para pergaminhos, poções medicinais e contratação de guias.',
      role: 'Padrão dos aventureiros para suprimentos.',
    },
    ORO: {
      name: 'Ouro Forjado (ORO)',
      valueBrz: '100 BRZ (ou 10 PRT)',
      description: 'Moeda nobre para armas de aço nobre, armaduras forjadas e recompensas de chefes.',
      role: 'Recompensa maior de combates e espólios.',
    },
    PLN: {
      name: 'Platina Celestial (PLN)',
      valueBrz: '1.000 BRZ (ou 10 ORO)',
      description: 'Metais purificados por rituais. Compra artefatos mágicos e propriedades.',
      role: 'Comércio de alta nobreza e templos.',
    },
    CYB: {
      name: 'Cybermoeda do Abismo (CYB)',
      valueBrz: '5.000 BRZ (ou 50 ORO)',
      description: 'Cristal tecnomágico infundido com dados etéreos. Adquire relíquias proibidas.',
      role: 'Moeda suprema de tecnologia do Abismo.',
    },
  };

  const steps: TutorialStep[] = [
    // PASSO 1: O Básico e Conexão
    {
      id: 'quickstart',
      badge: 'Passo 1 de 8 • Começando Rápido',
      shortLabel: 'Salas & Conexão',
      title: 'Salas e Conexão em Tempo Real',
      subtitle: 'Como conectar mestres e jogadores na mesma mesa em segundos.',
      icon: KeyRound,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Em <strong className="text-amber-300 font-cinzel">Nexaria</strong>, você joga de forma colaborativa com sincronização em tempo real.
            Para reunir seu grupo de RPG, tudo o que você precisa é do <strong className="text-zinc-100">Código da Sala</strong>.
          </p>

          <div className="p-3 rounded-xl border border-purple-900/60 bg-[#120a22]/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-cinzel font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Sua Sala Atual:</span>
              </div>
              <p className="text-xs text-zinc-400">
                Compartilhe com seus companheiros de aventura para entrarem juntos:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300 text-sm bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
                {campaignCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1 transition"
                title="Copiar Código da Sala"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Mestre da Mesa (GM)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Pode cobrar taxas, distribuir XP (+100 XP), conceder recompensas em moedas e cadastrar itens na Loja.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Aventureiro (Jogador)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Gerencia PV, PM, atributos, inventário, realiza saques no Bestiário e transfere moedas aos aliados.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-center justify-between">
            <span>💡 <strong>Dica Prática:</strong> No canto superior direito, use o seletor <em>"Atuando como"</em> para trocar de personagem ou assumir o Mestre.</span>
            {onNavigateView && (
              <button
                type="button"
                onClick={() => onNavigateView('lobby')}
                className="ml-3 shrink-0 text-amber-300 hover:text-amber-100 font-cinzel font-bold text-xs underline"
              >
                Ir para Salas &rarr;
              </button>
            )}
          </div>
        </div>
      ),
    },

    // PASSO 2: A Ficha do Personagem
    {
      id: 'sheet',
      badge: 'Passo 2 de 8 • A Ficha Heroica',
      shortLabel: 'Ficha & Recursos',
      title: 'Sua Ficha de Personagem Completa',
      subtitle: 'Controle de Vida (HP), Mana (PM), Estamina, Raça, Classe e Sexo/Gênero.',
      icon: UserCheck,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            A ficha é o coração do seu herói. Todos os status vitais possuem atalhos rápidos de +1, -1, cura e dano:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl border border-red-900/50 bg-red-950/20">
              <div className="text-xs font-cinzel font-bold text-red-300 flex items-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span>Pontos de Vida (HP)</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Sua vitalidade em combate. Ao cair a 0 HP, você entra em estado de incapacitação.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-900/50 bg-sky-950/20">
              <div className="text-xs font-cinzel font-bold text-sky-300 flex items-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Pontos de Mana (PM)</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Energia mágica gasta para conjurar feitiços, magias ofensivas e barreiras.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-emerald-900/50 bg-emerald-950/20">
              <div className="text-xs font-cinzel font-bold text-emerald-300 flex items-center gap-1 mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estamina &amp; Defesa</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Utilizada para manobras físicas heroicas e esquivas. Sua CA define a dificuldade de ser atingido.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-purple-900/60 bg-[#120a22]/90 space-y-1.5">
            <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Personalização Completa com IA:</span>
            </div>
            <p className="text-xs text-zinc-400">
              Agora você pode definir o <strong className="text-zinc-200">Sexo / Gênero</strong> (Masculino, Feminino, Não-Binário, Andrógino, Agênero, etc.),{' '}
              <strong className="text-zinc-200">Raça</strong>, <strong className="text-zinc-200">Classe</strong>, <strong className="text-zinc-200">Região de Origem em Eldria</strong> e{' '}
              <strong className="text-zinc-200">Idiomas Nativos</strong>. Clique em <em>"Gerar com IA"</em> para conjurar um retrato épico correspondente!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-zinc-400">
              Descansos rápidos: use <strong>Descanso Curto (+1d8 HP)</strong> ou <strong>Descanso Longo (100% HP/PM)</strong>.
            </span>
            {onNavigateView && (
              <button
                type="button"
                onClick={() => onNavigateView('sheet')}
                className="px-3 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-medium transition"
              >
                Abrir Minha Ficha &rarr;
              </button>
            )}
          </div>
        </div>
      ),
    },

    // PASSO 3: Economia e Moedas
    {
      id: 'currency',
      badge: 'Passo 3 de 8 • Economia Prática',
      shortLabel: '5 Moedas & Banco',
      title: 'As 5 Moedas Canônicas de Nexaria',
      subtitle: 'Bronze, Prata, Ouro, Platina e Cybermoedas com cotação exata e câmbio instantâneo.',
      icon: Coins,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Clique nas moedas abaixo para ouvir o som metálico e entender o valor de cada uma:
          </p>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((curr) => {
              const isSelected = selectedCurrency === curr;
              return (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    sound.playCoinClink(curr);
                    setSelectedCurrency(curr);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center transition ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-950/60 scale-105'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                  }`}
                >
                  <CoinVisual type={curr} size="sm" interactiveFlip />
                  <span className="text-[10px] font-cinzel font-bold text-zinc-200 mt-1">{curr}</span>
                  <span className="text-[9px] font-mono text-amber-400/90">
                    {curr === 'BRZ' ? '1x' : curr === 'PRT' ? '10x' : curr === 'ORO' ? '100x' : curr === 'PLN' ? '1.000x' : '5.000x'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detalhe da Moeda Selecionada */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-[#140c26] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-cinzel font-bold text-amber-300 text-xs sm:text-sm">
                {currencyDetails[selectedCurrency].name}
              </span>
              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                Valor: {currencyDetails[selectedCurrency].valueBrz}
              </span>
            </div>
            <p className="text-xs text-zinc-300">{currencyDetails[selectedCurrency].description}</p>
            <p className="text-[11px] text-zinc-400 italic">✦ {currencyDetails[selectedCurrency].role}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <strong className="text-amber-300">💸 Transferência Direta:</strong> Na sua ficha, clique em <em>"Transferir Moedas"</em> para pagar aliados ou o Mestre em tempo real.
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <strong className="text-amber-300">🏦 Banco de Câmbio:</strong> Troque bronze por ouro ou converta cybermoedas sem perdas de valor.
            </div>
          </div>

          {onNavigateView && (
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => onNavigateView('bank')}
                className="text-xs text-amber-300 hover:text-amber-100 font-cinzel font-bold underline"
              >
                Abrir Banco de Moedas &rarr;
              </button>
            </div>
          )}
        </div>
      ),
    },

    // PASSO 4: Combate, Tabela de Regras e Bestiário
    {
      id: 'combat',
      badge: 'Passo 4 de 8 • Combate & Bestiário',
      shortLabel: 'Combate & Saques',
      title: 'Regras de Combate & Bestiário do Abismo',
      subtitle: 'Ações táticas, cálculo de acertos e saques instantâneos de ouro ao vencer monstros.',
      icon: Swords,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            No combate de Nexaria, as ações e golpes são resolvidos comparando seus modificadores de atributo contra a Classe de Armadura (CA) dos adversários:
          </p>

          <div className="p-3 rounded-xl border border-purple-800/60 bg-gradient-to-r from-purple-950/60 to-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-900/70 border border-purple-700 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-cinzel font-bold text-zinc-100">Dinâmica de Resolução na Mesa</div>
                <div className="text-[11px] text-zinc-400">Sucessos Críticos causam dano dobrado; testes defensivos reduzem magias pela metade.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-700/60 text-[11px] font-mono text-purple-200">
                Atacante &ge; CA Alvo = Acerto
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1 mb-1">
                <Scroll className="w-3.5 h-3.5 text-amber-400" />
                <span>Ações no seu Turno</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ataque Físico, Conjuração de Magia, Esquiva (+desvantagem no inimigo), Desengajar (não sofre ataque de oportunidade) ou Ajudar aliado.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-red-900/60 bg-red-950/20">
              <div className="text-xs font-cinzel font-bold text-red-300 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Bestiário &amp; Reivindicar Saque</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                24 aberrações e chefes. Ao derrotar um monstro em sessão, clique em <strong className="text-amber-300">"Reivindicar Saque"</strong> para receber as moedas diretamente na sua bolsa!
              </p>
            </div>
          </div>

          {onNavigateView && (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => onNavigateView('rules')}
                className="text-zinc-400 hover:text-zinc-200 underline"
              >
                Ver Tabela de Regras &rarr;
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('bestiary')}
                className="text-amber-300 hover:text-amber-100 font-cinzel font-bold underline"
              >
                Explorar Bestiário do Abismo &rarr;
              </button>
            </div>
          )}
        </div>
      ),
    },

    // PASSO 5: Recursos do Mestre & Loja de Itens
    {
      id: 'gm_shop',
      badge: 'Passo 5 de 8 • Mestre & Compras',
      shortLabel: 'Mestre & Loja',
      title: 'Painel do Mestre e Loja de Campanhas',
      subtitle: 'Como o Mestre distribui XP, cobra taxas e mantém a economia fluindo.',
      icon: Crown,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            O Mestre possui ferramentas avançadas para conduzir a narrativa e gerenciar recompensas sem precisar calcular moedas manualmente no papel:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-amber-600/40 bg-amber-950/20 space-y-1">
              <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Distribuir +100 XP &amp; Recompensas</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Na aba <strong>Mestre</strong>, conceda XP direto para uma ficha ou para todos com comemoração sonora e efeitos de subida de nível.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-purple-900/50 bg-[#120a22]/80 space-y-1">
              <div className="text-xs font-cinzel font-bold text-purple-300 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-purple-400" />
                <span>Loja de Itens da Campanha</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Jogadores podem comprar poções, armas e armaduras na aba <strong>Loja</strong>. O valor é debitado na hora da carteira do herói.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
            <div className="text-xs font-semibold text-zinc-200">
              🧾 Cobrança de Taxas em 1 Clique:
            </div>
            <p className="text-xs text-zinc-400">
              O Mestre pode emitir cobranças (ex: 20 Bronze para pagar a pousada). O jogador recebe um aviso com botão de aprovar a transação.
            </p>
          </div>

          {onNavigateView && (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => onNavigateView('shop')}
                className="text-zinc-400 hover:text-zinc-200 underline"
              >
                Ver Loja de Itens &rarr;
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('master')}
                className="text-amber-300 hover:text-amber-100 font-cinzel font-bold underline"
              >
                Abrir Painel do Mestre &rarr;
              </button>
            </div>
          )}
        </div>
      ),
    },

    // PASSO 6: Crônicas de Campanha & Diário de Sessões
    {
      id: 'chronicles',
      badge: 'Passo 6 de 8 • Linha do Tempo & Feitos',
      shortLabel: 'Crônicas & Diário',
      title: 'Crônicas de Campanha & Diário de Sessões',
      subtitle: 'Registro automático de subidas de nível, aquisições de tesouros lendários e viagens pelo mapa.',
      icon: ScrollText,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Em Nexaria, a jornada do seu grupo é eternizada na aba <strong className="text-amber-300 font-cinzel">Diário &amp; Crônicas</strong> através de uma linha do tempo viva:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-amber-600/40 bg-amber-950/20 space-y-1">
              <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                <span>🌟</span>
                <span>Subidas de Nível</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ao alcançar um novo nível de poder, uma crônica heroica é gerada automaticamente com novo PV e maestria.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-purple-600/40 bg-purple-950/20 space-y-1">
              <div className="text-xs font-cinzel font-bold text-purple-300 flex items-center gap-1.5">
                <span>💎</span>
                <span>Tesouros Conquistados</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Itens raros, épicos, lendários e relíquias abissais compradas no Bazar ou saqueadas de monstros entram na crônica.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-emerald-600/40 bg-emerald-950/20 space-y-1">
              <div className="text-xs font-cinzel font-bold text-emerald-300 flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Avanços no Mapa</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ao explorar ou mover a comitiva no Mapa de Eldria, a chegada a novas cidades e masmorras é registrada.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1.5">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Anotações Livres &amp; Sincronização do Mestre:</span>
            </div>
            <p className="text-xs text-zinc-400">
              O Mestre pode adicionar registros manuais (grau normal, notável, épico ou lendário), filtrar por categoria e usar o botão <em>"Sincronizar Feitos"</em> para auditar em 1 clique o histórico da mesa.
            </p>
          </div>

          {onNavigateView && (
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => onNavigateView('journal')}
                className="text-xs text-amber-300 hover:text-amber-100 font-cinzel font-bold underline"
              >
                Abrir Diário &amp; Crônicas &rarr;
              </button>
            </div>
          )}
        </div>
      ),
    },

    // PASSO 7: Esquemas de Cores Globais & Ofícios da Época
    {
      id: 'themes_crafting',
      badge: 'Passo 7 de 8 • Ambientação & Forja',
      shortLabel: 'Temas & Ofícios',
      title: 'Esquemas de Cores da Sala & Ofícios Medievais',
      subtitle: 'Troca de tema visual exclusivo para o Mestre e durabilidade de armas em combate.',
      icon: Palette,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Personalize a imersão da sua mesa com ambientação dinâmica e novas profissões de época:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-purple-600/50 bg-[#160a2c] space-y-1">
              <div className="text-xs font-cinzel font-bold text-purple-300 flex items-center gap-1.5">
                <span>🔮</span>
                <span>Abismo Púrpura</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Violeta arcano e éter cósmico. O clássico padrão de Eldria com glifos profundos.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-amber-600/50 bg-[#241104] space-y-1">
              <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                <span>⚒️</span>
                <span>Forja Dourada</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Chamas da bigorna, brasas incandescentes e ligas de bronze nobre.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-emerald-600/50 bg-[#061e16] space-y-1">
              <div className="text-xs font-cinzel font-bold text-emerald-300 flex items-center gap-1.5">
                <span>🍃</span>
                <span>Ruínas Élficas</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Musgo esmeralda, névoa viva e pedras ancestrais dos bosques de Verdância.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
              <div className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-amber-400" />
                <span>Desgaste &amp; Reparo de Armas</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Armas sofrem desgaste após golpes e ataques críticos. Se a durabilidade zerar, a lâmina quebra e sofre penalidades até ser restaurada na bigorna.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1">
              <div className="text-xs font-cinzel font-bold text-sky-300 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                <span>Alquimia &amp; Forja</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Ferreiros e Alquimistas possuem bancadas próprias de ofício para forjar elixires, fogo grego e reparar armaduras com metade dos custos.
              </p>
            </div>
          </div>

          {onNavigateView && (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => onNavigateView('alchemy')}
                className="text-zinc-400 hover:text-zinc-200 underline"
              >
                Abrir Alquimia &amp; Forja &rarr;
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('master')}
                className="text-amber-300 hover:text-amber-100 font-cinzel font-bold underline"
              >
                Ver Configurações da Sala (GM) &rarr;
              </button>
            </div>
          )}
        </div>
      ),
    },

    // PASSO 8: O Mapa dos Reinos de Eldria & Começar
    {
      id: 'world_finish',
      badge: 'Passo 8 de 8 • Pronto para Jogar',
      shortLabel: 'Mapa & Jogar',
      title: 'Os Reinos de Eldria e Próximos Passos',
      subtitle: '8 regiões lendárias, viagens interativas e sua primeira aventura.',
      icon: Compass,
      renderContent: () => (
        <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            O mundo de <strong className="text-amber-300 font-cinzel">Eldria</strong> conta com 8 regiões canônicas interativas com capitais, níveis de perigo e idiomas locais:
          </p>

          <div className="p-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-purple-950/60 via-[#120a22] to-amber-950/40 space-y-1.5 text-center">
            <div className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
              ✦ Checklist Rápido de Início (30 Segundos) ✦
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left pt-1">
              <div className="p-2 rounded bg-black/40 border border-purple-900/40 text-[11px]">
                <strong className="text-amber-300">1. Crie ou Escolha:</strong> Selecione sua ficha no menu do topo ou crie uma nova ficha no Lobby.
              </div>
              <div className="p-2 rounded bg-black/40 border border-purple-900/40 text-[11px]">
                <strong className="text-amber-300">2. Mantenha os PV:</strong> Ajuste seus Pontos de Vida (HP) e Mana após combates e descansos.
              </div>
              <div className="p-2 rounded bg-black/40 border border-purple-900/40 text-[11px]">
                <strong className="text-amber-300">3. Transacione:</strong> Transfira moedas, compre na loja e reivindique saques no Bestiário!
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            {onOpenCreateSheet && (
              <button
                type="button"
                onClick={() => {
                  sound.playSuccessFanfare();
                  onClose();
                  onOpenCreateSheet();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
              >
                <span>Forjar Minha Ficha Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onNavigateView && (
              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  onNavigateView('map');
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-purple-700 bg-purple-950/60 hover:bg-purple-900 text-purple-200 font-cinzel font-semibold text-xs transition text-center"
              >
                Ver Mapa de Eldria
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playSuccessFanfare();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 font-cinzel font-bold text-xs transition text-center"
            >
              Entrar na Mesa
            </button>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      sound.playCoinClink('PRT');
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      sound.playSuccessFanfare();
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      sound.playCoinClink('BRZ');
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    sound.playCoinClink('BRZ');
    setCurrentStepIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl rounded-2xl border border-amber-600/50 bg-gradient-to-b from-[#160c2c] via-[#0d081b] to-[#08050e] p-4 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden my-auto"
        >
          {/* Adornos rúnicos de canto */}
          <div className="absolute top-2.5 left-3 text-amber-500/40 text-xs font-cinzel select-none">✦</div>
          <div className="absolute top-2.5 right-8 text-amber-500/40 text-xs font-cinzel select-none">✦</div>

          {/* Botão Fechar X */}
          <button
            type="button"
            onClick={() => {
              sound.playCoinClink('BRZ');
              onClose();
            }}
            className="absolute top-3 right-3 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Fechar Tutorial (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Barra de Passos Rápidos no Topo (Tabs com clique direto) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2.5 mb-3 border-b border-purple-900/40 scrollbar-thin">
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(idx)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-cinzel whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-amber-500/25 border border-amber-400 text-amber-300 font-bold'
                      : 'bg-purple-950/30 hover:bg-purple-900/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black/40 flex items-center justify-center text-[9px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{step.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Header do Passo Atual */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-widest mb-1.5 shadow-inner">
              <currentStep.icon className="w-3 h-3 text-amber-400" />
              <span>{currentStep.badge}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wide">
              {currentStep.title}
            </h2>

            <p className="text-xs text-purple-200/80 font-sans mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>

          {/* Conteúdo Dinâmico do Passo */}
          <div className="min-h-[260px] mb-4">
            {currentStep.renderContent()}
          </div>

          {/* Rodapé com Navegação, Não Mostrar Mais e Botões */}
          <div className="pt-3 border-t border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Checkbox "Não exibir automaticamente" */}
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none order-2 sm:order-1">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleToggleDontShow(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Não abrir automaticamente na inicialização</span>
            </label>

            {/* Controles Anterior e Próximo */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-cinzel font-semibold flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition ml-auto sm:ml-0"
              >
                <span>{isLastStep ? 'Concluir Tutorial' : 'Próximo'}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
