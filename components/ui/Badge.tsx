import { View, Text } from 'react-native';

type BadgeVariant = 'low' | 'medium' | 'high' | 'info' | 'success' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  low: 'bg-[#4CAF50]/20',
  medium: 'bg-[#FF9800]/20',
  high: 'bg-[#F44336]/20',
  info: 'bg-[#2196F3]/20',
  success: 'bg-[#4CAF50]/20',
  warning: 'bg-[#FF9800]/20',
};

const textStyles: Record<BadgeVariant, string> = {
  low: 'text-[#4CAF50]',
  medium: 'text-[#FF9800]',
  high: 'text-[#F44336]',
  info: 'text-[#2196F3]',
  success: 'text-[#4CAF50]',
  warning: 'text-[#FF9800]',
};

export default function Badge({ label, variant = 'info', className = '' }: BadgeProps) {
  return (
    <View className={`px-3 py-1 rounded-full self-start ${variantStyles[variant]} ${className}`}>
      <Text className={`text-xs font-semibold ${textStyles[variant]}`}>{label}</Text>
    </View>
  );
}
