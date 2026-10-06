// app/(auth)/recover.tsx — igual que web Recover.jsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import apiClient from '../../src/shared/services/apiClient';

export default function RecoverScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const validateEmail = (v:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const handleSend = async () => {
    if (!validateEmail(email)) { setError('Ingresa un correo electrónico válido.'); return; }
    setError(''); setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err:any) {
      if (err.response?.status===429) setError('Demasiadas solicitudes. Espera unos minutos.');
      else setError(err.response?.data?.message || 'No fue posible enviar el código.');
    } finally { setLoading(false); }
  };
  if (sent) {
    return (
      <LinearGradient colors={isDark ? ['#0B1215','#111C20'] : ['#ecfdf5','#f0fdf4','#ccfbf1']} style={s.bg}>
        <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark&&s.themeBtnDark]}><Text>{isDark?'☀️':'🌙'}</Text></TouchableOpacity>
        <ScrollView contentContainerStyle={s.scrollCenter}>
          <View style={s.logoWrap}><View style={[s.logoBox, isDark&&s.logoBoxDark]}><Text style={s.logoIcon}>🌿</Text></View><Text style={[s.appName, isDark&&{color:'#e2e8f0'}]}>EcoRuteando</Text></View>
          <View style={[s.iconCircle, isDark&&{backgroundColor:'#064e3b'}]}><Ionicons name="mail" size={32} color={isDark?'#34D399':'#059669'} /></View>
          <Text style={[s.title, isDark&&{color:'#e2e8f0'}]}>Revisa tu correo</Text>
          <Text style={[s.sub, isDark&&{color:'#94a3b8'}]}>Hemos enviado un código de verificación a:</Text>
          <Text style={[s.emailText, isDark&&{color:'#e2e8f0'}]}>{email}</Text>
          <TouchableOpacity onPress={()=>router.push({pathname:'/(auth)/recover-code', params:{email}})} style={s.primaryBtn}><Text style={s.primaryText}>Ya tengo el código →</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setSent(false)}><Text style={[s.link, isDark&&{color:'#34D399'}]}>¿Correo incorrecto? Cambiarlo</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>router.push('/(auth)/login')} style={s.backRow}><Ionicons name="arrow-back" size={14} color={isDark?'#94a3b8':'#6b7280'} /><Text style={[s.backText, isDark&&{color:'#94a3b8'}]}>Volver al inicio de sesión</Text></TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }
  return (
    <LinearGradient colors={isDark ? ['#0B1215','#111C20'] : ['#ecfdf5','#f0fdf4','#ccfbf1']} style={s.bg}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark&&s.themeBtnDark]}><Text>{isDark?'☀️':'🌙'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>router.replace('/')} style={s.backTop}><Ionicons name="arrow-back" size={14} color={isDark?'#94a3b8':'#6b7280'} /><Text style={[s.backTopText, isDark&&{color:'#94a3b8'}]}>Volver</Text></TouchableOpacity>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}><View style={[s.logoBox, isDark&&s.logoBoxDark]}><Text style={s.logoIcon}>🌿</Text></View><Text style={[s.appName, isDark&&{color:'#e2e8f0'}]}>EcoRuteando</Text></View>
          <View style={[s.card, isDark&&s.cardDark]}>
            <Text style={[s.cardTitle, isDark&&{color:'#e2e8f0'}]}>Recuperar contraseña</Text>
            <Text style={[s.cardSub, isDark&&{color:'#94a3b8'}]}>Ingresa tu correo electrónico y te enviaremos un código de verificación de 6 dígitos para restablecer tu contraseña.</Text>
            <Text style={[s.label, isDark&&{color:'#34D399'}]}>Correo electrónico</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="tucorreo@email.com" placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} keyboardType="email-address" autoCapitalize="none" style={[s.input, isDark&&s.inputDark]} />
            {email.length>0 && validateEmail(email) && <Text style={s.okText}>Correo válido</Text>}
            {error ? <Text style={s.errText}>{error}</Text> : null}
            <TouchableOpacity onPress={handleSend} disabled={loading || !validateEmail(email)} style={[s.primaryBtn, (loading || !validateEmail(email)) && {opacity:0.5}]}><Text style={s.primaryText}>{loading?'Enviando código...':'Enviar código'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>router.push('/(auth)/login')} style={s.backRowCenter}><Ionicons name="arrow-back" size={14} color="#059669" /><Text style={s.backGreen}>Volver al inicio de sesión</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  bg:{flex:1},
  themeBtn:{position:'absolute',bottom:24,right:24,zIndex:50,width:48,height:48,borderRadius:24,backgroundColor:'#059669',alignItems:'center',justifyContent:'center'},
  themeBtnDark:{backgroundColor:'#162329',borderWidth:1,borderColor:'#26383D'},
  backTop:{position:'absolute',top:24,right:24,flexDirection:'row',gap:4,alignItems:'center'},
  backTopText:{fontSize:14,color:'#6b7280'},
  scroll:{flexGrow:1,alignItems:'center',padding:16,paddingTop:60},
  scrollCenter:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:16},
  logoWrap:{alignItems:'center',marginBottom:24},
  logoBox:{width:56,height:56,borderRadius:16,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#f3f4f6'},
  logoBoxDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  logoIcon:{fontSize:28},
  appName:{fontSize:24,fontWeight:'700',color:'#047857',marginTop:8},
  card:{width:'100%',maxWidth:384,backgroundColor:'#fff',borderRadius:12,padding:24,borderWidth:1,borderColor:'#f3f4f6',elevation:4},
  cardDark:{backgroundColor:'rgba(22,35,41,0.8)',borderColor:'#26383D'},
  cardTitle:{fontSize:18,fontWeight:'700',textAlign:'center',color:'#1f2937'},
  cardSub:{fontSize:12,textAlign:'center',color:'#6b7280',marginTop:4,lineHeight:18},
  label:{fontSize:12,fontWeight:'500',color:'#4b5563',marginTop:12,marginBottom:4},
  input:{borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,paddingHorizontal:12,paddingVertical:8,fontSize:14,color:'#111827',backgroundColor:'#fff'},
  inputDark:{backgroundColor:'rgba(22,35,41,0.5)',borderColor:'#26383D',color:'#e2e8f0'},
  okText:{fontSize:10,color:'#10b981',marginTop:4},
  errText:{fontSize:12,color:'#dc2626',marginTop:8},
  primaryBtn:{backgroundColor:'#059669',borderRadius:8,paddingVertical:10,alignItems:'center',marginTop:16},
  primaryText:{color:'#fff',fontWeight:'600',fontSize:14},
  backRow:{flexDirection:'row',gap:4,alignItems:'center',justifyContent:'center',marginTop:16},
  backRowCenter:{flexDirection:'row',gap:4,alignItems:'center',justifyContent:'center',marginTop:16},
  backText:{fontSize:12,color:'#94a3b8'},
  backGreen:{fontSize:12,color:'#059669',fontWeight:'600'},
  iconCircle:{width:64,height:64,borderRadius:32,backgroundColor:'#ecfdf5',alignItems:'center',justifyContent:'center',marginBottom:16},
  title:{fontSize:24,fontWeight:'700',color:'#1f2937',textAlign:'center'},
  sub:{fontSize:14,color:'#6b7280',textAlign:'center',marginTop:4},
  emailText:{fontWeight:'700',color:'#1f2937',marginTop:8,fontSize:14},
  link:{fontSize:12,color:'#059669',fontWeight:'600',marginTop:12},
});
