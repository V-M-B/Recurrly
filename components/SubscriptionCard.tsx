import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from '@/lib/utils';
import clsx from 'clsx';
import dayjs from 'dayjs';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

const SubscriptionCard = ({
  id,
  name,
  price,
  currency,
  icon,
  billing,
  color,
  category,
  plan,
  renewalDate,
  expanded,
  onPress,
  onEditPress,
  onDeletePress,
  paymentMethod,
  startDate,
  status,
}: SubscriptionCardProps) => {
  const now = dayjs();
  const renewal = renewalDate ? dayjs(renewalDate) : null;
  const isRenewalSoon = renewal ? renewal.isAfter(now) && renewal.diff(now, 'day') <= 3 : false;

  return (
    <Pressable
      onPress={onPress}
      className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-card')}
      style={!expanded && color ? { backgroundColor: color } : undefined}
    >
      <View className="sub-head">
        <View className="sub-main">
          <Image source={icon} className="sub-icon" />
          <View className="sub-copy">
            <Text numberOfLines={1} className="sub-title">
              {name}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
              {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : '')}
            </Text>
          </View>
        </View>

        <View className="sub-price-box">
          <Text className="sub-price">{formatCurrency(price, currency)}</Text>
          <Text className="sub-billing">{billing}</Text>
        </View>
      </View>

      {isRenewalSoon && (
        <View className="rounded-full bg-warning px-3 py-1 self-start mt-3">
          <Text className="text-xs font-sans-semibold text-white">Renewal soon</Text>
        </View>
      )}

      {expanded && (
        <View className="sub-bdy">
          <View className="sub-details">
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Payment:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {paymentMethod?.trim() ?? 'Not provided'}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Category:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {(category?.trim() || plan?.trim()) ?? 'Not provided'}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Started:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {startDate ? formatSubscriptionDateTime(startDate) : 'Not provided'}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Renewal date:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided'}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Status:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {status ? formatStatusLabel(status) : 'Not provided'}
                </Text>
              </View>
            </View>
          </View>

          {(onEditPress || onDeletePress) && (
            <View className="flex-row gap-3 mt-4">
              {onEditPress && (
                <Pressable className="flex-1 rounded-2xl bg-primary px-4 py-3" onPress={onEditPress}>
                  <Text className="text-center text-sm font-sans-bold text-white">Edit</Text>
                </Pressable>
              )}
              {onDeletePress && (
                <Pressable className="flex-1 rounded-2xl bg-destructive px-4 py-3" onPress={onDeletePress}>
                  <Text className="text-center text-sm font-sans-bold text-white">Delete</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};
export default SubscriptionCard;
