import { posthog } from '@/config/posthog';
import { icons } from '@/constants/icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import clsx from 'clsx';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
  editingSubscription?: Subscription | null;
  onDelete?: (id: string) => void;
}

type Frequency = 'Monthly' | 'Yearly';
type Category = 'Entertainment' | 'AI Tools' | 'Developer Tools' | 'Design' | 'Productivity' | 'Other';
type Status = 'active' | 'paused' | 'cancelled';
const CATEGORIES: Category[] = ['Entertainment', 'AI Tools', 'Developer Tools', 'Design', 'Productivity', 'Other'];
const STATUSES: Status[] = ['active', 'paused', 'cancelled'];
const CATEGORY_COLORS: Record<Category, string> = {
  'Entertainment': '#ff6b6b',
  'AI Tools': '#b8d4e3',
  'Developer Tools': '#e8def8',
  'Design': '#f5c542',
  'Productivity': '#95e1d3',
  'Other': '#d4d4d4',
};

const CreateSubscriptionModal = ({ visible, onClose, onSubmit, editingSubscription, onDelete }: CreateSubscriptionModalProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [category, setCategory] = useState<Category>('Other');
  const [status, setStatus] = useState<Status>('active');
  const [startDate, setStartDate] = useState(dayjs().toDate());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name || '');
      setPrice(editingSubscription.price?.toString() || '');
      setFrequency((editingSubscription.frequency as Frequency) || 'Monthly');
      setCategory((editingSubscription.category as Category) || 'Other');
      setStatus((editingSubscription.status as Status) || 'active');
      setStartDate(editingSubscription.startDate ? dayjs(editingSubscription.startDate).toDate() : dayjs().toDate());
    } else {
      resetForm();
    }
  }, [editingSubscription]);

  const isValidPrice = () => {
    const trimmedPrice = price.trim();
    if (!trimmedPrice) return false;
    if (!/^\s*[+-]?(\d+(\.\d+)?|\.\d+)\s*$/.test(trimmedPrice)) return false;
    const numValue = Number(trimmedPrice);
    return Number.isFinite(numValue) && numValue > 0;
  };

  const isValidForm = name.trim() !== '' && isValidPrice();

  const calculateRenewalDate = (date: Date, frequencyValue: Frequency) => {
    const next = dayjs(date);
    return frequencyValue === 'Monthly' ? next.add(1, 'month') : next.add(1, 'year');
  };

  const handleSubmit = () => {
    if (!isValidForm) return;

    const priceValue = Number(price.trim());
    const renewalDate = calculateRenewalDate(startDate, frequency);

    const subscription: Subscription = {
      id: editingSubscription?.id ?? `sub-${Date.now()}`,
      name: name.trim(),
      price: priceValue,
      currency: 'USD',
      frequency,
      category,
      status,
      startDate: startDate.toISOString(),
      renewalDate: renewalDate.toISOString(),
      icon: editingSubscription?.icon ?? icons.plus,
      billing: frequency,
      color: CATEGORY_COLORS[category],
    };

    onSubmit(subscription);

    posthog.capture(editingSubscription ? 'subscription_updated' : 'subscription_created', {
      subscription_name: subscription.name,
      subscription_price: subscription.price,
      subscription_frequency: subscription.frequency,
      subscription_category: subscription.category,
      subscription_status: subscription.status,
    });

    handleClose();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setFrequency('Monthly');
    setCategory('Other');
    setStatus('active');
    setStartDate(dayjs().toDate());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <Pressable className="modal-overlay" onPress={handleClose}>
          <Pressable className="modal-container" onPress={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">{editingSubscription ? 'Edit Subscription' : 'New Subscription'}</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className="auth-input"
                  placeholder="Subscription name"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className="auth-input"
                  placeholder="0.00"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Start Date</Text>
                <Pressable onPress={() => setShowDatePicker(true)} className="auth-input justify-center">
                  <Text className="text-base text-primary">{dayjs(startDate).format('MM/DD/YYYY')}</Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="calendar"
                    onChange={handleDateChange}
                    maximumDate={new Date(2100, 11, 31)}
                  />
                )}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  <Pressable
                    className={clsx('picker-option', frequency === 'Monthly' && 'picker-option-active')}
                    onPress={() => setFrequency('Monthly')}
                  >
                    <Text className={clsx('picker-option-text', frequency === 'Monthly' && 'picker-option-text-active')}>
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    className={clsx('picker-option', frequency === 'Yearly' && 'picker-option-active')}
                    onPress={() => setFrequency('Yearly')}
                  >
                    <Text className={clsx('picker-option-text', frequency === 'Yearly' && 'picker-option-text-active')}>
                      Yearly
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      className={clsx('category-chip', category === cat && 'category-chip-active')}
                      onPress={() => setCategory(cat)}
                    >
                      <Text className={clsx('category-chip-text', category === cat && 'category-chip-text-active')}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Subscription Status</Text>
                <View className="picker-row">
                  {STATUSES.map((statusOption) => (
                    <Pressable
                      key={statusOption}
                      className={clsx('picker-option', status === statusOption && 'picker-option-active')}
                      onPress={() => setStatus(statusOption)}
                    >
                      <Text className={clsx('picker-option-text', status === statusOption && 'picker-option-text-active')}>
                        {statusOption}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {editingSubscription && onDelete && (
                <Pressable
                  className="auth-button bg-destructive"
                  onPress={() => {
                    onDelete(editingSubscription.id);
                    handleClose();
                  }}
                >
                  <Text className="auth-button-text text-white">Delete Subscription</Text>
                </Pressable>
              )}

              <Pressable
                className={clsx('auth-button', !isValidForm && 'auth-button-disabled')}
                onPress={handleSubmit}
                disabled={!isValidForm}
              >
                <Text className="auth-button-text">
                  {editingSubscription ? 'Save Changes' : 'Create Subscription'}
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
