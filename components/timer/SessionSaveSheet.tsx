import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

interface SessionSaveSheetProps {
  onSave: (rating: number, notes: string) => void;
  onDiscard: () => void;
  saving?: boolean;
}

export default function SessionSaveSheet({ onSave, onDiscard, saving }: SessionSaveSheetProps) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <View className="items-center py-8">
        <Text className="text-5xl mb-4">✓</Text>
        <Text className="text-[#4CAF50] text-lg font-bold">Entrenamiento guardado</Text>
      </View>
    );
  }

  return (
    <View className="bg-[#141414] rounded-xl p-6 border border-[#2A2A2A] mx-4 mb-4">
      <Text className="text-[#F5F5F5] text-lg font-bold mb-4 text-center">Entrenamiento completado</Text>

      <Text className="text-[#888888] text-sm mb-2 text-center">¿Cómo fue tu entrenamiento?</Text>
      <View className="flex-row justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text className={`text-3xl ${star <= rating ? 'text-[#E8C547]' : 'text-[#2A2A2A]'}`}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        className="bg-[#0A0A0A] text-[#F5F5F5] rounded-lg p-3 mb-4 border border-[#2A2A2A]"
        placeholder="Notas opcionales..."
        placeholderTextColor="#888888"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onDiscard}
          className="flex-1 py-3 rounded-xl border border-[#2A2A2A] items-center"
          disabled={saving}
        >
          <Text className="text-[#888888] font-semibold">Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { onSave(rating, notes); setSaved(true); }}
          className="flex-1 py-3 rounded-xl bg-[#E8C547] items-center"
          disabled={saving}
        >
          <Text className="text-[#0A0A0A] font-bold">{saving ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
