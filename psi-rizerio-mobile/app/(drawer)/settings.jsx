import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { CustomAlert } from '../../components/CustomAlert';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentSession } from '../../services/authService';
import { getPacientePorUserId, putPaciente } from '../../services/dashboardService';
import { maskCPF, maskDate, maskPhone } from '../../utils/masks';

const EMPTY_PROFILE = {
  name: '',
  email: '',
  birthDate: '',
  cpf: '',
  phone: '',
  city: '',
  emergencyContact: {
    name: '',
    phone: '',
  },
  consultation: {
    preferredDays: '',
    preferredTimes: '',
    reason: '',
  },
};

const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_BR_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

function formatBirthDateForDisplay(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (DATE_BR_REGEX.test(raw)) {
    return raw;
  }

  if (DATE_ISO_REGEX.test(raw)) {
    const [year, month, day] = raw.split('-');
    return `${day}/${month}/${year}`;
  }

  return maskDate(raw);
}

function getValidationErrors(sectionId, data) {
  const errors = {};

  if (sectionId === 'personal') {
    if (!String(data?.name || '').trim()) {
      errors.name = 'Informe o nome completo.';
    }

    const email = String(data?.email || '').trim();
    if (!email) {
      errors.email = 'Informe o e-mail.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Informe um e-mail válido.';
    }

    const birthDate = String(data?.birthDate || '').trim();
    if (birthDate && !DATE_BR_REGEX.test(birthDate) && !DATE_ISO_REGEX.test(birthDate)) {
      errors.birthDate = 'Use o formato dd/mm/aaaa.';
    }

    const cpfDigits = String(data?.cpf || '').replace(/\D/g, '');
    if (cpfDigits && cpfDigits.length !== 11) {
      errors.cpf = 'CPF deve ter 11 dígitos.';
    }

    const phoneDigits = String(data?.phone || '').replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length < 10) {
      errors.phone = 'Telefone inválido.';
    }
  }

  if (sectionId === 'emergency') {
    const emergencyPhoneDigits = String(data?.emergencyContact?.phone || '').replace(/\D/g, '');
    if (emergencyPhoneDigits && emergencyPhoneDigits.length < 10) {
      errors['emergencyContact.phone'] = 'Telefone de emergência inválido.';
    }
  }

  return errors;
}

// Componentes extraídos para fora para evitar perda de foco durante a digitação
const Section = ({ id, title, children, showEdit, isEditing, colors, onEditToggle }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {showEdit && (
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: isEditing ? '#4CAF50' : colors.primary }]} 
            onPress={() => onEditToggle(id)}
          >
            <IconSymbol name={isEditing ? "checkmark" : "pencil"} size={14} color="#FFF" />
            <ThemedText style={styles.editButtonText}>{isEditing ? "Salvar" : "Editar"}</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

