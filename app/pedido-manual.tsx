// app/pedido-manual.tsx
import { api } from "@/lib/api";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PedidoManualPage() {
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendencia, setPendencia] = useState<{ id: string; numero: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  async function buscarPedido() {
    const numeroTrim = numero.trim();

    if (!numeroTrim) {
      Alert.alert("Atenção", "Informe o número do pedido.");
      inputRef.current?.focus();
      return;
    }

    setPendencia(null);

    try {
      setLoading(true);

      const response = await api.get(`/api/recebimentos/pedido?numero=${encodeURIComponent(numeroTrim)}`);
      const data = response.data;

      if (!data?.ok) {
        Alert.alert("Pedido não encontrado", data?.error || "Verifique o número e tente novamente.");
        return;
      }

      const pedidoId = data?.pedido?.id;

      if (!pedidoId) {
        Alert.alert("Erro", "Pedido localizado, mas sem identificador válido. Contate o suporte.");
        return;
      }

      router.push(`/recebimento/${pedidoId}`);
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const msg = data?.error || error?.message || "Erro ao buscar pedido.";

      if (status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      } else if (status === 403) {
        Alert.alert("Sem permissão", "Você não tem permissão para visualizar recebimentos.");
      } else if (status === 404) {
        Alert.alert("Não encontrado", `Pedido número "${numeroTrim}" não encontrado nesta empresa.`);
      } else if (status === 422 && data?.recebimento_pendente_id) {
        // Há pendências aguardando definição — mostra na tela em vez de Alert
        setPendencia({
          id: data.recebimento_pendente_id,
          numero: data.recebimento_pendente_numero || "pendente",
        });
      } else {
        Alert.alert("Erro", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>‹ Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Buscar Pedido</Text>
          <Text style={styles.subtitle}>
            Informe o número do pedido de compra para iniciar o recebimento.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número do Pedido</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Ex: 1042"
              placeholderTextColor="#475569"
              value={numero}
              onChangeText={(t) => {
                setNumero(t);
                setPendencia(null);
              }}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={buscarPedido}
              autoFocus
            />
            <Text style={styles.hint}>
              O número aparece no cabeçalho do PDF do pedido.
            </Text>
          </View>

          {/* Card de pendência */}
          {pendencia && (
            <View style={styles.pendCard}>
              <Text style={styles.pendIcon}>⚠️</Text>
              <Text style={styles.pendTitle}>Pendências aguardando definição</Text>
              <Text style={styles.pendMsg}>
                O recebimento {pendencia.numero} possui itens faltantes sem ação definida.
                Defina a ação antes de iniciar um novo recebimento.
              </Text>
              <TouchableOpacity
                style={styles.pendBtn}
                onPress={() => router.push(`/recebimento/${pendencia.id}`)}
              >
                <Text style={styles.pendBtnText}>Ver recebimento pendente →</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={buscarPedido}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.loadingText}>Buscando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🔍 Buscar Pedido</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 8,
    alignSelf: "flex-start",
  },
  backBtnText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
    justifyContent: "center",
  },
  title: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 36,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111827",
    color: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    color: "#334155",
    fontSize: 12,
    textAlign: "center",
  },
  pendCard: {
    backgroundColor: "#1c1a10",
    borderWidth: 1,
    borderColor: "#854d0e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  pendIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  pendTitle: {
    color: "#fcd34d",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  pendMsg: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  pendBtn: {
    marginTop: 8,
    backgroundColor: "#1d4ed8",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  pendBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
