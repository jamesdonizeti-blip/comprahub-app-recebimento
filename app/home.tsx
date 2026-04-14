// app/home.tsx
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomePage() {
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata;
      const nome = meta?.nome || meta?.name || data?.user?.email?.split("@")[0] || "";
      setNomeUsuario(nome);
    });
  }, []);

  async function sair() {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/login");
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Não foi possível sair.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {nomeUsuario ? `Olá, ${nomeUsuario.split(" ")[0]}` : "Recebimento"}
            </Text>
            <Text style={styles.subtitle}>CompraHub</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={sair}>
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <Text style={styles.sectionTitle}>Como deseja buscar o pedido?</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/scan")}
          activeOpacity={0.85}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📷</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Ler QR Code</Text>
            <Text style={styles.cardDesc}>
              Aponte a câmera para o QR Code no PDF do pedido
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSecondary]}
          onPress={() => router.push("/pedido-manual")}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, styles.cardIconSecondary]}>
            <Text style={styles.cardIconText}>🔢</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Digitar Número</Text>
            <Text style={styles.cardDesc}>
              Informe manualmente o número do pedido de compra
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 O recebimento é vinculado à sua empresa automaticamente.
            Apenas pedidos confirmados, enviados ou aprovados podem ser recebidos.
          </Text>
        </View>
      </View>
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
    padding: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#475569",
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  logoutIcon: {
    fontSize: 20,
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardSecondary: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardIconSecondary: {
    backgroundColor: "#1e293b",
  },
  cardIconText: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 18,
  },
  cardArrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 24,
    fontWeight: "300",
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  infoText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
  },
});
