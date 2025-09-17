// app/index.jsx
import { useFocusEffect, useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useCallback } from "react";

export default function Index() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.replace("/login");
    }, [])
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
