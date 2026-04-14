// app/scan.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// FIX: extrai o pedidoId de qualquer formato de QR Code válido da plataforma
// Formato 1 (PDF novo):  SCOMP|PEDIDO|{uuid}
// Formato 2 (URL web):   https://portal.solucaocompras.com.br/api/recebimentos/qr/{uuid}
function extrairPedidoId(data: string): string | null {
  const str = data.trim();

  // Formato 1: código proprietário
  if (str.startsWith("SCOMP|PEDIDO|")) {
    const id = str.replace("SCOMP|PEDIDO|", "").trim();
    return id || null;
  }

  // Formato 2: URL da plataforma (o que o PDF atual gera)
  // Aceita qualquer URL que tenha /recebimentos/qr/{uuid} no path
  try {
    const url = new URL(str);
    const match = url.pathname.match(/\/recebimentos\/qr\/([0-9a-f-]{36})/i);
    if (match) return match[1];
  } catch {
    // Não é uma URL válida — tenta regex direto na string
    const match = str.match(/\/recebimentos\/qr\/([0-9a-f-]{36})/i);
    if (match) return match[1];
  }

  return null;
}

export default function ScanPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldownRef = useRef(false);

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned || cooldownRef.current) return;
    cooldownRef.current = true;
    setScanned(true);

    try {
      const pedidoId = extrairPedidoId(data);

      if (!pedidoId) {
        Alert.alert(
          "QR inválido",
          "Este QR Code não pertence a um pedido da plataforma CompraHub.\n\nCertifique-se de estar usando o QR Code do PDF do pedido.",
          [{ text: "OK", onPress: resetScan }]
        );
        return;
      }

      // Navega para a tela de recebimento com o pedidoId
      router.push(`/recebimento/${pedidoId}`);
    } catch {
      Alert.alert("Erro", "Falha ao processar o QR Code.", [
        { text: "OK", onPress: resetScan },
      ]);
    }
  }

  function resetScan() {
    setScanned(false);
    cooldownRef.current = false;
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Acessando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permTitle}>Câmera necessária</Text>
        <Text style={styles.permText}>
          Permita o acesso à câmera para escanear o QR Code do pedido.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />
      <View style={styles.overlayLeft} />
      <View style={styles.overlayRight} />

      {/* Caixinha de foco */}
      <View style={styles.focusBox}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Escanear QR Code</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.hint}>
          Aponte para o QR Code no PDF do pedido de compra
        </Text>

        {scanned && (
          <TouchableOpacity style={styles.rescanBtn} onPress={resetScan}>
            <Text style={styles.rescanBtnText}>Ler novamente</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => router.replace("/pedido-manual")}
        >
          <Text style={styles.manualBtnText}>Digitar número manualmente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BOX = 260;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#0a0f1e",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  text: { color: "#fff", fontSize: 17 },
  permTitle: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  permText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  permButton: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 14,
  },
  permButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: { padding: 12 },
  backBtnText: { color: "#64748b", fontSize: 15 },

  overlayTop: {
    position: "absolute", top: 0, left: 0, right: 0,
    bottom: "50%", marginBottom: BOX / 2,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayBottom: {
    position: "absolute", top: "50%", left: 0, right: 0, bottom: 0,
    marginTop: BOX / 2,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayLeft: {
    position: "absolute", top: "50%", left: 0,
    width: "50%", marginTop: -BOX / 2, height: BOX,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayRight: {
    position: "absolute", top: "50%", right: 0,
    width: "50%", marginTop: -BOX / 2, height: BOX,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  focusBox: {
    position: "absolute", top: "50%", left: "50%",
    width: BOX, height: BOX,
    marginTop: -BOX / 2, marginLeft: -BOX / 2,
  },
  corner: { position: "absolute", width: 30, height: 30, borderColor: "#3b82f6" },
  topLeft:     { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 },
  topRight:    { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 },
  bottomLeft:  { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },

  bottomInfo: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 28, paddingBottom: 44,
    backgroundColor: "rgba(10,15,30,0.92)",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    alignItems: "center", gap: 12,
  },
  hint: {
    color: "#94a3b8", fontSize: 14, textAlign: "center",
    lineHeight: 20, marginBottom: 4,
  },
  rescanBtn: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, alignSelf: "stretch", alignItems: "center",
  },
  rescanBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  manualBtn: { paddingVertical: 12, alignSelf: "stretch", alignItems: "center" },
  manualBtnText: { color: "#475569", fontSize: 14, fontWeight: "600" },
});
