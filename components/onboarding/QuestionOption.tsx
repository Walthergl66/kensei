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
      className={`p-4 rounded-xl border mb-3 ${selected ? 'bg-[#E8C547]/10 border-[#E8C547]' : 'bg-[#141414] border-[#2A2A2A]'}`}
      activeOpacity={0.7}
    >
      <Text className={`text-base font-semibold ${selected ? 'text-[#E8C547]' : 'text-[#F5F5F5]'}`}>{label}</Text>
      {description && <Text className="text-[#888888] text-xs mt-1">{description}</Text>}
    </TouchableOpacity>
  );
}
