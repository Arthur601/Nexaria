import React, { useState } from 'react';
import { CurrencyType, CURRENCY_CONFIGS } from '../types/rpg';

interface CoinVisualProps {
  type: CurrencyType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  face?: 'front' | 'back';
  interactiveFlip?: boolean;
  showLabel?: boolean;
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CoinVisual: React.FC<CoinVisualProps> = ({
  type,
  size = 'md',
  face: initialFace = 'front',
  interactiveFlip = false,
  showLabel = false,
  showDetails = false,
  className = '',
  onClick,
}) => {
  const [currentFace, setCurrentFace] = useState<'front' | 'back'>(initialFace);
  const config = CURRENCY_CONFIGS[type];

  const sizePixel = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 84,
  }[size];

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-21 h-21',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (interactiveFlip) {
      e.stopPropagation();
      setCurrentFace((prev) => (prev === 'front' ? 'back' : 'front'));
    }
    if (onClick) {
      onClick();
    }
  };

  // Metálicas e temas de cores fiéis à imagem "MOEDAS DO JOGO"
  const coinTheme = {
    BRZ: {
      outerRim: '#854d0e',
      bevelLight: '#b45309',
      bevelDark: '#451a03',
      innerBg: '#78350f',
      starFill: '#d97706',
      starStroke: '#fef3c7',
      gem: '#9333ea',
      textColor: '#fef3c7',
      dropShadow: 'drop-shadow-[0_2px_8px_rgba(180,83,9,0.5)]',
      glow: '#d97706',
    },
    PRT: {
      outerRim: '#64748b',
      bevelLight: '#cbd5e1',
      bevelDark: '#1e293b',
      innerBg: '#334155',
      starFill: '#e2e8f0',
      starStroke: '#ffffff',
      gem: '#a855f7',
      textColor: '#f8fafc',
      dropShadow: 'drop-shadow-[0_2px_8px_rgba(203,213,225,0.4)]',
      glow: '#cbd5e1',
    },
    ORO: {
      outerRim: '#ca8a04',
      bevelLight: '#fde047',
      bevelDark: '#713f12',
      innerBg: '#854d0e',
      starFill: '#eab308',
      starStroke: '#fef08a',
      gem: '#c084fc',
      textColor: '#fef08a',
      dropShadow: 'drop-shadow-[0_2px_12px_rgba(234,179,8,0.55)]',
      glow: '#facc15',
    },
    PLN: {
      outerRim: '#6366f1',
      bevelLight: '#e0e7ff',
      bevelDark: '#312e81',
      innerBg: '#3730a3',
      starFill: '#c7d2fe',
      starStroke: '#ffffff',
      gem: '#818cf8',
      textColor: '#e0e7ff',
      dropShadow: 'drop-shadow-[0_2px_10px_rgba(199,210,254,0.45)]',
      glow: '#c7d2fe',
    },
    CYB: {
      outerRim: '#0891b2',
      bevelLight: '#67e8f9',
      bevelDark: '#083344',
      innerBg: '#0e2536',
      starFill: '#06b6d4',
      starStroke: '#cffafe',
      gem: '#22d3ee',
      textColor: '#a5f3fc',
      dropShadow: 'drop-shadow-[0_2px_14px_rgba(6,182,212,0.7)]',
      glow: '#06b6d4',
    },
  }[type];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${onClick || interactiveFlip ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      onClick={handleClick}
      title={`${config.name} (${config.code}) - ${config.material}. Vale ${config.unitValueInBRZ} BRZ.${interactiveFlip ? ' (Clique para virar)' : ''}`}
    >
      <div className={`relative ${sizeClasses} shrink-0 ${coinTheme.dropShadow}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradiente exterior da moeda */}
            <radialGradient id={`rim-grad-${type}`} cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor={coinTheme.bevelLight} />
              <stop offset="60%" stopColor={coinTheme.outerRim} />
              <stop offset="100%" stopColor={coinTheme.bevelDark} />
            </radialGradient>

            {/* Gradiente do fundo interior côncavo */}
            <radialGradient id={`inner-grad-${type}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={coinTheme.bevelDark} />
              <stop offset="70%" stopColor={coinTheme.innerBg} />
              <stop offset="100%" stopColor={coinTheme.outerRim} />
            </radialGradient>

            {/* Gradiente de relevo da estrela/emblema */}
            <linearGradient id={`star-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={coinTheme.bevelLight} />
              <stop offset="45%" stopColor={coinTheme.starFill} />
              <stop offset="100%" stopColor={coinTheme.bevelDark} />
            </linearGradient>

            {/* Brilho tecnomágico para a Cybermoeda */}
            {type === 'CYB' && (
              <filter id="cyb-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            )}
          </defs>

          {/* Aro exterior chanfrado */}
          <circle
            cx="50"
            cy="50"
            r="47"
            fill={`url(#rim-grad-${type})`}
            stroke={coinTheme.bevelLight}
            strokeWidth="1.5"
          />

          {/* Serrilhado/entalhes na borda (característica da arte de Nexaria) */}
          <g stroke={coinTheme.bevelDark} strokeWidth="1.2" opacity="0.65">
            {[...Array(24)].map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + Math.cos(rad) * 44;
              const y1 = 50 + Math.sin(rad) * 44;
              const x2 = 50 + Math.cos(rad) * 47;
              const y2 = 50 + Math.sin(rad) * 47;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>

          {/* Anel intermediário decorativo */}
          <circle
            cx="50"
            cy="50"
            r="41"
            fill="none"
            stroke={coinTheme.bevelDark}
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="38.5"
            fill={`url(#inner-grad-${type})`}
            stroke={coinTheme.bevelLight}
            strokeWidth="0.8"
            strokeDasharray={type === 'CYB' ? '3,2' : 'none'}
          />

          {/* FACE FRONTAL: A Estrela de 8 pontas com Orbe do Abismo (como na imagem) */}
          {currentFace === 'front' ? (
            <g>
              {/* Circuitos cibernéticos se for Cybermoeda */}
              {type === 'CYB' && (
                <g stroke="#22d3ee" strokeWidth="0.8" opacity="0.75" fill="none">
                  <path d="M 26 50 H 35 L 42 43" />
                  <path d="M 74 50 H 65 L 58 57" />
                  <path d="M 50 26 V 35 L 57 42" />
                  <path d="M 50 74 V 65 L 43 58" />
                  <circle cx="26" cy="50" r="1.5" fill="#22d3ee" />
                  <circle cx="74" cy="50" r="1.5" fill="#22d3ee" />
                  <circle cx="50" cy="26" r="1.5" fill="#22d3ee" />
                  <circle cx="50" cy="74" r="1.5" fill="#22d3ee" />
                </g>
              )}

              {/* Anel de runas/pontos concêntricos em volta */}
              <circle
                cx="50"
                cy="50"
                r="31"
                fill="none"
                stroke={coinTheme.bevelLight}
                strokeWidth="0.6"
                strokeDasharray="1.5, 2.5"
                opacity="0.7"
              />

              {/* A Estrela de 8 pontas oficial de Nexaria (Bússola Arcana) */}
              <g filter={type === 'CYB' ? 'url(#cyb-glow)' : undefined}>
                {/* 4 Pontas Cardeais Maiores */}
                <polygon
                  points="50,16 54,46 50,50 46,46"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelLight}
                  strokeWidth="0.4"
                />
                <polygon
                  points="50,84 54,54 50,50 46,54"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelDark}
                  strokeWidth="0.4"
                />
                <polygon
                  points="16,50 46,46 50,50 46,54"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelLight}
                  strokeWidth="0.4"
                />
                <polygon
                  points="84,50 54,46 50,50 54,54"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelDark}
                  strokeWidth="0.4"
                />

                {/* 4 Pontas Diagonais Menores */}
                <polygon
                  points="25,25 47,45 50,50 45,47"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelLight}
                  strokeWidth="0.3"
                />
                <polygon
                  points="75,25 53,45 50,50 55,47"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelLight}
                  strokeWidth="0.3"
                />
                <polygon
                  points="25,75 47,55 50,50 45,53"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelDark}
                  strokeWidth="0.3"
                />
                <polygon
                  points="75,75 53,55 50,50 55,53"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelDark}
                  strokeWidth="0.3"
                />
              </g>

              {/* Orbe Central do Abismo (Gema Arcana Púrpura/Azul) */}
              <circle
                cx="50"
                cy="50"
                r="5.5"
                fill={coinTheme.gem}
                stroke={coinTheme.bevelLight}
                strokeWidth="0.8"
              />
              <circle
                cx="48.5"
                cy="48.5"
                r="1.8"
                fill="#ffffff"
                opacity="0.85"
              />
            </g>
          ) : (
            /* FACE DO VERSO: O Emblema Monograma "N" de Nexaria (como na Linha 3 da imagem) */
            <g>
              {/* Anel de arabesco floral rúnico */}
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke={coinTheme.bevelLight}
                strokeWidth="0.7"
                strokeDasharray="2, 2"
                opacity="0.75"
              />

              {/* Monograma "N" estilizado em alto relevo */}
              <g filter={type === 'CYB' ? 'url(#cyb-glow)' : undefined}>
                <text
                  x="50"
                  y="62"
                  textAnchor="middle"
                  fontFamily="'Cinzel', serif"
                  fontWeight="900"
                  fontSize="38"
                  fill={`url(#star-grad-${type})`}
                  stroke={coinTheme.bevelLight}
                  strokeWidth="0.8"
                  style={{ letterSpacing: '0.05em' }}
                >
                  N
                </text>
              </g>

              {/* Coroa/Ponto sobre o N */}
              <polygon
                points="50,22 52,26 50,28 48,26"
                fill={coinTheme.gem}
                stroke={coinTheme.bevelLight}
                strokeWidth="0.4"
              />
            </g>
          )}

          {/* Brilho especular sutil na borda superior esquerda */}
          <path
            d="M 22 25 A 42 42 0 0 1 78 25"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.35"
          />
        </svg>
      </div>

      {showLabel && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-cinzel font-bold tracking-wide uppercase text-zinc-100 flex items-center gap-1">
            {config.name}
            {interactiveFlip && (
              <span className="text-[9px] text-zinc-500 font-sans font-normal lowercase">
                ({currentFace === 'front' ? 'estrela' : 'reverso N'})
              </span>
            )}
          </span>
          <span className="text-[10px] text-amber-400/90 font-mono">
            {config.code} &bull; {config.unitValueInBRZ} BRZ
          </span>
        </div>
      )}

      {showDetails && (
        <span className="text-xs text-zinc-400 max-w-[220px] leading-tight font-sans">
          {config.description}
        </span>
      )}
    </div>
  );
};
