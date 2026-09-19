import React, { useState } from 'react';
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
} from 'lucide-react';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';

interface PlayerTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateSheet?: () => void;
}

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const PlayerTutorialModal: React.FC<PlayerTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateSheet,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      badge: 'Capítulo I • O Começo',
      title: 'Bem-vindo a Nexaria: O Legado do Abismo',
      subtitle: 'Um universo onde magia ancestral se choca com tecnologia avançada.',
      icon: BookOpen,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Você acaba de adentrar a plataforma oficial de RPG de <strong className="text-amber-300 font-cinzel">Nexaria</strong>.
            Aqui, mestres e aventureiros gerenciam fichas detalhadas, conduzem batalhas do Abismo e operam transações monetárias com feedback sonoro e visual em tempo real.
          </p>

          <div className="rounded-xl border border-purple-900/60 bg-[#120b22]/90 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-cinzel font-bold text-xs uppercase">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Como funcionam as Salas</span>
            </div>
            <p className="text-xs text-zinc-400">
              Cada mesa de jogo possui um <strong className="text-zinc-200">Código de Sala</strong> (visível no topo, ex:{' '}
              <code className="text-amber-300 font-mono font-bold bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                NEX-1024
              </code>
              ). Compartilhe esse código com seu Mestre ou amigos para que todos fiquem conectados à mesma campanha.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
            💡 <strong className="text-zinc-200">Dica:</strong> Você pode navegar por este tutorial com os botões abaixo ou clicar nos círculos numerados para rever qualquer tópico.
          </div>
        </div>
      ),
    },
    {
      id: 'sheet',
      badge: 'Capítulo II • O Aventureiro',
      title: 'Sua Ficha de Personagem',
      subtitle: 'Controle vitalício, perícias, inventário e capacidades heroicas.',
      icon: UserCheck,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Na aba <strong className="text-amber-300 font-cinzel">Ficha</strong>, você visualiza e interage com os atributos completos do seu personagem:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-red-900/50 bg-red-950/20">
              <div className="text-xs font-cinzel font-bold text-red-300 mb-1">❤️ Pontos de Vida (HP)</div>
              <p className="text-[11px] text-zinc-400">
                Aumente ou reduza sua vida conforme os combates e descansos da sessão.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-sky-900/50 bg-sky-950/20">
              <div className="text-xs font-cinzel font-bold text-sky-300 mb-1">✨ Mana &amp; Estamina</div>
              <p className="text-[11px] text-zinc-400">
                Recursos para conjuração de magias arcanas e manobras cibernéticas.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-amber-900/50 bg-amber-950/20">
              <div className="text-xs font-cinzel font-bold text-amber-300 mb-1">🛡️ Defesa &amp; Perícias</div>
              <p className="text-[11px] text-zinc-400">
                Classe de Armadura (CA), Iniciativa, atributos (FOR, DES, CON, INT, SAB, CAR) e inventário.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-purple-900/60 bg-[#120b22]/90 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-purple-900/50 flex items-center justify-center text-amber-400 font-bold shrink-0">
              ✦
            </div>
            <p className="text-xs text-purple-200">
              <strong className="text-amber-300">Alternando entre Personagens:</strong> No canto superior direito, use o seletor{' '}
              <span className="text-zinc-200 font-medium">&ldquo;Atuando como&rdquo;</span> para alternar para outra ficha ou assumir o papel de Mestre.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'currency',
      badge: 'Capítulo III • A Economia',
      title: 'Sistema Monetário de Nexaria',
      subtitle: 'Cinco moedas ancestrais com lastro oficial em Bronze.',
      icon: Coins,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            O comércio em Nexaria utiliza 5 moedas oficiais com núcleos de pedra do Abismo e cotação matemática precisa:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 flex flex-col items-center">
              <CoinVisual type="BRZ" size="sm" interactiveFlip />
              <span className="text-[11px] font-cinzel font-bold text-amber-200 mt-1">Bronze</span>
              <span className="text-[10px] font-mono text-zinc-400">1 BRZ</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 flex flex-col items-center">
              <CoinVisual type="PRT" size="sm" interactiveFlip />
              <span className="text-[11px] font-cinzel font-bold text-zinc-200 mt-1">Prata</span>
              <span className="text-[10px] font-mono text-amber-400">10 BRZ</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 flex flex-col items-center">
              <CoinVisual type="ORO" size="sm" interactiveFlip />
              <span className="text-[11px] font-cinzel font-bold text-yellow-300 mt-1">Ouro</span>
              <span className="text-[10px] font-mono text-amber-400">100 BRZ</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 flex flex-col items-center">
              <CoinVisual type="PLN" size="sm" interactiveFlip />
              <span className="text-[11px] font-cinzel font-bold text-cyan-200 mt-1">Platina</span>
              <span className="text-[10px] font-mono text-amber-400">1.000 BRZ</span>
            </div>
            <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 flex flex-col items-center">
              <CoinVisual type="CYB" size="sm" interactiveFlip />
              <span className="text-[11px] font-cinzel font-bold text-purple-300 mt-1">Cyber</span>
              <span className="text-[10px] font-mono text-amber-400">5.000 BRZ</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-400">
            <p>
              &bull; <strong className="text-zinc-200">Transferir Moedas:</strong> Clique no botão de enviar moedas na sua ficha ou no Banco para transferir dinheiro para outro herói ou pagar o Mestre.
            </p>
            <p>
              &bull; <strong className="text-zinc-200">Câmbio de Moedas:</strong> No Banco de Moedas você pode trocar bronzes por ouro ou cybermoedas instantaneamente sem taxas abusivas.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'rules_bestiary',
      badge: 'Capítulo IV • O Conhecimento',
      title: 'Tabela de Regras & Bestiário do Abismo',
      subtitle: 'Ações táticas em combate e 24 criaturas com espólios prontos para saque.',
      icon: Scroll,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            A barra de navegação no topo oferece acesso direto a todo o compêndio canônico do jogo:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-purple-900/60 bg-[#120a22]/90">
              <div className="flex items-center gap-2 text-amber-300 font-cinzel font-bold text-xs mb-1.5">
                <Scroll className="w-4 h-4 text-amber-400" />
                <span>Aba de Regras &amp; Referências</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Consulte ações em combate (Ataque, Esquiva, Desengajar, Ajudar), tipos de testes de resistência e estados como Envenenado, Cego ou Atordoado.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-900/60 bg-[#120a22]/90">
              <div className="flex items-center gap-2 text-red-300 font-cinzel font-bold text-xs mb-1.5">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Bestiário do Abismo</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                24 aberrações e monstros catalogados. Ao derrotar um monstro em sessão, qualquer jogador ou Mestre pode clicar em{' '}
                <strong className="text-amber-300">&ldquo;Reivindicar Saque&rdquo;</strong> para receber o ouro na bolsa.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'animations_finish',
      badge: 'Capítulo V • Conclusão',
      title: 'Tudo Pronto para a Jornada!',
      subtitle: 'Animações dinâmicas de envio, recebimento e saldo insuficiente acompanham cada ação.',
      icon: Sparkles,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
          <p>
            Cada pagamento realizado ou recebido aciona animações visuais com celebração e áudio característico de moedas metálicas nobres. Se faltar dinheiro na bolsa, o sistema avisa com um tremor de saldo insuficiente.
          </p>

          <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-purple-950/60 via-[#100b20] to-amber-950/40 text-center space-y-2">
            <div className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
              ✦ O Abismo aguarda sua coragem ✦
            </div>
            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              Explore cavernas rúnicas, negocie nas feiras cibernéticas e forje lendas inesquecíveis ao lado de seus aliados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenCreateSheet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateSheet();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
              >
                <span>Forjar Minha Primeira Ficha</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-purple-800 bg-purple-950/70 hover:bg-purple-900 text-purple-200 hover:text-white font-cinzel font-bold text-xs transition text-center"
            >
              Entrar na Mesa Agora
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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="relative w-full max-w-2xl rounded-2xl border border-amber-600/50 bg-gradient-to-b from-[#160c2c] via-[#0d081b] to-[#08050e] p-5 sm:p-7 text-zinc-100 shadow-2xl overflow-hidden my-auto"
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
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Fechar Tutorial"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header do Passo Atual */}
          <div className="mb-5 pb-4 border-b border-purple-900/50">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-widest mb-2 shadow-inner">
              <currentStep.icon className="w-3 h-3 text-amber-400" />
              <span>{currentStep.badge}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wide">
              {currentStep.title}
            </h2>

            <p className="text-xs text-purple-200/80 font-sans mt-1">
              {currentStep.subtitle}
            </p>
          </div>

          {/* Conteúdo Dinâmico do Passo */}
          <div className="min-h-[220px] mb-6">
            {currentStep.content}
          </div>

          {/* Rodapé com Navegação, Indicadores de Passos e Botões */}
          <div className="pt-4 border-t border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Indicadores de bolinhas */}
            <div className="flex items-center gap-1.5">
              {steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleJumpToStep(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      isActive
                        ? 'w-7 bg-amber-400 shadow-md shadow-amber-400/50'
                        : isPassed
                        ? 'w-2.5 bg-purple-500 hover:bg-purple-400'
                        : 'w-2.5 bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    title={`Ir para ${step.title}`}
                  />
                );
              })}
              <span className="text-[11px] font-mono text-zinc-400 ml-2">
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>

            {/* Controles Anterior e Próximo */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-cinzel font-semibold flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition ml-auto sm:ml-0"
              >
                <span>{isLastStep ? 'Concluir Guia' : 'Próximo'}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
