import { Component, type ReactNode } from "react";
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

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 bg-[#faf5e0] items-center justify-center px-6">
          <Text className="text-6xl mb-4">🐾</Text>
          <Text className="text-xl font-bold text-[#ff7e70] mb-2">
            Algo salió mal
          </Text>
          <Text className="text-[#211f1e]/70 text-center mb-6">
            {this.state.error?.message || "Error inesperado"}
          </Text>
          <TouchableOpacity
            className="bg-[#ff7e70] py-3 px-8 rounded-xl"
            onPress={this.handleRetry}
          >
            <Text className="text-white font-bold">Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
