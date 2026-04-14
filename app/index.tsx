// app/index.tsx
import { getCurrentSession } from "@/lib/auth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function IndexPage() {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const session = await getCurrentSession();
        setLogged(!!session);
      } catch {
        setLogged(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.brand}>CompraHub</Text>
        <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 24 }} />
        <Text style={styles.sub}>Carregando...</Text>
      </View>
    );
  }

  return <Redirect href={logged ? "/home" : "/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brand: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sub: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 8,
  },
});
