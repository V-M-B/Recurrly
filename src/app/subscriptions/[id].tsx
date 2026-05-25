import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

const SubscriptionDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-xl font-bold text-success">SubscriptionDetails: {id}</Text>
            <Link href={"/" as any} >Go Back </Link>
        </View>
    )
}

export default SubscriptionDetails