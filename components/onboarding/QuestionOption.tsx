import { TouchableOpacity, Text } from 'react-native';

interface QuestionOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export default function QuestionOption({ label, description, selected, onSelect }: QuestionOptionProps) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`p-5 rounded-2xl border mb-3 ${
        selected
          ? 'bg-[#E8C547]/10 border-[#E8C547]'
          : 'bg-[#141414] border-[#1E1E1E]'
      }`}
      activeOpacity={0.8}
    >
      <Text className={`text-base font-semibold ${selected ? 'text-[#E8C547]' : 'text-[#F5F5F5]'}`}>
        {label}
      </Text>
      {description && (
        <Text className={`text-xs mt-1.5 ${selected ? 'text-[#E8C547]/70' : 'text-[#666666]'}`}>
          {description}
        </Text>
      )}
    </TouchableOpacity>
  );
}
