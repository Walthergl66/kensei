import { View } from 'react-native';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center gap-2 py-4 flex-1">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full flex-1 ${i <= current ? 'bg-[#E8C547]' : 'bg-[#222222]'}`}
        />
      ))}
    </View>
  );
}
