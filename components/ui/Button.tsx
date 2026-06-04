import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#E8C547]',
  secondary: 'bg-[#141414] border border-[#2A2A2A]',
  outline: 'border border-[#E8C547]',
  danger: 'bg-[#F44336]',
  ghost: '',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-2 px-4',
  md: 'py-3 px-6',
  lg: 'py-4 px-8',
};

const textStyles: Record<ButtonVariant, string> = {
  primary: 'text-[#0A0A0A] font-bold',
  secondary: 'text-[#F5F5F5] font-bold',
  outline: 'text-[#E8C547] font-bold',
  danger: 'text-[#F5F5F5] font-bold',
  ghost: 'text-[#E8C547]',
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl items-center justify-center flex-row ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.7}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#0A0A0A' : '#E8C547'} className="mr-2" />}
      <Text className={`text-center ${textStyles[variant]} ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
