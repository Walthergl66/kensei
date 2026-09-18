import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface SessionSaveSheetProps {
  onSave: (rating: number, notes: string) => Promise<boolean>;
  onDiscard: () => void;
  saving?: boolean;
}

export default function SessionSaveSheet({ onSave, onDiscard, saving: externalSaving }: SessionSaveSheetProps) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSaving = saving || externalSaving;

  async function handleSave() {
    setSaving(true);
    const success = await onSave(rating, notes);
    setSaving(false);
    if (success) setSaved(true);
  }

  if (saved) {
    return (
      <View className="items-center py-8">
        <View className="w-16 h-16 rounded-full bg-[#4CAF50]/20 items-center justify-center mb-4">
          <Text className="text-3xl text-[#4CAF50]">✓</Text>
        </View>
        <Text className="text-[#4CAF50] text-lg font-bold">Entrenamiento guardado</Text>
        <TouchableOpacity
          onPress={onDiscard}
          className="mt-6 px-8 py-3 rounded-xl bg-[#E8C547] items-center"
        >
          <Text className="text-[#0A0A0A] font-bold">Listo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-[#141414] rounded-xl p-6 border border-[#2A2A2A] mx-4 mb-4">
      <Text className="text-[#F5F5F5] text-lg font-bold mb-4 text-center">Entrenamiento completado</Text>

      <Text className="text-[#888888] text-sm mb-2 text-center">¿Cómo fue tu entrenamiento?</Text>
      <View className="flex-row justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={isSaving}>
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
        editable={!isSaving}
      />

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onDiscard}
          className="flex-1 py-3 rounded-xl border border-[#2A2A2A] items-center"
          disabled={isSaving}
        >
          <Text className="text-[#888888] font-semibold">Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 py-3 rounded-xl bg-[#E8C547] items-center flex-row justify-center"
          disabled={isSaving}
        >
          {isSaving && <ActivityIndicator size="small" color="#0A0A0A" className="mr-2" />}
          <Text className="text-[#0A0A0A] font-bold">{isSaving ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
