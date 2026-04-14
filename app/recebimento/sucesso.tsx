// app/recebimento/sucesso.tsx
import { router, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SucessoRecebimentoPage() {
  const { numero, mensagem, encerrado, cotacao } = useLocalSearchParams<{
    numero: string;
    mensagem: string;
    encerrado: string;
    cotacao: string;
  }>();

  const isEncerrado = encerrado === "true";
  const temCotacao = !!cotacao;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Ícone */}
        <View style={[styles.iconCircle, isEncerrado && styles.iconCircleOrange]}>
          <Text style={styles.iconText}>{isEncerrado ? "⚑" : "✓"}</Text>
        </View>

        <Text style={styles.title}>
          {isEncerrado ? "Encerrado!" : "Recebimento Salvo!"}
        </Text>

        {numero ? (
          <Text style={styles.numero}>Recebimento {numero}</Text>
        ) : null}

        <Text style={styles.mensagem}>
          {mensagem ||
            (isEncerrado
              ? "O recebimento foi encerrado com sucesso."
              : "Todos os itens foram conferidos e o recebimento foi registrado.")}
        </Text>

        {temCotacao && (
          <View style={styles.cotacaoBox}>
            <Text style={styles.cotacaoTitle}>📋 Cotação complementar criada</Text>
            <Text style={styles.cotacaoDesc}>
              Os itens faltantes foram adicionados a uma nova cotação no portal.
              Acesse o portal web para enviar aos fornecedores.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.replace("/home")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Novo Recebimento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.replace("/home")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSecondaryText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1e" },
  container: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#14532d",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircleOrange: {
    backgroundColor: "#78350f",
    shadowColor: "#f59e0b",
  },
  iconText: { fontSize: 44, color: "#fff" },
  title: {
    color: "#f1f5f9",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  numero: {
    color: "#475569",
    fontSize: 15,
    marginBottom: 16,
  },
  mensagem: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  cotacaoBox: {
    backgroundColor: "#1e3a5f",
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    width: "100%",
  },
  cotacaoTitle: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  cotacaoDesc: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 17,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  btnSecondaryText: { color: "#475569", fontSize: 15, fontWeight: "600" },
});
