import { View } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  accentColor?: string;
}

export default function Card({ children, className = '', accentColor }: CardProps) {
  return (
    <View
      className={`bg-[#141414] rounded-xl p-4 border border-[#2A2A2A] ${className}`}
      style={accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined}
    >
      {children}
    </View>
  );
}
