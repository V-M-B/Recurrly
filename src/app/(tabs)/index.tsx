import '@/global.css';
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      {/* Onbording */}
      <Link href="/onbording" className="mt-4 rounded bg-primary text-white p-4">Go to Onbording </Link>

      {/* Sign In */}
      <Link href="/sign-in" className="mt-4 rounded bg-primary text-white p-4">Sign In</Link>

      {/* Sign Up */}
      <Link href="/sign-up" className="mt-4 rounded bg-primary text-white p-4">Sign Up</Link>

      {/* Subscription Details */}
      <Link href="/(tabs)/subscriptions" className="mt-4 rounded bg-primary text-white p-4">Subscription Details</Link>

      <Link
        href={{
          pathname: "/subscriptions/[id]",
          params: { id: "claude" }
        }}
      >
        Claude Max Subscription
      </Link>
    </View>
  );
}
