import { View, Text } from 'react-native';
import { useLanguage } from '../src/shared/store/LanguageContext';

export default function SettingsScreen() {
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{t('settings.title')}</Text>
    </View>
  );
}
