// types/recebimento.ts

export type ItemStatus =
  | "PENDENTE"
  | "RECEBIDO_TOTAL"
  | "RECEBIDO_PARCIAL"
  | "NAO_ENTREGUE";

export type RecebimentoStatus =
  | "ABERTO"
  | "PARCIAL"
  | "CONCLUIDO"
  | "ENCERRADO_PARCIAL"
  | "CANCELADO";

export interface RecebimentoItem {
  id: string;
  pedido_item_id: string;
  descricao: string;
  unidade: string | null;
  codprod: string | null;
  qtd_pedida: number;
  qtd_ja_recebida: number;
  qtd_recebida_agora: number;
  qtd_total_recebida?: number;
  qtd_faltante?: number;
  status: ItemStatus;
  observacao_item?: string | null;
}

export interface Pendencia {
  id: string;
  descricao: string;
  qtd_pendente: number;
  unidade: string | null;
  acao: string;
}

export interface Recebimento {
  id: string;
  numero: string;
  numero_entrega: number;
  status: RecebimentoStatus;
  iniciado_em: string;
  concluido_em?: string | null;
  encerrado_em?: string | null;
  recebido_por_nome?: string | null;
  observacao?: string | null;
  prazo_previsto?: string | null;
  prazo_previsto_texto?: string | null;
  entregue_no_prazo?: boolean | null;
  nota_fiscal?: string | null;
  nota_fiscal_serie?: string | null;
  nota_fiscal_data?: string | null;
  pedido: {
    id: string;
    numero: string;
    status: string;
    prazo_entrega?: string | null;
    condicao_pagamento?: string | null;
    observacao?: string | null;
    fornecedor?: {
      id: string;
      razsoc: string;
      nomeab?: string | null;
    };
    cotacao?: {
      id: string;
      numero: string;
      titulo: string;
    } | null;
  };
  itens: RecebimentoItem[];
  pendencias?: Pendencia[];
}
