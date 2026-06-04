import { View } from 'react-native';

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: string;
}

export default function ProgressBar({ progress, className = '', color = '#E8C547' }: ProgressBarProps) {
  return (
    <View className={`bg-[#2A2A2A] rounded-full h-2 overflow-hidden ${className}`}>
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color }}
      />
    </View>
  );
}

export function StepDots({ current, total, className = '' }: { current: number; total: number; className?: string }) {
  return (
    <View className={`flex-row items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i <= current ? 'bg-[#E8C547]' : 'bg-[#2A2A2A]'}`}
        />
      ))}
    </View>
  );
}
