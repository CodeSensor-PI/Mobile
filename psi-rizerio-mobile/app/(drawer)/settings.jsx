import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { CustomAlert } from '../../components/CustomAlert';
import { PhotoPicker } from '../../components/ui/PhotoPicker';
import { useRouter } from 'expo-router';
import { getCurrentSession, updateCurrentUser } from '../../services/authService';
import { atualizarMeuPaciente, getMeuPaciente } from '../../services/dashboardService';
import { maskDate, maskCPF } from '../../utils/masks';

// Converte yyyy-mm-dd (backend) <-> dd/mm/aaaa (exibição)
function isoToBr(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
function brToIso(br) {
  if (!br) return null;
  const [d, m, y] = String(br).split('/');
  if (!d || !m || !y || y.length < 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const session = getCurrentSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    let mounted = true;
    const roleName = String(session?.usuario?.role?.role || session?.usuario?.role || '').toUpperCase();
    if (roleName !== 'USER' && roleName !== 'CLIENTE') {
      // Tela de perfil é específica do paciente; demais perfis não carregam dados.
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    (async () => {
      try {
        const userId = session?.usuario?.id;
        const data = await getMeuPaciente(userId);
        if (!mounted) return;
        setPatient(data);
        setForm(toForm(data));
      } catch (_e) {
        if (mounted) {
          setAlert({ visible: true, title: 'Erro', message: 'Não foi possível carregar seu perfil.' });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session?.usuario?.id]);

  const toForm = (d) => ({
    name: d?.name || '',
    email: d?.email || '',
    birthDate: isoToBr(d?.birthDate),
    cpf: d?.cpf || '',
    phone: d?.phone || '',
    city: d?.city || '',
    state: d?.state || '',
    emergencyContact: d?.emergencyContact || '',
    emergencyPhone: d?.emergencyPhone || '',
    photo: d?.photo || null,
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!patient?.id) return;
    setSaving(true);
    try {
      // Envia o objeto completo (mescla com o original) para não apagar campos.
      const payload = {
        ...patient,
        name: form.name,
        email: form.email,
        birthDate: brToIso(form.birthDate),
        cpf: form.cpf || null,
        phone: form.phone,
        city: form.city,
        state: form.state,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
        photo: form.photo,
      };
      const updated = await atualizarMeuPaciente(patient.id, payload);
      setPatient(updated);
      setForm(toForm(updated));
      updateCurrentUser({ nome: updated.name, name: updated.name, isFirstAccess: !updated.cpf });
      setEditing(false);
      setAlert({ visible: true, title: 'Salvo', message: 'Suas informações foram atualizadas com sucesso!' });
    } catch (_e) {
      setAlert({ visible: true, title: 'Erro', message: 'Não foi possível salvar suas informações.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!form) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={{ textAlign: 'center', paddingHorizontal: 24 }}>
          Esta tela exibe as informações pessoais do paciente.
        </ThemedText>
      </ThemedView>
    );
  }

  const InfoRow = ({ label, field, mask, keyboardType }) => (
    <View style={styles.infoRowContainer}>
      <ThemedText style={styles.rowLabel}>{label}:</ThemedText>
      {editing ? (
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
          value={form[field]}
          onChangeText={(val) => update(field, mask ? mask(val) : val)}
          placeholder={label}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
        />
      ) : (
        <ThemedText style={[styles.rowValue, { color: colors.textSecondary }]}>
          {form[field] || '—'}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Informações pessoais</ThemedText>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: editing ? '#4CAF50' : colors.primary }]}
            onPress={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <IconSymbol name={editing ? 'checkmark' : 'pencil'} size={14} color="#FFF" />
                <ThemedText style={styles.editButtonText}>{editing ? 'Salvar' : 'Editar'}</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <PhotoPicker
            value={form.photo}
            editable={editing}
            size={100}
            shape="rounded"
            primaryColor={colors.primary}
            onChange={(uri) => update('photo', uri)}
            onError={(reason) => setAlert({ visible: true, title: 'Foto', message: reason })}
          />
          <View style={styles.photoHint}>
            <ThemedText style={[styles.rowValue, { color: colors.textSecondary }]}>
              {editing
                ? 'Toque na foto para usar a câmera ou escolher da galeria.'
                : 'Ative "Editar" para alterar sua foto.'}
            </ThemedText>
          </View>
        </View>

        <InfoRow label="Nome" field="name" />
        <InfoRow label="Email" field="email" keyboardType="email-address" />
        <InfoRow label="Data de Nascimento" field="birthDate" mask={maskDate} keyboardType="numeric" />
        <InfoRow label="CPF" field="cpf" mask={maskCPF} keyboardType="numeric" />
        <InfoRow label="Telefone" field="phone" keyboardType="phone-pad" />
        <InfoRow label="Cidade" field="city" />
        <InfoRow label="Estado" field="state" />

        <ThemedText style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15 }]}>
          Contato de emergência
        </ThemedText>
        <InfoRow label="Nome" field="emergencyContact" />
        <InfoRow label="Telefone de emergência" field="emergencyPhone" keyboardType="phone-pad" />

        <TouchableOpacity
          style={[styles.passwordButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/change-password')}
        >
          <IconSymbol name="lock" size={18} color="#FFF" />
          <ThemedText style={styles.passwordButtonText}>Alterar Senha</ThemedText>
        </TouchableOpacity>

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 22, fontWeight: 'bold' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  editButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  profileRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  photoHint: { marginLeft: 20, flex: 1 },
  infoRowContainer: { marginBottom: 10 },
  rowLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  rowValue: { fontWeight: '300', fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 16, marginTop: 2 },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
  },
  passwordButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
