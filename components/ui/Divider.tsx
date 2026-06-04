import { View } from 'react-native';

interface DividerProps {
  className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
  return <View className={`h-px bg-[#2A2A2A] my-4 ${className}`} />;
}
