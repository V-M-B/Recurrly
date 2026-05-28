import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import UpcomingSubscriptionCard from '@/components/UpcomingSubscriptionCard';
import { icons } from '@/constants/icons';
import images from '@/constants/images';
import '@/global.css';
import {
    cancelScheduledSubscriptionNotification,
    scheduleSubscriptionNotification,
    syncSubscriptionNotifications,
} from '@/lib/notifications';
import { useSubscriptionStore } from '@/lib/subscriptionStore';
import { formatCurrency } from '@/lib/utils';
import { useUser } from '@clerk/expo';
import dayjs from 'dayjs';
import { styled } from 'nativewind';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const { user } = useUser();
  const posthog = usePostHog();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptionStore();

  const upcomingSubscriptions = useMemo(() => {
    const now = dayjs();
    const nextWeek = now.add(7, 'days');
    return subscriptions
      .filter(
        (sub) =>
          sub.status === 'active' &&
          sub.renewalDate &&
          dayjs(sub.renewalDate).isAfter(now) &&
          dayjs(sub.renewalDate).isBefore(nextWeek)
      )
      .sort((a, b) => dayjs(a.renewalDate).diff(dayjs(b.renewalDate)));
  }, [subscriptions]);

  const totalBalance = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + (sub.price ?? 0), 0);
  }, [subscriptions]);

  const nextRenewalDate = useMemo(() => {
    const upcoming = subscriptions
      .filter((sub) => sub.status === 'active' && sub.renewalDate && dayjs(sub.renewalDate).isAfter(dayjs()))
      .map((sub) => dayjs(sub.renewalDate))
      .sort((a, b) => a.diff(b));

    return upcoming.length ? upcoming[0].toISOString() : null;
  }, [subscriptions]);

  const soonRenewals = useMemo(() => {
    const now = dayjs();
    return subscriptions.filter((sub) => {
      if (!sub.renewalDate || sub.status !== 'active') {
        return false;
      }
      const renewal = dayjs(sub.renewalDate);
      return renewal.isAfter(now) && renewal.diff(now, 'day') <= 3;
    });
  }, [subscriptions]);

  useEffect(() => {
    syncSubscriptionNotifications(subscriptions).catch((error) => {
      console.warn('Failed to sync subscription notifications', error);
    });
  }, [subscriptions]);

  const handleSubscriptionPress = (item: Subscription) => {
    const isExpanding = expandedSubscriptionId !== item.id;
    setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
    posthog.capture(isExpanding ? 'subscription_expanded' : 'subscription_collapsed', {
      subscription_name: item.name,
      subscription_id: item.id,
    });
  };

  const handleOpenCreateModal = () => {
    setEditingSubscription(null);
    setIsModalVisible(true);
  };

  const handleCreateSubscription = async (newSubscription: Subscription) => {
    addSubscription(newSubscription);
    posthog.capture('subscription_created', {
      subscription_name: newSubscription.name,
      subscription_price: newSubscription.price,
      subscription_frequency: newSubscription.frequency,
      subscription_category: newSubscription.category,
    });
    await scheduleSubscriptionNotification(newSubscription);
  };

  const handleUpdateSubscription = async (subscription: Subscription) => {
    updateSubscription(subscription);
    posthog.capture('subscription_updated', {
      subscription_name: subscription.name,
      subscription_price: subscription.price,
      subscription_frequency: subscription.frequency,
      subscription_category: subscription.category,
      subscription_status: subscription.status,
    });
    await scheduleSubscriptionNotification(subscription);
    setEditingSubscription(null);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    deleteSubscription(subscriptionId);
    await cancelScheduledSubscriptionNotification(subscriptionId);
    posthog.capture('subscription_deleted', { subscription_id: subscriptionId });
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsModalVisible(true);
  };

  const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                  className="home-avatar"
                />
                <Text className="home-user-name">{displayName}</Text>
              </View>

              <Pressable onPress={handleOpenCreateModal}>
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            {soonRenewals.length > 0 && (
              <View className="mb-5 rounded-3xl bg-warning p-4">
                <Text className="text-sm font-sans-semibold text-white">
                  {soonRenewals.length} subscription{soonRenewals.length === 1 ? '' : 's'} renews soon. Check the list for details.
                </Text>
              </View>
            )}

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">{formatCurrency(totalBalance, 'INR')}</Text>
                <Text className="home-balance-date">
                  {nextRenewalDate ? dayjs(nextRenewalDate).format('DD/MM') : '--'}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />

              <FlatList
                data={upcomingSubscriptions}
                renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
              />
            </View>

            <ListHeading title="All Subscriptions" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleSubscriptionPress(item)}
            onEditPress={() => handleEditSubscription(item)}
            onDeletePress={() => handleDeleteSubscription(item.id)}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
        contentContainerClassName="pb-30"
      />

      <CreateSubscriptionModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingSubscription(null);
        }}
        onSubmit={editingSubscription ? handleUpdateSubscription : handleCreateSubscription}
        editingSubscription={editingSubscription}
        onDelete={handleDeleteSubscription}
      />
    </SafeAreaView>
  );
}
