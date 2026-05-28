import images from '@/constants/images';
import { useClerk, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { styled } from 'nativewind';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
const SafeAreaView = styled(RNSafeAreaView);

const PHOTO_STORE_KEY = 'recurrly_profile_photo_uri';

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedPhoto = async () => {
      try {
        const savedUri = await SecureStore.getItemAsync(PHOTO_STORE_KEY);
        if (savedUri) {
          setLocalPhotoUri(savedUri);
        }
      } catch (error) {
        console.error('Failed to load saved profile photo:', error);
      }
    };

    loadSavedPhoto();
  }, []);

  const handleSignOut = async () => {
    posthog.capture('user_signed_out');
    try {
      await signOut();
      posthog.reset();
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const handlePickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      console.warn('Permission to access photo library was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setLocalPhotoUri(uri);
      await SecureStore.setItemAsync(PHOTO_STORE_KEY, uri);
      posthog.capture('profile_photo_updated');
    }
  };

  const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';
  const email = user?.emailAddresses[0]?.emailAddress;
  const profileSource = localPhotoUri ? { uri: localPhotoUri } : user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-sans-bold text-primary mb-6">Settings</Text>

      <View className="auth-card mb-5">
        <View className="flex-row items-center gap-4 mb-4">
          <Image source={profileSource} className="size-16 rounded-full" />
          <View className="flex-1">
            <Text className="text-lg font-sans-bold text-primary">{displayName}</Text>
            {email && (
              <Text className="text-sm font-sans-medium text-muted-foreground">{email}</Text>
            )}
          </View>
        </View>

        <Pressable className="auth-button bg-primary" onPress={handlePickPhoto}>
          <Text className="auth-button-text text-white">Change profile photo</Text>
        </Pressable>
      </View>

      <View className="auth-card mb-5">
        <Text className="text-base font-sans-semibold text-primary mb-3">Account</Text>
        <View className="gap-2">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm font-sans-medium text-muted-foreground">Account ID</Text>
            <Text className="text-sm font-sans-medium text-primary" numberOfLines={1} ellipsizeMode="tail">
              {user?.id?.substring(0, 20)}...
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm font-sans-medium text-muted-foreground">Joined</Text>
            <Text className="text-sm font-sans-medium text-primary">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable className="auth-button bg-destructive" onPress={handleSignOut}>
        <Text className="auth-button-text text-white">Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
