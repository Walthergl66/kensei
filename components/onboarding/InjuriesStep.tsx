import { View, Text, TextInput } from 'react-native';

interface InjuriesStepProps {
  value: string;
  onChange: (text: string) => void;
}

export default function InjuriesStep({ value, onChange }: InjuriesStepProps) {
  return (
    <View>
      <Text className="text-[#F5F5F5] text-lg font-bold mb-2">¿Tienes alguna lesión o limitación física?</Text>
      <Text className="text-[#888888] text-sm mb-4">Opcional. Esto ayuda a adaptar tu plan de entrenamiento.</Text>
      <TextInput
        className="bg-[#141414] text-[#F5F5F5] rounded-xl p-4 border border-[#2A2A2A] min-h-[100px]"
        placeholder="Ej: Lesión en hombro derecho, problemas de rodilla..."
        placeholderTextColor="#888888"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}
