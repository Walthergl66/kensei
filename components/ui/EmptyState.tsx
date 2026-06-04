import { View, Text } from 'react-native';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon && (
        <View className="w-16 h-16 rounded-2xl bg-[#1A1A1A] items-center justify-center mb-5">
          <Text className="text-3xl">{icon}</Text>
        </View>
      )}
      <Text className="text-[#F5F5F5] text-xl font-bold text-center mb-2">{title}</Text>
      {subtitle && <Text className="text-[#666666] text-sm text-center mb-8 leading-5">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
