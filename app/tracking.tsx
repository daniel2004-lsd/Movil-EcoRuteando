import { View, Text } from 'react-native';
import { useLanguage } from '../src/shared/store/LanguageContext';

export default function TrackingScreen() {
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{t('tracking.title')}</Text>
    </View>
  );
}
