import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

// Reemplazo de Alert.alert con el diseño de la app: confirmDialog({...}) se llama desde cualquier
// pantalla y lo dibuja el único <ConfirmHost /> montado en app/_layout.tsx

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** acción destructiva (eliminar): rojo */
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** se espera a que termine (spinner en el botón) antes de cerrar */
  onConfirm: () => unknown;
}

type Listener = (options: ConfirmOptions) => void;
let listener: Listener | null = null;

export function confirmDialog(options: ConfirmOptions) {
  listener?.(options);
}

export function ConfirmHost() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const mine: Listener = (next) => {
      setRunning(false);
      setOptions(next);
    };
    listener = mine;
    // Solo se borra a sí mismo: un host viejo que se desmonta tarde (fast refresh) no apaga al nuevo
    return () => {
      if (listener === mine) listener = null;
    };
  }, []);

  const handleConfirm = async () => {
    if (!options || running) return;
    setRunning(true);
    try {
      await options.onConfirm();
    } catch (error) {
      console.error("Error en confirmDialog:", error);
    } finally {
      setRunning(false);
      setOptions(null);
    }
  };

  return (
    <ConfirmModal
      visible={!!options}
      title={options?.title ?? ""}
      message={options?.message ?? ""}
      confirmLabel={options?.confirmLabel ?? "Confirmar"}
      cancelLabel={options?.cancelLabel ?? "Cancelar"}
      destructive={options?.destructive}
      icon={options?.icon ?? (options?.destructive ? "trash-outline" : "help-circle-outline")}
      loading={running}
      onConfirm={handleConfirm}
      onCancel={() => setOptions(null)}
    />
  );
}