const InfoRow = ({ sectionId, label, value, field, subfield, editingSection, updateField, colors, keyboardType, errorText }) => {
  const isEditing = editingSection === sectionId;
  
  return (
    <View style={styles.infoRowContainer}>
      <ThemedText style={styles.rowLabel}>{label}:</ThemedText>
      {isEditing ? (
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
          value={value}
          onChangeText={(val) => updateField(field, val, subfield)}
          placeholder={label}
          placeholderTextColor="#999"
          keyboardType={keyboardType || 'default'}
        />
      ) : (
        <ThemedText style={[styles.rowValue, { color: colors.textSecondary }]}>{value || '—'}</ThemedText>
      )}
      {!!errorText && <ThemedText style={styles.errorText}>{errorText}</ThemedText>}
    </View>
  );
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [patientId, setPatientId] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      const session = getCurrentSession();
      const baseProfile = {
        ...EMPTY_PROFILE,
        name: session?.usuario?.nome || session?.usuario?.name || '',
        email: session?.usuario?.email || '',
      };

      if (session?.usuario?.role?.role === 'CLIENTE' || session?.usuario?.role === 'USER' || session?.usuario?.role === 'CLIENTE') {
        try {
          const patient = await getPacientePorUserId(session?.usuario?.id);
          if (patient) {
            setPatientId(patient.id);
            setBase64Photo(patient.photo || null);
            setProfileData({
              ...baseProfile,
              name: patient.nomeCompleto || patient.nome || baseProfile.name,
              email: patient.email || baseProfile.email,
              birthDate: formatBirthDateForDisplay(patient.birthDate),
              cpf: maskCPF(String(patient.cpf || '')),
              phone: maskPhone(String(patient.telefone || '')),
              city: patient.endereco?.cidade || '',
              emergencyContact: {
                name: patient.dadosPaciente?.contatoEmergencia || '',
                phone: maskPhone(String(patient.dadosPaciente?.telefoneEmergencia || '')),
              },
              consultation: {
                preferredDays: patient.dadosPaciente?.diaConsultas || '',
                preferredTimes: patient.dadosPaciente?.horarioConsultas || '',
                reason: patient.clinicalNotes || '',
              },
            });
            return;
          }
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
        }
      }

      setProfileData(baseProfile);
    };

    load();
  }, []);

  const handleEditToggle = async (sectionId) => {
    if (editingSection === sectionId) {
      const errors = getValidationErrors(sectionId, profileData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      if (patientId) {
        try {
          const nomeParts = profileData.name.trim().split(' ');
          await putPaciente(patientId, {
            ...profileData,
            dadosPaciente: {
              nome: nomeParts[0] || '',
              sobrenome: nomeParts.slice(1).join(' ') || '',
              email: profileData.email,
              contatoEmergencia: profileData.emergencyContact.name,
              telefoneEmergencia: profileData.emergencyContact.phone,
              diaConsultas: profileData.consultation.preferredDays,
              horarioConsultas: profileData.consultation.preferredTimes,
            },
            endereco: {
              cidade: profileData.city,
            },
            reason: profileData.consultation.reason,
            photo: base64Photo || '',
          });
          setFieldErrors({});
          setAlertVisible(true);
          setEditingSection(null);
        } catch(error) {
          alert("Erro ao salvar: " + error.message);
        }
      } else {
        setAlertVisible(true);
        setEditingSection(null);
      }
    } else {
      setEditingSection(sectionId);
      setFieldErrors({});
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        const sizeInBytes = (asset.base64.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        if (sizeInMB > 4) {
          alert("A imagem selecionada possui mais de 4MB. Por favor, escolha uma imagem menor.");
          return;
        }
        const b64 = 'data:image/jpeg;base64,' + asset.base64;
        setBase64Photo(b64);
        if (patientId) {
          try {
             await putPaciente(patientId, {
               ...profileData,
               photo: b64,
             });
             setAlertVisible(true);
          } catch(e) {
             alert("Erro ao salvar a foto: " + e.message);
          }
        }
      }
    }
  };

  const handleRemovePhoto = async () => {
    setBase64Photo(null);
    if (patientId) {
      try {
         await putPaciente(patientId, {
           ...profileData,
           photo: '',
         });
         setAlertVisible(true);
      } catch(e) {
         alert("Erro ao remover a foto: " + e.message);
      }
    }
  };

  const updateField = (field, value, subfield) => {
    let nextValue = value;

    if (field === 'birthDate') {
      nextValue = maskDate(value);
    }

    if (field === 'cpf') {
      nextValue = maskCPF(value);
    }

    if (field === 'phone' || (field === 'emergencyContact' && subfield === 'phone')) {
      nextValue = maskPhone(value);
    }

    const errorKey = subfield ? `${field}.${subfield}` : field;
    setFieldErrors((prev) => {
      if (!prev[errorKey]) {
        return prev;
      }

      const next = { ...prev };
      delete next[errorKey];
      return next;
    });

    setProfileData(prev => {
      if (subfield) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subfield]: nextValue
          }
        };
      }
      return { ...prev, [field]: nextValue };
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Section 
          id="personal" 
          title="Informações pessoais" 
          showEdit 
          isEditing={editingSection === 'personal'}
          colors={colors}
          onEditToggle={handleEditToggle}
        >
          <View style={styles.profileRow}>
            <Image 
              source={base64Photo ? { uri: base64Photo } : require('../../assets/images/icon.png')} 
              style={styles.avatarPlaceholder} 
            />
            <View style={styles.avatarActions}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.purpleLight }]} onPress={handlePickImage}>
                <IconSymbol name="square.and.arrow.up" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Carregar foto</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleRemovePhoto}>
                <IconSymbol name="trash" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Remover foto</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <InfoRow sectionId="personal" label="Nome" value={profileData.name} field="name" editingSection={editingSection} updateField={updateField} colors={colors} errorText={fieldErrors.name} />
          <InfoRow sectionId="personal" label="Email" value={profileData.email} field="email" editingSection={editingSection} updateField={updateField} colors={colors} keyboardType="email-address" errorText={fieldErrors.email} />
          <InfoRow sectionId="personal" label="Data de Nascimento" value={profileData.birthDate} field="birthDate" editingSection={editingSection} updateField={updateField} colors={colors} keyboardType="numeric" errorText={fieldErrors.birthDate} />
          <InfoRow sectionId="personal" label="CPF" value={profileData.cpf} field="cpf" editingSection={editingSection} updateField={updateField} colors={colors} keyboardType="numeric" errorText={fieldErrors.cpf} />
          <InfoRow sectionId="personal" label="Telefone" value={profileData.phone} field="phone" editingSection={editingSection} updateField={updateField} colors={colors} keyboardType="phone-pad" errorText={fieldErrors.phone} />
          <InfoRow sectionId="personal" label="Cidade" value={profileData.city} field="city" editingSection={editingSection} updateField={updateField} colors={colors} errorText={fieldErrors.city} />
        </Section>
 
        <Section 
          id="emergency" 
          title="Contato de emergência" 
          showEdit 
          isEditing={editingSection === 'emergency'}
          colors={colors}
          onEditToggle={handleEditToggle}
        >
          <InfoRow sectionId="emergency" label="Nome" value={profileData.emergencyContact.name} field="emergencyContact" subfield="name" editingSection={editingSection} updateField={updateField} colors={colors} />
          <InfoRow sectionId="emergency" label="Telefone de emergência" value={profileData.emergencyContact.phone} field="emergencyContact" subfield="phone" editingSection={editingSection} updateField={updateField} colors={colors} keyboardType="phone-pad" errorText={fieldErrors['emergencyContact.phone']} />
        </Section>
 
        <Section 
          id="consultation" 
          title="Consulta" 
          showEdit 
          isEditing={editingSection === 'consultation'}
          colors={colors}
          onEditToggle={handleEditToggle}
        >
          <InfoRow sectionId="consultation" label="Dias ideais para consultas" value={profileData.consultation.preferredDays} field="consultation" subfield="preferredDays" editingSection={editingSection} updateField={updateField} colors={colors} />
          <InfoRow sectionId="consultation" label="Horários ideais para consultas" value={profileData.consultation.preferredTimes} field="consultation" subfield="preferredTimes" editingSection={editingSection} updateField={updateField} colors={colors} />
          <ThemedText style={[styles.rowLabel, { marginTop: 10 }]}>Motivo de consulta:</ThemedText>
          {editingSection === 'consultation' ? (
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.primary }]}
              value={profileData.consultation.reason}
              onChangeText={(val) => updateField('consultation', val, 'reason')}
              multiline
              numberOfLines={4}
            />
          ) : (
            <ThemedText style={[styles.longValue, { color: colors.textSecondary }]}>
              {profileData.consultation.reason || '—'}
            </ThemedText>
          )}
        </Section>

        <TouchableOpacity 
          style={[styles.passwordButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/change-password')}
        >
          <IconSymbol name="lock" size={18} color="#FFF" />
          <ThemedText style={styles.passwordButtonText}>Alterar Senha</ThemedText>
        </TouchableOpacity>

        <CustomAlert 
          visible={alertVisible}
          title="Salvo"
          message="Suas alterações foram salvas com sucesso!"
          onClose={() => setAlertVisible(false)}
        />

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  avatarActions: {
    marginLeft: 20,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  infoRowContainer: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rowValue: {
    fontWeight: '300',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginTop: 2,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  longValue: {
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 22,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  passwordButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
