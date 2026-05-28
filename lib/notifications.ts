import dayjs from 'dayjs';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'recurrly_subscription_notifications';

const isAndroidExpoGo = Constants.appOwnership === 'expo' && Platform.OS === 'android';

const getNotificationsModule = async () => {
  if (isAndroidExpoGo) {
    return null;
  }

  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return Notifications;
};

interface NotificationRecord {
  subscriptionId: string;
  notificationId: string;
  renewalDate: string;
}

const getNotificationRecords = async (): Promise<NotificationRecord[]> => {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setNotificationRecords = async (records: NotificationRecord[]) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage write failures
  }
};

export const registerForPushNotificationsAsync = async (): Promise<boolean> => {
  if (isAndroidExpoGo) {
    return false;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const cancelScheduledSubscriptionNotification = async (subscriptionId: string) => {
  const records = await getNotificationRecords();
  const remaining = [] as NotificationRecord[];

  const Notifications = await getNotificationsModule();

  for (const record of records) {
    if (record.subscriptionId === subscriptionId) {
      if (Notifications) {
        try {
          await Notifications.cancelScheduledNotificationAsync(record.notificationId);
        } catch {
          // ignore cancel failures
        }
      }
      continue;
    }
    remaining.push(record);
  }

  await setNotificationRecords(remaining);
};

export const scheduleSubscriptionNotification = async (subscription: Subscription) => {
  if (!subscription.renewalDate || !subscription.id) {
    return;
  }

  const renewalDate = dayjs(subscription.renewalDate);
  if (!renewalDate.isValid() || renewalDate.isBefore(dayjs())) {
    return;
  }

  const permissionGranted = await registerForPushNotificationsAsync();
  if (!permissionGranted) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const records = await getNotificationRecords();
  const existing = records.find((record) => record.subscriptionId === subscription.id);
  if (existing && existing.renewalDate === subscription.renewalDate) {
    return;
  }

  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
    } catch {
      // ignore
    }
  }

  const content = {
    title: `${subscription.name} renewal coming up`,
    body: `Your ${subscription.name} subscription renews on ${renewalDate.format('MM/DD/YYYY')}.`,
    data: { subscriptionId: subscription.id },
  };

  const trigger = renewalDate.toDate();

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({ content, trigger });
    const nextRecords = records.filter((record) => record.subscriptionId !== subscription.id);
    nextRecords.push({
      subscriptionId: subscription.id,
      notificationId,
      renewalDate: subscription.renewalDate,
    });
    await setNotificationRecords(nextRecords);
  } catch {
    // ignore schedule failures
  }
};

export const syncSubscriptionNotifications = async (subscriptions: Subscription[]) => {
  if (isAndroidExpoGo) {
    return;
  }

  const permissionGranted = await registerForPushNotificationsAsync();
  if (!permissionGranted) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const records = await getNotificationRecords();
  const activeSubscriptionIds = new Set(subscriptions.map((item) => item.id));
  const nextRecords: NotificationRecord[] = [];

  for (const record of records) {
    if (!activeSubscriptionIds.has(record.subscriptionId)) {
      try {
        await Notifications.cancelScheduledNotificationAsync(record.notificationId);
      } catch {
        // ignore
      }
      continue;
    }
    nextRecords.push(record);
  }

  await setNotificationRecords(nextRecords);

  for (const subscription of subscriptions) {
    await scheduleSubscriptionNotification(subscription);
  }
};
