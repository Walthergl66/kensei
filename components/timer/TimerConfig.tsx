import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimerConfig as TimerConfigType } from '@/types';

interface TimerConfigProps {
  config: TimerConfigType;
  onChange: (config: Partial<TimerConfigType>) => void;
  disabled?: boolean;
}

function ConfigItem({ label, value, onInc, onDec, disabled, unit }: any) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-white/5">
      <View>
        <Text className="text-[#666] text-[10px] font-bold tracking-widest uppercase">{label}</Text>
        <Text className="text-white text-2xl font-bold mt-1">
          {value}{unit ? <Text className="text-sm font-normal text-[#444]"> {unit}</Text> : ''}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity 
          onPress={onDec} 
          disabled={disabled}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
        >
          <Ionicons name="remove" size={20} color={disabled ? "#333" : "#FFF"} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onInc} 
          disabled={disabled}
          className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
        >
          <Ionicons name="add" size={20} color={disabled ? "#333" : "#FFF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TimerConfig({ config, onChange, disabled }: TimerConfigProps) {
  if (disabled) return null;

  return (
    <View className="bg-[#111] rounded-3xl p-6 border border-white/5">
      <ConfigItem
        label="Rondas"
        value={config.rounds}
        onInc={() => onChange({ rounds: Math.min(20, config.rounds + 1) })}
        onDec={() => onChange({ rounds: Math.max(1, config.rounds - 1) })}
      />
      <ConfigItem
        label="Duración"
        value={Math.floor(config.round_duration / 60)}
        unit="min"
        onInc={() => onChange({ round_duration: Math.min(600, config.round_duration + 30) })}
        onDec={() => onChange({ round_duration: Math.max(10, config.round_duration - 30) })}
      />
      <ConfigItem
        label="Descanso"
        value={config.rest_duration}
        unit="seg"
        onInc={() => onChange({ rest_duration: Math.min(300, config.rest_duration + 5) })}
        onDec={() => onChange({ rest_duration: Math.max(0, config.rest_duration - 5) })}
      />
    </View>
  );
}
