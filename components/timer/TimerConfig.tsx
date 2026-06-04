import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimerConfig as TimerConfigType } from '@/types';

interface TimerConfigProps {
  config: TimerConfigType;
  onChange: (config: Partial<TimerConfigType>) => void;
  disabled?: boolean;
}

function ConfigRow({ label, value, onIncrease, onDecrease, disabled }: {
  label: string;
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-[#F5F5F5] text-base">{label}</Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={onDecrease}
          disabled={disabled}
          className="w-8 h-8 rounded-full bg-[#2A2A2A] items-center justify-center"
        >
          <Ionicons name="remove" size={18} color="#F5F5F5" />
        </TouchableOpacity>
        <Text className="text-[#F5F5F5] text-lg font-bold w-12 text-center">{value}</Text>
        <TouchableOpacity
          onPress={onIncrease}
          disabled={disabled}
          className="w-8 h-8 rounded-full bg-[#2A2A2A] items-center justify-center"
        >
          <Ionicons name="add" size={18} color="#F5F5F5" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TimerConfig({ config, onChange, disabled }: TimerConfigProps) {
  return (
    <View className="bg-[#141414] rounded-xl p-4 border border-[#2A2A2A]">
      <ConfigRow
        label="Rondas"
        value={config.rounds}
        onIncrease={() => onChange({ rounds: Math.min(12, config.rounds + 1) })}
        onDecrease={() => onChange({ rounds: Math.max(1, config.rounds - 1) })}
        disabled={disabled}
      />
      <ConfigRow
        label="Duración (min)"
        value={config.round_duration / 60}
        onIncrease={() => onChange({ round_duration: Math.min(300, config.round_duration + 60) })}
        onDecrease={() => onChange({ round_duration: Math.max(60, config.round_duration - 60) })}
        disabled={disabled}
      />
      <ConfigRow
        label="Descanso (seg)"
        value={config.rest_duration}
        onIncrease={() => onChange({ rest_duration: Math.min(180, config.rest_duration + 15) })}
        onDecrease={() => onChange({ rest_duration: Math.max(15, config.rest_duration - 15) })}
        disabled={disabled}
      />
    </View>
  );
}
