import { View, Text } from 'react-native';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`w-3 h-3 rounded-full ${i <= current ? 'bg-[#E8C547]' : 'bg-[#2A2A2A]'}`}
        />
      ))}
      <Text className="text-[#888888] text-xs ml-2">{current + 1} / {total}</Text>
    </View>
  );
}
