// app/recebimento/[id].tsx
import { api } from "@/lib/api";
import { Recebimento, RecebimentoItem } from "@/types/recebimento";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function fmtData(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fmtQtd(n: number | null | undefined) {
  if (n == null) return "0";
  // AJUSTE: inteiros sempre sem decimais
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function badgeColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "ABERTO": return { bg: "#1e293b", text: "#94a3b8" };
    case "PARCIAL": return { bg: "#78350f", text: "#fcd34d" };
    case "CONCLUIDO": return { bg: "#14532d", text: "#86efac" };
    case "ENCERRADO_PARCIAL": return { bg: "#1e3a5f", text: "#93c5fd" };
    case "CANCELADO": return { bg: "#450a0a", text: "#fca5a5" };
    default: return { bg: "#1e293b", text: "#94a3b8" };
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    ABERTO: "Aberto",
    PARCIAL: "Parcial",
    CONCLUIDO: "Concluído",
    ENCERRADO_PARCIAL: "Encerrado Parcial",
    CANCELADO: "Cancelado",
    PENDENTE: "Pendente",
    RECEBIDO_TOTAL: "Recebido",
    RECEBIDO_PARCIAL: "Parcial",
    NAO_ENTREGUE: "Não entregue",
  };
  return map[status] ?? status;
}

// AJUSTE 3: mensagem de sessão clara para o operador
function handleApiError(error: any, contexto: string): string {
  const status = error?.response?.status;
  const msg = error?.response?.data?.error || error?.message || "Erro desconhecido";

  if (status === 401) return "Sessão expirada. Faça login novamente.";
  if (status === 403) return `Sem permissão para ${contexto}.`;
  if (status === 404) return `Não encontrado ao ${contexto}.`;
  if (status === 422) return msg;
  return msg;
}

interface ItemRowProps {
  item: RecebimentoItem;
  value: string;
  obs: string;
  onChangeValue: (v: string) => void;
  onChangeObs: (v: string) => void;
  readonly: boolean;
  isFirst: boolean; // AJUSTE 6: auto-focus no primeiro item
}

