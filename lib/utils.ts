import { Alert } from 'react-native';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDayNameInSpanish(date: Date = new Date()): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getIntensityColor(intensity: 'low' | 'medium' | 'high'): string {
  switch (intensity) {
    case 'low': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'high': return '#F44336';
  }
}

export function getIntensityLabel(intensity: 'low' | 'medium' | 'high'): string {
  switch (intensity) {
    case 'low': return 'Baja';
    case 'medium': return 'Media';
    case 'high': return 'Alta';
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getDisciplineIcon(discipline: string): string {
  const icons: Record<string, string> = { boxing: 'boxing', mma: 'mma', both: 'boxing' };
  return icons[discipline] || 'boxing';
}

export function confirmAction(title: string, message: string, onConfirm: () => void, confirmText: string = 'Eliminar') {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
