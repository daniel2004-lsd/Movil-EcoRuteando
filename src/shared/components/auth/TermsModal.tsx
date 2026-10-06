import {
  Modal, View, Text, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';

const TERMS = [
  { title: '1. Aceptación de los Términos', body: 'Al registrarse y utilizar los servicios de EcoRuteando, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos aquí establecidos, le recomendamos no hacer uso de la plataforma.' },
  { title: '2. Descripción del Servicio', body: 'EcoRuteando es una plataforma de movilidad sostenible desarrollada en el marco del programa de Desarrollo de Software del SENA, sede Neiva, Colombia. Su propósito es facilitar la planificación de rutas ecológicas eficientes, promoviendo la reducción de la huella de carbono en entornos urbanos.' },
  { title: '3. Registro de Usuario', body: 'Para acceder a las funcionalidades completas de la plataforma, el usuario deberá crear una cuenta con información veraz, completa y actualizada. EcoRuteando se reserva el derecho de suspender o eliminar cuentas que contengan datos falsos o que infrinjan estos términos. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.' },
  { title: '4. Uso Aceptable', body: 'El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y de acuerdo con su propósito. Queda expresamente prohibido: compartir contenido ofensivo, usar la plataforma para actividades ilegales, intentar vulnerar la seguridad del sistema, suplantar la identidad de otros usuarios o de EcoRuteando, y realizar acciones que puedan afectar el rendimiento de la plataforma.' },
  { title: '5. Privacidad y Protección de Datos', body: 'EcoRuteando recopila y trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 (Ley de Protección de Datos Personales de Colombia) y sus decretos reglamentarios. Los datos recopilados se utilizan exclusivamente para la prestación del servicio, la mejora de la plataforma y el envío de comunicaciones relacionadas, siempre con el consentimiento previo del usuario.' },
  { title: '6. Información de Rutas y Disponibilidad', body: 'La información sobre rutas y tiempos de trayecto es referencial y puede variar en función de las condiciones locales. EcoRuteando no se hace responsable por retrasos, cambios de ruta o información desactualizada.' },
  { title: '7. Propiedad Intelectual', body: 'Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo su diseño, código fuente, logotipos y contenidos, pertenecen al equipo de desarrollo de EcoRuteando. Queda prohibida su reproducción, modificación o distribución sin autorización expresa y por escrito.' },
  { title: '8. Modificaciones al Servicio', body: 'EcoRuteando se reserva el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso. Asimismo, estos Términos y Condiciones pueden ser actualizados periódicamente; los cambios entrarán en vigor en el momento de su publicación en la plataforma.' },
  { title: '9. Limitación de Responsabilidad', body: 'EcoRuteando no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma, incluyendo pérdidas de datos, interrupciones del servicio o inexactitudes en la información de rutas.' },
  { title: '10. Ley Aplicable y Jurisdicción', body: 'Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa derivada de su interpretación o aplicación será resuelta ante los tribunales competentes de la ciudad de Neiva, Huila, Colombia.' },
  { title: '11. Contacto', body: 'Para consultas relacionadas con estos términos, el usuario puede comunicarse a través de los canales oficiales de EcoRuteando disponibles en la plataforma.' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ visible, onClose, onAccept }: Props) {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setHasScrolled(true);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.box}>

          <LinearGradient colors={['#1a3d2b', '#2c5f3f']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.headerIcon}>
              <Text style={{ fontSize: 22 }}>📋</Text>
            </View>
            <Text style={s.headerTitle}>Términos y Condiciones</Text>
            <Text style={s.headerSub}>EcoRuteando · Última actualización: enero 2025</Text>
            <TouchableOpacity style={s.closeX} onPress={onClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          {!hasScrolled && (
            <View style={s.hint}>
              <Ionicons name="hand-right-outline" size={15} color={colors.ecoMain} />
              <Text style={s.hintText}>Desplázate hasta el final para poder aceptar</Text>
            </View>
          )}

          <ScrollView style={s.scroll} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator>
            {TERMS.map((item, i) => (
              <View key={i} style={s.section}>
                <View style={s.titleRow}>
                  <View style={s.dot} />
                  <Text style={s.sectionTitle}>{item.title}</Text>
                </View>
                <Text style={s.sectionBody}>{item.body}</Text>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.btnClose} onPress={onClose}>
              <Text style={s.btnCloseText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnAccept, !hasScrolled && s.btnDisabled]}
              onPress={hasScrolled ? onAccept : undefined}
              activeOpacity={hasScrolled ? 0.85 : 1}
            >
              <LinearGradient
                colors={hasScrolled ? ['#2c5f3f', '#4a8f65'] : ['#b0b0b0', '#c8c8c8']}
                style={s.btnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name={hasScrolled ? 'checkmark-circle' : 'lock-closed'} size={16} color="#fff" />
                <Text style={s.btnAcceptText}>{hasScrolled ? 'Acepto los términos' : 'Lee hasta el final'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  box: { width: '100%', maxWidth: 360, maxHeight: '80%', backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  header: { padding: spacing.lg, alignItems: 'center', position: 'relative' },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: '#fff', textAlign: 'center' },
  headerSub: { fontFamily: fonts.serif, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, textAlign: 'center' },
  closeX: { position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#edf7f1', paddingHorizontal: spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#dde8e1' },
  hintText: { fontFamily: fonts.serif, fontSize: 11, color: colors.ecoMain, flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  section: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ecoMain },
  sectionTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: colors.ecoDark },
  sectionBody: { fontFamily: fonts.serif, fontSize: 12, color: '#666', lineHeight: 18, paddingLeft: 12 },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: '#e8ede9' },
  btnClose: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#dde8e1', alignItems: 'center', justifyContent: 'center' },
  btnCloseText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#888' },
  btnAccept: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  btnAcceptText: { fontFamily: fonts.serifBold, fontSize: 13, color: '#fff' },
  btnDisabled: { opacity: 0.85 },
});