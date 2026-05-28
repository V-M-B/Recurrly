import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import SubscriptionCard from '@/components/SubscriptionCard';
import { cancelScheduledSubscriptionNotification, scheduleSubscriptionNotification } from '@/lib/notifications';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const { subscriptions, updateSubscription, deleteSubscription, addSubscription } = useSubscriptionStore();

  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) =>
          subscription.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subscription.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subscription.plan?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, subscriptions]
  );

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setModalVisible(true);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    deleteSubscription(subscriptionId);
    await cancelScheduledSubscriptionNotification(subscriptionId);
  };

  const handleSubmit = async (subscription: Subscription) => {
    if (editingSubscription) {
      updateSubscription(subscription);
      await scheduleSubscriptionNotification(subscription);
    } else {
      addSubscription(subscription);
      await scheduleSubscriptionNotification(subscription);
    }
    setModalVisible(false);
    setEditingSubscription(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5 pt-5">
            <Text className="text-3xl font-bold text-dark mb-5">Subscriptions</Text>
            <View className="flex-row items-center gap-3 mb-4">
              <TextInput
                className="flex-1 bg-card rounded-xl px-4 py-3 text-dark"
                placeholder="Search subscriptions..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable className="rounded-2xl bg-primary px-4 py-3" onPress={() => setModalVisible(true)}>
                <Text className="text-white">Add</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onEditPress={() => handleEditSubscription(item)}
            onDeletePress={() => handleDeleteSubscription(item.id)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <CreateSubscriptionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSubscription(null);
        }}
        onSubmit={handleSubmit}
        editingSubscription={editingSubscription}
        onDelete={handleDeleteSubscription}
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
