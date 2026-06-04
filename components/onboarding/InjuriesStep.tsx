import { View, Text, TextInput } from 'react-native';

interface InjuriesStepProps {
  value: string;
  onChange: (text: string) => void;
}

export default function InjuriesStep({ value, onChange }: InjuriesStepProps) {
  return (
    <View>
      <Text className="text-[#F5F5F5] text-xl font-bold mb-2 tracking-tight">
        Tienes alguna lesion o limitacion fisica?
      </Text>
      <Text className="text-[#666666] text-sm mb-6 leading-5">
        Opcional. Esto ayuda a adaptar tu plan de entrenamiento.
      </Text>
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-2xl p-5 border border-[#1E1E1E] min-h-[120px] text-base leading-6"
        placeholder="Ej: Lesion en hombro derecho, problemas de rodilla..."
        placeholderTextColor="#555555"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}
