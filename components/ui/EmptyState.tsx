import { View, Text } from 'react-native';
import Button from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-[#F5F5F5] text-xl font-bold text-center mb-2">{title}</Text>
      {subtitle && <Text className="text-[#888888] text-center mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