function ItemRow({ item, value, obs, onChangeValue, onChangeObs, readonly, isFirst }: ItemRowProps) {
  const totalJaRegistrado = Number(item.qtd_ja_recebida) + Number(item.qtd_recebida_agora);
  const qtdPedidaInt = Math.floor(Number(item.qtd_pedida));
  const saldo = Math.max(0, qtdPedidaInt - Math.floor(totalJaRegistrado));
  const jaCompleto = saldo <= 0;
  // AJUSTE 2: parseInt garante comparação correta com inteiros
  const qtdAgora = parseInt(value, 10) || 0;
  const isCompleto = !jaCompleto && (Math.floor(totalJaRegistrado) + qtdAgora >= qtdPedidaInt);

  return (
    <View style={iStyles.row}>
      <View style={iStyles.itemHeader}>
        <Text style={iStyles.descricao} numberOfLines={2}>{item.descricao}</Text>
        {item.codprod ? <Text style={iStyles.codprod}>Cód: {item.codprod}</Text> : null}
      </View>

      <View style={iStyles.qtdGrid}>
        <View style={iStyles.qtdCell}>
          <Text style={iStyles.qtdLabel}>Pedido</Text>
          <Text style={iStyles.qtdValue}>{fmtQtd(item.qtd_pedida)} {item.unidade ?? ""}</Text>
        </View>
        <View style={iStyles.qtdCell}>
          <Text style={iStyles.qtdLabel}>Já recebido</Text>
          <Text style={[iStyles.qtdValue, totalJaRegistrado > 0 && iStyles.qtdRecebido]}>
            {fmtQtd(Math.floor(totalJaRegistrado))} {item.unidade ?? ""}
          </Text>
        </View>
        <View style={iStyles.qtdCell}>
          <Text style={iStyles.qtdLabel}>Saldo</Text>
          <Text style={[iStyles.qtdValue, saldo <= 0 && iStyles.qtdZero]}>
            {fmtQtd(saldo)} {item.unidade ?? ""}
          </Text>
        </View>
      </View>

      {!readonly && !jaCompleto && (
        <>
          <Text style={iStyles.fieldLabel}>Qtd recebida agora ({item.unidade ?? "un"})</Text>
          {/* AJUSTE 1: barra sem barra invertida no nome do estilo */}
          <View style={iStyles.inputRow}>
            <TouchableOpacity
              style={iStyles.stepper}
              onPress={() => {
                // AJUSTE 2: stepper opera em inteiros
                const v = Math.max(0, (parseInt(value, 10) || 0) - 1);
                onChangeValue(String(v));
              }}
            >
              <Text style={iStyles.stepperText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={[iStyles.qtdInput, isCompleto && iStyles.qtdInputOk]}
              value={value}
              onChangeText={(t) => {
                // AJUSTE 2: aceita somente dígitos, sem decimais
                const onlyNumbers = t.replace(/[^0-9]/g, "");
                onChangeValue(onlyNumbers);
              }}
              keyboardType="number-pad" // AJUSTE 2: teclado numérico sem vírgula
              placeholder="0"
              placeholderTextColor="#475569"
              selectTextOnFocus
              autoFocus={isFirst} // AJUSTE 6: foco automático no primeiro item
            />
            <TouchableOpacity
              style={iStyles.stepper}
              onPress={() => {
                // AJUSTE 2: stepper opera em inteiros
                const v = (parseInt(value, 10) || 0) + 1;
                onChangeValue(String(Math.min(v, saldo)));
              }}
            >
              <Text style={iStyles.stepperText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={iStyles.btnTudo}
              onPress={() => onChangeValue(String(saldo))}
            >
              <Text style={iStyles.btnTudoText}>Tudo</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={iStyles.obsInput}
            placeholder="Observação (opcional)"
            placeholderTextColor="#334155"
            value={obs}
            onChangeText={onChangeObs}
            multiline
            numberOfLines={2}
          />
        </>
      )}

      {/* Item já completo — mostra badge verde bloqueado */}
      {!readonly && jaCompleto && (
        <View style={iStyles.statusRow}>
          <View style={[iStyles.badge, { backgroundColor: "#14532d" }]}>
            <Text style={[iStyles.badgeText, { color: "#86efac" }]}>
              ✓ Recebido total
            </Text>
          </View>
        </View>
      )}

      {readonly && (
        <View style={iStyles.statusRow}>
          <View style={[iStyles.badge, { backgroundColor: badgeColor(item.status).bg }]}>
            <Text style={[iStyles.badgeText, { color: badgeColor(item.status).text }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const iStyles = StyleSheet.create({
  row: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  itemHeader: { marginBottom: 12 },
  descricao: { color: "#f1f5f9", fontSize: 15, fontWeight: "600", lineHeight: 20, marginBottom: 4 },
  codprod: { color: "#475569", fontSize: 12 },
  qtdGrid: {
    flexDirection: "row", gap: 8, marginBottom: 12,
    backgroundColor: "#0f172a", borderRadius: 10, padding: 10,
  },
  qtdCell: { flex: 1, alignItems: "center" },
  qtdLabel: { color: "#475569", fontSize: 11, marginBottom: 3 },
  qtdValue: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  qtdZero: { color: "#22c55e" },
  qtdRecebido: { color: "#60a5fa" },
  fieldLabel: {
    color: "#475569", fontSize: 12, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  stepper: {
    width: 40, height: 44, borderRadius: 10,
    backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center",
  },
  stepperText: { color: "#f1f5f9", fontSize: 20, fontWeight: "600" },
  qtdInput: {
    flex: 1, backgroundColor: "#0f172a", color: "#f1f5f9",
    borderWidth: 1, borderColor: "#1e293b", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 20, fontWeight: "700", textAlign: "center",
  },
  qtdInputOk: { borderColor: "#22c55e", color: "#22c55e" },
  btnTudo: {
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: "#1e3a5f", borderRadius: 10,
  },
  btnTudoText: { color: "#93c5fd", fontSize: 13, fontWeight: "700" },
  obsInput: {
    backgroundColor: "#0f172a", color: "#94a3b8",
    borderWidth: 1, borderColor: "#1e293b", borderRadius: 10,
    padding: 10, fontSize: 13, minHeight: 48,
  },
  statusRow: { alignItems: "flex-start" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "700" },
});

// ─── Tela principal ───────────────────────────────────────────
export default function RecebimentoDetalhePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rec, setRec] = useState<Recebimento | null>(null);
  const [qtds, setQtds] = useState<Record<string, string>>({});
  const [obsItens, setObsItens] = useState<Record<string, string>>({});
  const [notaFiscal, setNotaFiscal] = useState("");
  const [notaFiscalSerie, setNotaFiscalSerie] = useState("");
  // Data da NF é registrada automaticamente no momento do salvamento
  const scrollRef = useRef<ScrollView>(null);
  const nfNumRef = useRef<TextInput>(null);
  const nfSerieRef = useRef<TextInput>(null);
  const [iniciando, setIniciando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [erroPendencia, setErroPendencia] = useState<{ id: string; numero: string } | null>(null);

  function initQtds(r: Recebimento) {
    const map: Record<string, string> = {};
    const obsMap: Record<string, string> = {};
    r.itens?.forEach((item) => {
      // Sempre inicia vazio — o operador informa só o que está chegando agora.
      map[item.id] = "";
      obsMap[item.id] = item.observacao_item ?? "";
    });
    setQtds(map);
    setObsItens(obsMap);
    setNotaFiscal(r.nota_fiscal ?? "");
    setNotaFiscalSerie(r.nota_fiscal_serie ?? "");
  }

  const iniciarOuCarregar = useCallback(async () => {
    if (!id) return;
    setErroCarregamento(null);

    try {
      setIniciando(true);

      // Tenta carregar como recebimento existente primeiro
      try {
        const resGet = await api.get(`/api/recebimentos/${id}`);
        if (resGet.data?.ok) {
          setRec(resGet.data.recebimento);
          initQtds(resGet.data.recebimento);
          return;
        }
      } catch (e: any) {
        // 404 → não é um recebimento_id, tenta criar como pedido_id
        if (e?.response?.status !== 404) {
          throw e;
        }
      }

      // Não é recebimento existente → cria novo a partir do pedido_id
      const resPost = await api.post("/api/recebimentos", { pedido_id: id });
      const data = resPost.data;

      if (!data?.ok) {
        setErroCarregamento(data?.error || "Não foi possível iniciar o recebimento.");
        return;
      }

      const recId = data.recebimento?.id;
      if (!recId) {
        setErroCarregamento("Recebimento criado mas sem ID. Contate o suporte.");
        return;
      }

      const resDetalhes = await api.get(`/api/recebimentos/${recId}`);
      if (resDetalhes.data?.ok) {
        setRec(resDetalhes.data.recebimento);
        initQtds(resDetalhes.data.recebimento);
      }

      if (data.aviso) {
        Alert.alert("Atenção", data.aviso);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errData = error?.response?.data;
      if (status === 422 && errData?.recebimento_pendente_id) {
        setErroPendencia({ id: errData.recebimento_pendente_id, numero: errData.recebimento_pendente_numero || "pendente" });
      } else {
        const msg = handleApiError(error, "carregar recebimento");
        setErroCarregamento(msg);
      }
    } finally {
      setIniciando(false);
    }
  }, [id]);

  const loadRecebimento = useCallback(async (recId: string) => {
    try {
      const res = await api.get(`/api/recebimentos/${recId}`);
      if (res.data?.ok) {
        setRec(res.data.recebimento);
        initQtds(res.data.recebimento);
      }
    } catch (error: any) {
      Alert.alert("Erro", handleApiError(error, "recarregar recebimento"));
    }
  }, []);

  useEffect(() => {
    async function boot() {
      setLoading(true);
      await iniciarOuCarregar();
      setLoading(false);
    }
    boot();
  }, [iniciarOuCarregar]);

  const onRefresh = useCallback(async () => {
    if (!rec?.id) return;
    setRefreshing(true);
    await loadRecebimento(rec.id);
    setRefreshing(false);
  }, [rec, loadRecebimento]);

  const salvarLancamento = useCallback(async () => {
    if (!rec) return;

    // Verifica se todos os itens já estão 100% recebidos (via entregas anteriores)
    const todosJaCompletos = rec.itens.every((item) => {
      const totalJaRegistrado = Number(item.qtd_ja_recebida) + Number(item.qtd_recebida_agora);
      return Math.floor(totalJaRegistrado) >= Math.floor(Number(item.qtd_pedida));
    });

    // Se tudo já está recebido mas o status ainda não é CONCLUIDO,
    // envia confirmar_total=true para forçar o recalculo do status na API
    if (todosJaCompletos) {
      try {
        setSaving(true);
        const payloadConfirmar: Record<string, unknown> = { confirmar_total: true };
        if (notaFiscal.trim()) payloadConfirmar.nota_fiscal = notaFiscal.trim();
        if (notaFiscalSerie.trim()) payloadConfirmar.nota_fiscal_serie = notaFiscalSerie.trim();
        // nota_fiscal_data gerada pelo servidor — não enviada pelo app
        const res = await api.patch(`/api/recebimentos/${rec.id}`, payloadConfirmar);
        const data = res.data;
        if (!data?.ok) {
          Alert.alert("Erro", data?.error || "Falha ao confirmar recebimento.");
          return;
        }
        router.replace({ pathname: "/recebimento/sucesso", params: { numero: rec.numero } });
      } catch (error: any) {
        Alert.alert("Erro", handleApiError(error, "confirmar recebimento"));
      } finally {
        setSaving(false);
      }
      return;
    }

    const itensPayload = rec.itens
      .filter((item) => {
        const totalJaRegistrado = Number(item.qtd_ja_recebida) + Number(item.qtd_recebida_agora);
        return Math.floor(Number(item.qtd_pedida)) > Math.floor(totalJaRegistrado);
      })
      .map((item) => {
        // AJUSTE 2: parseInt garante inteiro no envio para API
        const qtdNumber = parseInt(qtds[item.id] || "0", 10);
        return {
          id: item.id,
          qtd_recebida_agora: qtdNumber,
          observacao_item: obsItens[item.id] || null,
        };
      });

    // AJUSTE 4: bloqueia envio com quantidade zero por item
    for (const item of rec.itens) {
      const p = itensPayload.find((i) => i.id === item.id);
      if (!p) continue;
      // Valida individualmente cada item que foi preenchido
      if (qtds[item.id] !== "" && p.qtd_recebida_agora <= 0) {
        Alert.alert("Atenção", `"${item.descricao}": informe uma quantidade válida (maior que zero).`);
        return;
      }
    }

    const totalInformado = itensPayload.reduce((s, i) => s + i.qtd_recebida_agora, 0);

    if (totalInformado === 0) {
      Alert.alert(
        "Nenhuma quantidade",
        "Informe pelo menos uma quantidade recebida, ou use 'Encerrar' para registrar não entrega."
      );
      return;
    }

    for (const item of rec.itens) {
      const p = itensPayload.find((i) => i.id === item.id);
      if (!p) continue;
      const totalJaRegistrado = Number(item.qtd_ja_recebida) + Number(item.qtd_recebida_agora);
      const saldo = Math.max(0, Math.floor(Number(item.qtd_pedida)) - Math.floor(totalJaRegistrado));
      if (p.qtd_recebida_agora > saldo) {
        Alert.alert(
          "Quantidade inválida",
          `"${item.descricao}": quantidade (${p.qtd_recebida_agora}) excede o saldo disponível (${saldo}).`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = { itens: itensPayload };
      if (notaFiscal.trim()) payload.nota_fiscal = notaFiscal.trim();
      if (notaFiscalSerie.trim()) payload.nota_fiscal_serie = notaFiscalSerie.trim();
      // nota_fiscal_data gerada pelo servidor — não enviada pelo app

      const res = await api.patch(`/api/recebimentos/${rec.id}`, payload);
      const data = res.data;

      if (!data?.ok) {
        Alert.alert("Erro", data?.error || "Falha ao salvar.");
        return;
      }

      // AJUSTE 5: limpa campos e recarrega estado do servidor
      setRec(data.recebimento);
      initQtds(data.recebimento);

      if (data.todosConcluidos) {
        router.replace({ pathname: "/recebimento/sucesso", params: { numero: rec.numero } });
      } else {
        Alert.alert(
          "Salvo!",
          `Status: ${statusLabel(data.novoStatus)}.`,
          [
            { text: "Continuar" },
            {
              text: "Encerrar",
              style: "destructive",
              onPress: () =>
                router.push({
                  pathname: "/recebimento/encerrar",
                  params: { id: rec.id, numero: rec.numero },
                }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", handleApiError(error, "salvar recebimento"));
    } finally {
      setSaving(false);
    }
  }, [rec, qtds, obsItens, notaFiscal, notaFiscalSerie]);

  if (loading || iniciando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <Text style={styles.loadingText}>
          {iniciando ? "Iniciando recebimento..." : "Carregando..."}
        </Text>
      </View>
    );
  }

  if (erroPendencia) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: "#fcd34d", fontSize: 16, fontWeight: "700" }]}>
          Pendências aguardando definição
        </Text>
        <Text style={[styles.errorText, { color: "#94a3b8", marginTop: 8, textAlign: "center" }]}>
          O recebimento {erroPendencia.numero} possui itens faltantes sem ação definida.
          Defina a ação antes de iniciar um novo recebimento.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.replace(`/recebimento/${erroPendencia.id}`)}
        >
          <Text style={styles.retryBtnText}>Ver recebimento pendente →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
          <Text style={styles.backBtnCenterText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (erroCarregamento) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{erroCarregamento}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={async () => {
            setLoading(true);
            setErroCarregamento(null);
            await iniciarOuCarregar();
            setLoading(false);
          }}
        >
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
          <Text style={styles.backBtnCenterText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!rec) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Recebimento não encontrado.</Text>
        <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
          <Text style={styles.backBtnCenterText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReadonly = !["ABERTO", "PARCIAL"].includes(rec.status);
  const badgeRec = badgeColor(rec.status);
  const fornecedor = rec.pedido?.fornecedor;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ Voltar</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: badgeRec.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeRec.text }]}>
                {statusLabel(rec.status)}
              </Text>
            </View>
          </View>

          {/* Card do pedido */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardLabel}>Recebimento</Text>
                <Text style={styles.cardNumber}>{rec.numero}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.cardLabel}>Pedido</Text>
                <Text style={styles.cardNumber}>#{rec.pedido?.numero}</Text>
              </View>
            </View>

            {fornecedor && (
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaLabel}>Fornecedor</Text>
                <Text style={styles.cardMetaValue}>
                  {fornecedor.nomeab || fornecedor.razsoc}
                </Text>
              </View>
            )}

            <View style={styles.cardRow2}>
              {rec.numero_entrega > 1 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{rec.numero_entrega}ª entrega</Text>
                </View>
              )}
              {rec.prazo_previsto && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Prazo: {fmtData(rec.prazo_previsto)}</Text>
                </View>
              )}
              {rec.recebido_por_nome && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Por: {rec.recebido_por_nome.split(" ")[0]}</Text>
                </View>
              )}
            </View>
          </View>

          {isReadonly && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                Recebimento {statusLabel(rec.status)} — não pode mais ser editado.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Itens do Pedido</Text>

          {rec.itens.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              value={qtds[item.id] ?? ""}
              obs={obsItens[item.id] ?? ""}
              onChangeValue={(v) => setQtds((prev) => ({ ...prev, [item.id]: v }))}
              onChangeObs={(v) => setObsItens((prev) => ({ ...prev, [item.id]: v }))}
              readonly={isReadonly}
              isFirst={index === 0} // AJUSTE 6: passa flag de primeiro item
            />
          ))}

          {!isReadonly && (
            <View style={styles.nfBox}>
              <Text style={styles.sectionTitle}>Nota Fiscal (opcional)</Text>
              <Text style={styles.nfDataAuto}>
                📅 Data/hora registrada automaticamente ao salvar
              </Text>
              <TextInput
                ref={nfNumRef}
                style={styles.nfInput}
                placeholder="Número da NF"
                placeholderTextColor="#475569"
                value={notaFiscal}
                onChangeText={setNotaFiscal}
                keyboardType="number-pad"
                returnKeyType="next"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
                onSubmitEditing={() => nfSerieRef.current?.focus()}
              />
              <TextInput
                ref={nfSerieRef}
                style={styles.nfInput}
                placeholder="Série (opcional)"
                placeholderTextColor="#475569"
                value={notaFiscalSerie}
                onChangeText={setNotaFiscalSerie}
                returnKeyType="done"
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
            </View>
          )}

          {rec.pendencias && rec.pendencias.length > 0 && (
            <View style={styles.pendBox}>
              <Text style={styles.sectionTitle}>Pendências</Text>
              {rec.pendencias.map((p) => (
                <View key={p.id} style={styles.pendRow}>
                  <Text style={styles.pendDesc}>{p.descricao}</Text>
                  <Text style={styles.pendQtd}>{fmtQtd(p.qtd_pendente)} {p.unidade ?? ""}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 180 }} />
        </ScrollView>

        {!isReadonly && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.btnEncerrar}
              onPress={() =>
                router.push({
                  pathname: "/recebimento/encerrar",
                  params: { id: rec.id, numero: rec.numero },
                })
              }
            >
              <Text style={styles.btnEncerrarText}>Encerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSalvar, saving && styles.btnDisabled]}
              onPress={salvarLancamento}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSalvarText}>✓ Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1e" },
  flex: { flex: 1 },
  center: {
    flex: 1, backgroundColor: "#0a0f1e",
    alignItems: "center", justifyContent: "center", padding: 24, gap: 16,
  },
  loadingText: { color: "#64748b", fontSize: 15, marginTop: 12 },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  errorText: { color: "#f87171", fontSize: 15, textAlign: "center", lineHeight: 22 },
  retryBtn: {
    backgroundColor: "#1d4ed8", paddingVertical: 13, paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backBtnCenter: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: "#111827", borderRadius: 12,
  },
  backBtnCenterText: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: "#3b82f6", fontSize: 16, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: "#111827", borderRadius: 18, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: "#1e293b",
  },
  cardRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end", marginBottom: 12,
  },
  cardLabel: { color: "#475569", fontSize: 12, marginBottom: 2 },
  cardNumber: { color: "#f1f5f9", fontSize: 20, fontWeight: "800" },
  cardMeta: { marginBottom: 10 },
  cardMetaLabel: { color: "#475569", fontSize: 12, marginBottom: 2 },
  cardMetaValue: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  cardRow2: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    backgroundColor: "#0f172a", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pillText: { color: "#475569", fontSize: 12 },
  alertBox: {
    backgroundColor: "#1e3a5f", borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  alertText: { color: "#93c5fd", fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    color: "#64748b", fontSize: 12, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 12, marginTop: 4,
  },
  nfBox: { marginTop: 8, gap: 10 },
  nfDataAuto: {
    color: "#475569", fontSize: 12, fontStyle: "italic",
    marginBottom: 2,
  },
  nfInput: {
    backgroundColor: "#111827", color: "#f1f5f9",
    borderWidth: 1, borderColor: "#1e293b", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15,
  },
  nfRow: { flexDirection: "row", gap: 8 },
  pendBox: { marginTop: 16 },
  pendRow: {
    backgroundColor: "#111827", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#1e293b",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  pendDesc: { color: "#94a3b8", fontSize: 14, flex: 1 },
  pendQtd: { color: "#f1f5f9", fontSize: 14, fontWeight: "700" },
  bottomBar: {
    flexDirection: "row", gap: 10, padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingTop: 12,
    backgroundColor: "#0a0f1e",
    borderTopWidth: 1, borderTopColor: "#1e293b",
  },
  btnEncerrar: {
    flex: 1, paddingVertical: 18, borderRadius: 14,
    alignItems: "center", backgroundColor: "#111827",
    borderWidth: 1, borderColor: "#1e293b",
  },
  btnEncerrarText: { color: "#f87171", fontWeight: "700", fontSize: 15 },
  btnSalvar: {
    flex: 2, paddingVertical: 18, borderRadius: 14,
    alignItems: "center", backgroundColor: "#16a34a",
  },
  btnDisabled: { opacity: 0.65 },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
