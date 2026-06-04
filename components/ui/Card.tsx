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
      className={`bg-[#141414] rounded-2xl p-5 border border-[#1E1E1E] ${className}`}
      style={{
        ...(accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : {}),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {children}
    </View>
  );
}
