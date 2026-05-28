import { HOME_SUBSCRIPTIONS } from '@/constants/data';
import { create } from 'zustand';

interface SubscriptionStore {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  setSubscriptions: (subscriptions: Subscription[]) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscriptions: HOME_SUBSCRIPTIONS,
  addSubscription: (subscription) =>
    set((state) => ({ subscriptions: [subscription, ...state.subscriptions] })),
  updateSubscription: (subscription) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((item) =>
        item.id === subscription.id ? { ...item, ...subscription } : item
      ),
    })),
  deleteSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((item) => item.id !== id),
    })),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
}));
