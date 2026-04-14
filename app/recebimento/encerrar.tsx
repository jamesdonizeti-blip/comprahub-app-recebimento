// app/recebimento/encerrar.tsx
import { api } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AcaoPendencias = "segundo_melhor_preco" | "nova_cotacao" | "encerrar_sem_complemento";

export default function EncerrarRecebimentoPage() {
  const { id, numero } = useLocalSearchParams<{ id: string; numero: string }>();

  const [motivo, setMotivo] = useState("");
  const [acao, setAcao] = useState<AcaoPendencias>("encerrar_sem_complemento");
  const [loading, setLoading] = useState(false);
  const [opcoesInfo, setOpcoesInfo] = useState<{
    segundo_melhor_disponivel: boolean;
    segundo_melhor_motivo: string | null;
    nova_cotacao_fornecedores: number;
  }>({ segundo_melhor_disponivel: false, segundo_melhor_motivo: null, nova_cotacao_fornecedores: 0 });
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);

  // Carrega as opções disponíveis do backend
  useEffect(() => {
    if (!id) return;
    async function carregarOpcoes() {
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get(`/api/recebimentos/${id}/encerrar`);
        if (res.data?.ok && res.data.opcoes) {
          const op = res.data.opcoes;
          setOpcoesInfo({
            segundo_melhor_disponivel: op.segundo_melhor_preco?.disponivel ?? false,
            segundo_melhor_motivo: op.segundo_melhor_preco?.motivo_indisponivel ?? null,
            nova_cotacao_fornecedores: op.nova_cotacao?.fornecedores_preincluidos ?? 0,
          });
          // Pré-seleciona a melhor opção disponível
          if (op.segundo_melhor_preco?.disponivel) {
            setAcao("segundo_melhor_preco");
          } else if (op.nova_cotacao?.disponivel) {
            setAcao("nova_cotacao");
          }
        }
      } catch {
        // silencioso — usa as opções padrão
      } finally {
        setLoadingOpcoes(false);
      }
    }
    carregarOpcoes();
  }, [id]);

  async function confirmarEncerramento() {
    if (!id) return;

    Alert.alert(
      "Encerrar recebimento",
      `Deseja encerrar o recebimento ${numero ?? ""}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const res = await api.post(`/api/recebimentos/${id}/encerrar`, {
                motivo: motivo.trim() || null,
                acao_pendencias: acao,
              });

              const data = res.data;

              if (!data?.ok) {
                Alert.alert("Erro", data?.error || "Falha ao encerrar.");
                return;
              }

              router.replace({
                pathname: "/recebimento/sucesso",
                params: {
                  numero: numero ?? "",
                  mensagem: data.mensagem ?? "Recebimento encerrado.",
                  encerrado: "true",
                  cotacao: data.cotacaoComplementarId ?? "",
                },
              });
            } catch (error: any) {
              const status = error?.response?.status;
              if (status === 401) {
                Alert.alert("Sessão expirada", "Faça login novamente.", [
                  { text: "OK", onPress: () => router.replace("/login") },
                ]);
                return;
              }
              Alert.alert(
                "Erro",
                error?.response?.data?.error || error?.message || "Falha ao encerrar."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Voltar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Encerrar Recebimento</Text>
        {numero ? <Text style={styles.subtitle}>Recebimento {numero}</Text> : null}

        {/* Aviso */}
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            ⚠️ Ao encerrar, o recebimento não poderá mais ser editado. Use esta opção quando a
            entrega for parcial ou quando houver itens não entregues.
          </Text>
        </View>

        {/* Motivo */}
        <Text style={styles.label}>Motivo do encerramento (opcional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Ex: Entrega parcial — restante chegará na próxima semana..."
          placeholderTextColor="#334155"
          value={motivo}
          onChangeText={setMotivo}
          multiline
          numberOfLines={3}
        />

        {/* Ação para pendências */}
        <Text style={styles.label}>O que fazer com os itens faltantes?</Text>

        {loadingOpcoes ? (
          <ActivityIndicator color="#3b82f6" style={{ marginVertical: 16 }} />
        ) : (
          <>
            {/* Opção 1: Segundo melhor preço */}
            <TouchableOpacity
              style={[
                styles.option,
                acao === "segundo_melhor_preco" && styles.optionSelected,
                !opcoesInfo.segundo_melhor_disponivel && styles.optionDisabled,
              ]}
              onPress={() => opcoesInfo.segundo_melhor_disponivel && setAcao("segundo_melhor_preco")}
              activeOpacity={opcoesInfo.segundo_melhor_disponivel ? 0.8 : 1}
            >
              <View style={styles.optionDot}>
                {acao === "segundo_melhor_preco" && <View style={styles.optionDotFill} />}
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionTitle, !opcoesInfo.segundo_melhor_disponivel && styles.optionTitleDisabled]}>
                    Gerar pedido — 2º melhor preço
                  </Text>
                  {opcoesInfo.segundo_melhor_disponivel && (
                    <View style={styles.badgeRecomendado}>
                      <Text style={styles.badgeRecomendadoText}>Recomendado</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.optionDesc}>
                  Cria um pedido em rascunho para o segundo fornecedor mais barato da cotação original. Vai para aprovação do gestor.
                </Text>
                {!opcoesInfo.segundo_melhor_disponivel && opcoesInfo.segundo_melhor_motivo && (
                  <Text style={styles.optionIndisponivel}>
                    Indisponível: {opcoesInfo.segundo_melhor_motivo}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Opção 2: Nova cotação */}
            <TouchableOpacity
              style={[styles.option, acao === "nova_cotacao" && styles.optionSelected]}
              onPress={() => setAcao("nova_cotacao")}
              activeOpacity={0.8}
            >
              <View style={styles.optionDot}>
                {acao === "nova_cotacao" && <View style={styles.optionDotFill} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Criar cotação complementar</Text>
                <Text style={styles.optionDesc}>
                  Abre automaticamente uma nova cotação com os itens faltantes.
                  {opcoesInfo.nova_cotacao_fornecedores > 0
                    ? ` ${opcoesInfo.nova_cotacao_fornecedores} fornecedor(es) da cotação original serão pré-incluídos.`
                    : " Você poderá adicionar os fornecedores no portal."}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Opção 3: Encerrar sem complemento */}
            <TouchableOpacity
              style={[styles.option, acao === "encerrar_sem_complemento" && styles.optionSelected]}
              onPress={() => setAcao("encerrar_sem_complemento")}
              activeOpacity={0.8}
            >
              <View style={styles.optionDot}>
                {acao === "encerrar_sem_complemento" && <View style={styles.optionDotFill} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Encerrar sem complemento</Text>
                <Text style={styles.optionDesc}>
                  Registra os itens faltantes como perda definitiva. Nenhuma ação adicional será gerada.
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Botão */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={confirmarEncerramento}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Encerrar Recebimento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1e" },
  container: { padding: 24 },
  header: { marginBottom: 16 },
  backBtn: { alignSelf: "flex-start", padding: 4 },
  backBtnText: { color: "#3b82f6", fontSize: 16, fontWeight: "600" },
  title: { color: "#f1f5f9", fontSize: 26, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#64748b", fontSize: 15, marginBottom: 24 },
  warnBox: {
    backgroundColor: "#451a03",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#92400e",
  },
  warnText: { color: "#fbbf24", fontSize: 13, lineHeight: 20 },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: "#111827",
    color: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
  },
  option: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#1e293b",
    alignItems: "flex-start",
    gap: 14,
  },
  optionSelected: { borderColor: "#1d4ed8" },
  optionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  optionDotFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
  },
  optionContent: { flex: 1 },
  optionTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "700" },
  optionTitleDisabled: { color: "#475569" },
  optionDesc: { color: "#64748b", fontSize: 13, lineHeight: 18 },
  optionIndisponivel: { color: "#ef4444", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  optionDisabled: { opacity: 0.5 },
  badgeRecomendado: {
    backgroundColor: "#1e3a5f",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeRecomendadoText: { color: "#93c5fd", fontSize: 11, fontWeight: "700" },
  button: {
    backgroundColor: "#dc2626",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 28,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
