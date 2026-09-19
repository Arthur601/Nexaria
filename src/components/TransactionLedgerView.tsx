import React, { useState } from 'react';
import { Transaction, CurrencyType } from '../types/rpg';
import { CoinVisual } from './CoinVisual';
import {
  FileText,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  Clock,
  Download,
} from 'lucide-react';

interface TransactionLedgerViewProps {
  transactions: Transaction[];
  activeCharacterId?: string;
}

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  transactions,
  activeCharacterId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('ALL');

  const filtered = transactions.filter((tx) => {
    const matchesCurrency =
      selectedCurrencyFilter === 'ALL' || tx.currency === selectedCurrencyFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      tx.senderName.toLowerCase().includes(term) ||
      tx.receiverName.toLowerCase().includes(term) ||
      tx.reason.toLowerCase().includes(term);
    return matchesCurrency && matchesSearch;
  });

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString('pt-BR');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `transacoes_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
              Histórico de Transações
            </h3>
            <p className="text-xs text-zinc-400">
              Registro auditável de transferências entre jogadores e o Mestre da sala.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJSON}
          className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar JSON
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar jogador ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Currency filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCurrencyFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              selectedCurrencyFilter === 'ALL'
                ? 'bg-zinc-100 text-zinc-950 font-semibold'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            Todas ({transactions.length})
          </button>
          {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCurrencyFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition ${
                selectedCurrencyFilter === c
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              <CoinVisual type={c} size="sm" />
              <span>{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-500 text-xs">
            Nenhuma transação registrada nesta sala até o momento.
          </div>
        ) : (
          filtered.map((tx) => {
            const isToGM = tx.receiverId === 'gm';
            const isFromGM = tx.senderId === 'gm';
            const isMine =
              activeCharacterId &&
              (tx.senderId === activeCharacterId || tx.receiverId === activeCharacterId);

            return (
              <div
                key={tx.id}
                className={`rounded-lg border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 transition hover:border-zinc-700 ${
                  isMine ? 'border-zinc-700' : 'border-zinc-800'
                }`}
              >
                {/* Left: Indicator & Flow */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isToGM
                        ? 'bg-zinc-800 border-zinc-700 text-amber-400'
                        : isFromGM
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isToGM ? (
                      <Crown className="w-3.5 h-3.5" />
                    ) : isFromGM ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-200 text-xs">
                        {tx.senderName}
                      </span>
                      <span className="text-zinc-600 text-[11px]">➔</span>
                      <span className="font-semibold text-zinc-200 text-xs flex items-center gap-1">
                        {isToGM && <Crown className="w-3 h-3 text-amber-400 inline" />}
                        {tx.receiverName}
                      </span>
                      {isToGM && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                          Ao Mestre
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-0.5">
                      "{tx.reason}"
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Currency & Amount Badge */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800">
                    <CoinVisual type={tx.currency} size="sm" />
                    <span className="text-sm font-bold font-mono text-zinc-100">
                      {tx.amount} {tx.currency}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
