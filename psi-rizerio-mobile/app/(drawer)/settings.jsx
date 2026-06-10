import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '../../components/ui/icon-symbol';
import { CustomAlert } from '../../components/CustomAlert';
import { PhotoPicker } from '../../components/ui/PhotoPicker';
import { ChangePasswordModal } from '../../components/ui/ChangePasswordModal';
import { getDrawerColorForRole } from '../../constants/role-theme';
import { getCurrentSession, updateCurrentUser } from '../../services/authService';
import { atualizarMeuPaciente, getMeuPaciente } from '../../services/dashboardService';
import { maskDate, maskCPF } from '../../utils/masks';

// Paleta clara fixa (todo o app usa tema claro).
const C = {
  bg: '#f2f3f7',
  card: '#ffffff',
  border: '#e2e8f0',
  label: '#0f172a',
  value: '#475569',
  placeholder: '#94a3b8',
};

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
  const session = getCurrentSession();
  const accent = getDrawerColorForRole(session?.usuario?.role || session?.usuario?.fkRoles);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [pwdVisible, setPwdVisible] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    const roleName = String(session?.usuario?.role?.role || session?.usuario?.role || '').toUpperCase();
    if (roleName !== 'USER' && roleName !== 'CLIENTE') {
      setLoading(false);
      return () => { mounted = false; };
    }
    (async () => {
      try {
        const data = await getMeuPaciente(session?.usuario?.id);
        if (!mounted) return;
        setPatient(data);
        setForm(toForm(data));
      } catch (_e) {
        if (mounted) setAlert({ visible: true, title: 'Erro', message: 'Não foi possível carregar seu perfil.' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [session?.usuario?.id]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!patient?.id) return;
    setSaving(true);
    try {
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!form) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ textAlign: 'center', paddingHorizontal: 24, color: C.value }}>
          Esta tela exibe as informações pessoais do paciente.
        </Text>
      </View>
    );
  }

  const infoRow = (label, field, mask, keyboardType) => (
    <View key={field} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={styles.input}
          value={form[field]}
          onChangeText={(val) => update(field, mask ? mask(val) : val)}
          placeholder={label}
          placeholderTextColor={C.placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.value}>{form[field] || '—'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho do perfil */}
        <View style={styles.profileCard}>
          <PhotoPicker
            value={form.photo}
            editable={editing}
            size={92}
            shape="circle"
            primaryColor={accent}
            onChange={(uri) => update('photo', uri)}
            onError={(reason) => setAlert({ visible: true, title: 'Foto', message: reason })}
          />
          <Text style={styles.profileName}>{form.name || 'Paciente'}</Text>
          <Text style={styles.profileEmail}>{form.email}</Text>
          {editing ? (
            <Text style={styles.photoHint}>Toque na foto para usar a câmera ou a galeria</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: editing ? '#16a34a' : accent }]}
            onPress={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <IconSymbol name={editing ? 'checkmark' : 'pencil'} size={15} color="#FFF" />
                <Text style={styles.editButtonText}>{editing ? 'Salvar alterações' : 'Editar perfil'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Dados pessoais */}
        <Text style={styles.sectionTitle}>Dados pessoais</Text>
        <View style={styles.card}>
          {infoRow('Nome', 'name')}
          {infoRow('Email', 'email', undefined, 'email-address')}
          {infoRow('Data de Nascimento', 'birthDate', maskDate, 'numeric')}
          {infoRow('CPF', 'cpf', maskCPF, 'numeric')}
          {infoRow('Telefone', 'phone', undefined, 'phone-pad')}
          {infoRow('Cidade', 'city')}
          {infoRow('Estado', 'state')}
        </View>

        {/* Contato de emergência */}
        <Text style={styles.sectionTitle}>Contato de emergência</Text>
        <View style={styles.card}>
          {infoRow('Nome', 'emergencyContact')}
          {infoRow('Telefone de emergência', 'emergencyPhone', undefined, 'phone-pad')}
        </View>

        <TouchableOpacity
          style={[styles.passwordButton, { borderColor: accent }]}
          onPress={() => setPwdVisible(true)}
        >
          <IconSymbol name="lock" size={18} color={accent} />
          <Text style={[styles.passwordButtonText, { color: accent }]}>Alterar Senha</Text>
        </TouchableOpacity>

        <ChangePasswordModal
          visible={pwdVisible}
          accent={accent}
          onClose={() => setPwdVisible(false)}
          onSuccess={() => {
            setPwdVisible(false);
            setAlert({ visible: true, title: 'Sucesso', message: 'Sua senha foi alterada com sucesso!' });
          }}
        />

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert((p) => ({ ...p, visible: false }))}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  profileName: { fontSize: 20, fontWeight: '800', color: C.label, marginTop: 12 },
  profileEmail: { fontSize: 14, color: C.value, marginTop: 2 },
  photoHint: { fontSize: 12, color: C.placeholder, marginTop: 8, textAlign: 'center' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 16,
  },
  editButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.value,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  label: { fontSize: 13, fontWeight: '700', color: C.label, marginBottom: 3 },
  value: { fontSize: 16, color: C.value },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: C.label,
    backgroundColor: '#f8fafc',
    marginTop: 2,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: C.card,
    marginTop: 4,
  },
  passwordButtonText: { fontWeight: '800', fontSize: 16 },
});
