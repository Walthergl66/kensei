import { View, Text, TouchableOpacity } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4">
      <View className="flex-row items-center flex-1">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Text className="text-[#E8C547] text-2xl">{'<'}</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-[#F5F5F5] text-xl font-bold">{title}</Text>
          {subtitle && <Text className="text-[#888888] text-sm mt-1">{subtitle}</Text>}
        </View>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
