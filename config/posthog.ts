import PostHog from 'posthog-react-native';

// PostHog analytics client
// Configure with your project API key and host
export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '__POSTHOG_API_KEY__',
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  }
);
