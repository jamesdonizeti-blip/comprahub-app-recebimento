// app/login.tsx
import { signInWithPassword } from "@/lib/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar() {
    const emailTrim = email.trim();
    const senhaTrim = senha.trim();

    if (!emailTrim || !senhaTrim) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      await signInWithPassword(emailTrim, senhaTrim);
      router.replace("/home");
    } catch (error: any) {
      const msg = error?.message ?? "";
      // Mensagens mais amigáveis para erros comuns do Supabase
      if (msg.includes("Invalid login credentials")) {
        Alert.alert("Falha no login", "E-mail ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        Alert.alert("Conta não confirmada", "Verifique seu e-mail e confirme sua conta.");
      } else {
        Alert.alert("Falha no login", msg || "Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SC</Text>
          </View>
          <Text style={styles.logo}>CompraHub</Text>
          <Text style={styles.subtitle}>Módulo de Recebimento</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com.br"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={entrar}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={entrar}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Use as mesmas credenciais do portal web.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
  },
  inner: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  logo: {
    color: "#f1f5f9",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
  },
  form: {
    gap: 6,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#111827",
    color: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  footer: {
    color: "#334155",
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
    lineHeight: 18,
  },
});
