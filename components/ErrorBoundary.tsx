import { Ionicons } from "@expo/vector-icons";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary:", error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 bg-[#faf5e0] items-center justify-center px-6">
          <Ionicons name="paw" size={64} color="#211f1e" style={{ marginBottom: 16 }} />
          <Text className="text-xl font-bold text-[#211f1e] mb-2">
            Algo salió mal
          </Text>
          <Text className="text-[#211f1e]/70 text-center mb-6">
            {__DEV__ && this.state.error?.message
              ? this.state.error.message
              : "Ocurrió un error inesperado. Intenta de nuevo."}
          </Text>
          <TouchableOpacity
            className="bg-[#007275] py-3 px-8 rounded-xl"
            onPress={this.handleRetry}
            accessibilityRole="button"
          >
            <Text className="text-white font-bold">Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
