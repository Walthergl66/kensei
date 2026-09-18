import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Animated, FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TimerConfig as TimerConfigType } from '@/types';

interface TimerConfigProps {
  config: TimerConfigType;
  onChange: (config: Partial<TimerConfigType>) => void;
  disabled?: boolean;
  activeTab: 'new' | 'saved';
  onTabChange: (tab: 'new' | 'saved') => void;
}

type PickerTarget = 'round_duration' | 'rest_duration' | 'rounds' | 'warning_seconds';

interface PickerState {
  target: PickerTarget;
  title: string;
  accent: string;
}

interface ConfigRowProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  onPress: () => void;
}

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;

const hourValues = range(0, 5);
const minuteValues = range(0, 59);
const secondValues = range(0, 59);
const roundValues = range(1, 50);
const warningValues = range(0, 60, 5);

function range(start: number, end: number, step = 1): number[] {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => start + index * step);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function splitTime(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function ConfigRow({ label, value, icon, accent, onPress }: ConfigRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 180,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
        className="bg-[#141414] rounded-2xl px-5 py-4 border border-[#1E1E1E] flex-row items-center justify-between"
        style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}
      >
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-11 h-11 rounded-full items-center justify-center mr-4 border" style={{ borderColor: accent, backgroundColor: `${accent}14` }}>
            <Ionicons name={icon} size={24} color={accent} />
          </View>
          <Text className="text-xl font-extrabold tracking-tight flex-1" style={{ color: accent }}>
            {label}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-2xl font-black font-mono" style={{ color: accent }}>
            {value}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#666666" style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function WheelColumn({ values, selected, label, formatter, onSelect }: {
  values: number[];
  selected: number;
  label: string;
  formatter?: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  const listRef = useRef<Animated.FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const selectedIndex = Math.max(0, values.indexOf(selected));

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: selectedIndex, animated: true });
    }, 300);
    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  const handleMomentumEnd = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const nextIndex = clamp(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT), 0, values.length - 1);
    onSelect(values[nextIndex]);
  };

  const renderItem = useCallback(({ item, index }: { item: number; index: number }) => {
    const itemCenter = index * ITEM_HEIGHT;

    const inputRange = [
      itemCenter - 3 * ITEM_HEIGHT,
      itemCenter - 2 * ITEM_HEIGHT,
      itemCenter - ITEM_HEIGHT,
      itemCenter,
      itemCenter + ITEM_HEIGHT,
      itemCenter + 2 * ITEM_HEIGHT,
      itemCenter + 3 * ITEM_HEIGHT,
    ];

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.55, 0.65, 0.82, 1, 0.82, 0.65, 0.55],
      extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.1, 0.2, 0.45, 1, 0.45, 0.2, 0.1],
      extrapolate: 'clamp',
    });

    const isSelected = item === selected;

    return (
      <TouchableOpacity
        onPress={() => {
          onSelect(item);
          listRef.current?.scrollToIndex({ index: values.indexOf(item), animated: true });
        }}
        activeOpacity={0.8}
        style={{ height: ITEM_HEIGHT }}
        className="items-center justify-center"
      >
        <Animated.View style={[{ transform: [{ scale }], opacity }]}>
          <Text
            className={`${isSelected ? 'text-3xl font-black' : 'text-xl font-bold'} tracking-tight`}
            style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.32)' }}
          >
            {formatter ? formatter(item) : item}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [selected, formatter, onSelect, scrollY]);

  return (
    <View className="flex-1 items-center">
      <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }} className="w-full overflow-hidden">
        <Animated.FlatList
          ref={listRef}
          data={values}
          keyExtractor={(item) => `${label}-${item}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="normal"
          initialScrollIndex={selectedIndex}
          getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          renderItem={renderItem}
          onMomentumScrollEnd={handleMomentumEnd}
        />
        <View
          className="absolute left-1 right-1 rounded-xl"
          style={{
            top: ITEM_HEIGHT * 2,
            height: ITEM_HEIGHT,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            pointerEvents: 'none',
          }}
        />
      </View>
      <Text className="text-white/70 text-sm font-bold mt-2 uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

function TimerPickerModal({ picker, config, onClose, onApply }: {
  picker: PickerState | null;
  config: TimerConfigType;
  onClose: () => void;
  onApply: (config: Partial<TimerConfigType>) => void;
}) {
  const initialTime = useMemo(() => {
    if (!picker) return splitTime(0);
    const seconds = picker.target === 'round_duration'
      ? config.round_duration
      : picker.target === 'rest_duration'
        ? config.rest_duration
        : config.warning_seconds;
    return splitTime(seconds);
  }, [picker, config.round_duration, config.rest_duration, config.warning_seconds]);

  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [seconds, setSeconds] = useState(initialTime.seconds);
  const [rounds, setRounds] = useState(config.rounds);
  const [warningSeconds, setWarningSeconds] = useState(config.warning_seconds);

  useEffect(() => {
    setHours(initialTime.hours);
    setMinutes(initialTime.minutes);
    setSeconds(initialTime.seconds);
    setRounds(config.rounds);
    setWarningSeconds(config.warning_seconds);
  }, [initialTime.hours, initialTime.minutes, initialTime.seconds, config.rounds, config.warning_seconds]);

  if (!picker) return null;

  const isRoundPicker = picker.target === 'rounds';
  const isWarningPicker = picker.target === 'warning_seconds';

  const handleApply = () => {
    if (picker.target === 'rounds') {
      onApply({ rounds });
      return;
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (picker.target === 'round_duration') {
      onApply({ round_duration: clamp(totalSeconds, 5, 18000) });
      return;
    }

    if (picker.target === 'rest_duration') {
      onApply({ rest_duration: clamp(totalSeconds, 0, 3600) });
      return;
    }

    onApply({ warning_seconds: warningSeconds });
  };

  const preview = isRoundPicker ? `${rounds}` : formatDuration(isWarningPicker ? warningSeconds : hours * 3600 + minutes * 60 + seconds);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1" style={{ backgroundColor: picker.accent }}>
        <View className="flex-1 px-6">
          <View className="flex-row items-center justify-between pt-3">
            <TouchableOpacity onPress={onClose} className="w-12 h-12 rounded-full bg-white/15 items-center justify-center">
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} className="px-5 h-12 rounded-full bg-white items-center justify-center">
              <Text className="text-[#0A0A0A] font-black">Listo</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white text-4xl font-black tracking-tight mt-16">{picker.title}</Text>
          <Text className="text-white/75 text-base font-semibold mt-2">Selecciona el valor con la rueda</Text>

          <View className="flex-1 justify-center">
            <View className="items-center mb-10">
              <Text className="text-white/60 text-xs font-black uppercase tracking-widest">Valor actual</Text>
              <Text className="text-white text-6xl font-black font-mono mt-2">{preview}</Text>
            </View>

            <View className="flex-row items-center rounded-[32px] px-2 py-5" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}>
              {isRoundPicker ? (
                <WheelColumn values={roundValues} selected={rounds} label="rondas" onSelect={setRounds} />
              ) : isWarningPicker ? (
                <WheelColumn values={warningValues} selected={warningSeconds} label="seg" onSelect={setWarningSeconds} />
              ) : (
                <>
                  <WheelColumn values={hourValues} selected={hours} label="horas" onSelect={setHours} />
                  <WheelColumn values={minuteValues} selected={minutes} label="min" onSelect={setMinutes} />
                  <WheelColumn values={secondValues} selected={secondValues.includes(seconds) ? seconds : 0} label="seg" onSelect={setSeconds} />
                </>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function TimerConfig({ config, onChange, disabled, activeTab, onTabChange }: TimerConfigProps) {
  const [picker, setPicker] = useState<PickerState | null>(null);

  if (disabled) return null;

  const openPicker = (target: PickerTarget, title: string, accent: string) => {
    setPicker({ target, title, accent });
  };

  const handleApply = (nextConfig: Partial<TimerConfigType>) => {
    setPicker(null);
    onChange(nextConfig);
  };

  return (
    <View>
      <View className="flex-row bg-[#1A1A1A] rounded-full p-1 mb-5 border border-[#242424]">
        <Pressable
          onPress={() => onTabChange('new')}
          className={`flex-1 rounded-full py-3 items-center ${activeTab === 'new' ? 'bg-[#F5F5F5]' : ''}`}
        >
          <Text className={`font-black ${activeTab === 'new' ? 'text-[#0A0A0A]' : 'text-[#888888]'}`}>Nuevo timer</Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange('saved')}
          className={`flex-1 rounded-full py-3 items-center ${activeTab === 'saved' ? 'bg-[#F5F5F5]' : ''}`}
        >
          <Text className={`font-black ${activeTab === 'saved' ? 'text-[#0A0A0A]' : 'text-[#888888]'}`}>Mis timers</Text>
        </Pressable>
      </View>

      {activeTab === 'new' && (
        <View className="gap-3">
          <ConfigRow
            label="Trabajo"
            value={formatDuration(config.round_duration)}
            icon="play"
            accent="#35D66B"
            onPress={() => openPicker('round_duration', 'Trabajo', '#35D66B')}
          />
          <ConfigRow
            label="Descanso"
            value={formatDuration(config.rest_duration)}
            icon="pause"
            accent="#FF2F67"
            onPress={() => openPicker('rest_duration', 'Descanso', '#FF2F67')}
          />
          <ConfigRow
            label="Rondas"
            value={`${config.rounds}`}
            icon="sync"
            accent="#6C63FF"
            onPress={() => openPicker('rounds', 'Rondas', '#6C63FF')}
          />
          <ConfigRow
            label="Aviso final"
            value={formatDuration(config.warning_seconds)}
            icon="alarm"
            accent="#19C8D1"
            onPress={() => openPicker('warning_seconds', 'Aviso final', '#19C8D1')}
          />
        </View>
      )}

      <TimerPickerModal picker={picker} config={config} onClose={() => setPicker(null)} onApply={handleApply} />
    </View>
  );
}
