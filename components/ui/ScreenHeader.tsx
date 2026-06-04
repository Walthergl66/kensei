import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
      <View className="flex-row items-center flex-1">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3 w-10 h-10 rounded-xl bg-[#1A1A1A] items-center justify-center">
            <Ionicons name="chevron-back" size={20} color="#E8C547" />
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-[#F5F5F5] text-xl font-bold tracking-tight">{title}</Text>
          {subtitle && <Text className="text-[#666666] text-sm mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
