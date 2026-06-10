import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from './../../hooks/use-color-scheme';
import * as Location from 'expo-location';
import { ThemedText } from './../../components/themed-text';
import { ThemedView } from './../../components/themed-view';
import { Colors } from './../../constants/theme';
import { IconSymbol } from './../../components/ui/icon-symbol';
import { CustomAlert } from './../../components/CustomAlert';
import { useLocalSearchParams } from 'expo-router';
import { getCurrentSession } from './../../services/authService';
import { getAgendamentosPorPaciente, getFeedbacksPaciente, getMeuPaciente, postFeedback } from './../../services/dashboardService';

const WEEKDAYS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

function describeSession(sessao) {
  const iso = sessao?.startTime ? String(sessao.startTime) : '';
  const datePart = iso.split('T')[0];
  const timePart = iso.split('T')[1]?.slice(0, 5) || '';
  if (!datePart) return { label: '', time: timePart };
  const [y, m, d] = datePart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];
  return { label: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} - ${weekday}`, time: timePart };
}
const sentiments = [
  { name: 'Muito bem', icon: 'sentiment.very.satisfied' },
  { name: 'Bem', icon: 'sentiment.satisfied' },
  { name: 'Indiferente', icon: 'sentiment.neutral' },
  { name: 'Mal', icon: 'sentiment.dissatisfied' },
  { name: 'Muito mal', icon: 'sentiment.very.dissatisfied' },
];

const climates = [
  { name: 'Muito mais', icon: 'sun.max.fill' },
  { name: 'Um pouco mais', icon: 'cloud.sun.fill' },
  { name: 'Nem um pouco', icon: 'cloud.rain.fill' },
];

export default function FeedbackScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { sessaoId: targetSessaoId } = useLocalSearchParams();
  
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [progress, setProgress] = useState(null);
  const [clarity, setClarity] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [note, setNote] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Sucesso!');
  const [loading, setLoading] = useState(false);

  const [initializing, setInitializing] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [alreadySent, setAlreadySent] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  const resetForm = () => {
    setSelectedFeeling(null);
    setProgress(null);
    setClarity(null);
    setMotivation(null);
    setNote('');
  };

  useEffect(() => {
    let mounted = true;
    // Recarrega ao mudar a sessão alvo (a tela do drawer não remonta sozinha).
    setInitializing(true);
    setCurrentIndex(0);
    setAlreadySent(false);
    setExistingFeedback(null);
    resetForm();
    (async () => {
      try {
        const session = getCurrentSession();
        let pid = session?.usuario?.patientId;
        if (!pid) {
          const paciente = await getMeuPaciente(session?.usuario?.id);
          pid = paciente?.id;
        }
        if (!pid) return;
        if (mounted) setPatientId(pid);

        const [sessoes, feedbacks] = await Promise.all([
          getAgendamentosPorPaciente(pid).catch(() => []),
          getFeedbacksPaciente(pid).catch(() => []),
        ]);
        const list = Array.isArray(sessoes) ? sessoes : (sessoes?.content || []);
        const comFeedback = new Set((Array.isArray(feedbacks) ? feedbacks : []).map((f) => String(f.sessaoId)));

        // Se veio de um agendamento específico, mira exatamente naquela sessão.
        if (targetSessaoId) {
          const alvo = list.find((s) => String(s.id) === String(targetSessaoId));
          const isConcluida = alvo && String(alvo.status || alvo.statusSessao || '').toUpperCase() === 'CONCLUIDA';
          const temFeedback = comFeedback.has(String(targetSessaoId));

          // Sessão concluída e ainda sem feedback => abre o formulário.
          if (isConcluida && !temFeedback) {
            if (mounted) setPendingSessions([alvo]);
            return;
          }

          // Caso contrário (já tem feedback) => tela "Feedback concluído" com o conteúdo.
          const fb = (Array.isArray(feedbacks) ? feedbacks : []).find((f) => String(f.sessaoId) === String(targetSessaoId));
          if (mounted) {
            setExistingFeedback(fb || null);
            setAlreadySent(true);
          }
          return;
        }

        // Só sessões CONCLUÍDAS e que ainda não têm feedback enviado.
        const pendentes = list
          .filter((s) => String(s.status || s.statusSessao || '').toUpperCase() === 'CONCLUIDA')
          .filter((s) => !comFeedback.has(String(s.id)))
          .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
        if (mounted) setPendingSessions(pendentes);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [targetSessaoId]);

  const currentSession = pendingSessions[currentIndex];

  const getIconStyle = (index, selectedValue) => {
    if (selectedValue === null) return [];
    return [selectedValue !== index && styles.deselectedItem];
  };

  const getTextStyle = (index, selectedValue) => {
    if (selectedValue === null) return [styles.emojiLabel];
    return [styles.emojiLabel, selectedValue !== index && styles.deselectedText];
  };

  const getSentimentColor = (index) => {
    const sentimentColors = ['#4CAF50', '#8BC34A', '#00BCD4', '#3F51B5', '#9C27B0'];
    return sentimentColors[index];
  };

  const moodScoreFromFeeling = (feeling) => {
    // sentiments: 0 = Muito bem ... 4 = Muito mal  -> moodScore 5..1
    if (feeling === null) return 3;
    return 5 - feeling;
  };

  const buildContent = () => {
    const parts = [];
    if (selectedFeeling !== null) parts.push(`Sentimento: ${sentiments[selectedFeeling].name}`);
    if (progress !== null) parts.push(`Progresso (1-5): ${progress}`);
    if (clarity !== null) parts.push(`Clareza: ${climates[clarity].name}`);
    if (motivation !== null) parts.push(`Motivação: ${['Sim', 'Mais ou menos', 'Não'][motivation]}`);
    if (note.trim()) parts.push(`Nota: ${note.trim()}`);
    return parts.join(' | ') || 'Feedback enviado sem detalhes adicionais.';
  };

  const handleSubmit = async () => {
    // Campos obrigatórios: sentimento, progresso, clareza e motivação. (Nota é opcional.)
    if (selectedFeeling === null || progress === null || clarity === null || motivation === null) {
      setAlertTitle('Campos obrigatórios');
      setAlertMessage('Responda todas as perguntas antes de enviar (a nota é opcional).');
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    let latitude = null;
    let longitude = null;
    let locationLabel = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        locationLabel = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      }
    } catch (e) {
      console.log('Erro ao capturar localização', e);
    }

    try {
      await postFeedback({
        patientId,
        sessaoId: currentSession?.id,
        content: buildContent(),
        moodScore: moodScoreFromFeeling(selectedFeeling),
        latitude,
        longitude,
        locationLabel,
      });

      const restantes = pendingSessions.length - currentIndex - 1;
      setAlertTitle('Sucesso!');
      setAlertMessage(
        restantes > 0
          ? `Feedback enviado! Você ainda tem ${restantes} sessão(ões) aguardando feedback.`
          : 'Feedback enviado! Você respondeu todas as sessões pendentes.'
      );
    } catch (_e) {
      setAlertTitle('Erro');
      setAlertMessage('Não foi possível enviar seu feedback. Tente novamente.');
    } finally {
      setLoading(false);
      setAlertVisible(true);
    }
  };

  // Ao fechar o alerta de sucesso, avança para a próxima sessão pendente.
  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertTitle === 'Sucesso!') {
      resetForm();
      setCurrentIndex((idx) => idx + 1);
    }
  };

  if (initializing) {
    return (
      <ThemedView style={[styles.container, styles.centerState]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Feedback dessa sessão já foi enviado — mostra o conteúdo (somente leitura).
  if (alreadySent) {
    const partes = String(existingFeedback?.content || '')
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    const quando = existingFeedback?.createdAt
      ? new Date(existingFeedback.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : null;

    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <IconSymbol name="checkmark.circle.fill" size={48} color="#4CAF50" />
            <ThemedText style={styles.emptyTitle}>Feedback concluído</ThemedText>
            <ThemedText style={styles.emptyText}>
              Você já respondeu o feedback desta sessão. Veja abaixo o que foi enviado.
            </ThemedText>
          </View>

          <View style={[styles.reviewCard, { borderColor: colors.primary }]}>
            {quando ? (
              <ThemedText style={[styles.reviewMeta, { color: colors.primary }]}>Enviado em {quando}</ThemedText>
            ) : null}
            {existingFeedback?.moodScore != null ? (
              <ThemedText style={styles.reviewLine}>
                <ThemedText style={styles.reviewLabel}>Humor: </ThemedText>{existingFeedback.moodScore}/5
              </ThemedText>
            ) : null}
            {partes.length > 0 ? (
              partes.map((p, i) => (
                <ThemedText key={i} style={styles.reviewLine}>• {p}</ThemedText>
              ))
            ) : (
              <ThemedText style={styles.reviewLine}>{existingFeedback?.content || 'Sem detalhes registrados.'}</ThemedText>
            )}
            {existingFeedback?.locationLabel ? (
              <ThemedText style={[styles.reviewLine, { marginTop: 6 }]}>
                <ThemedText style={styles.reviewLabel}>Local: </ThemedText>{existingFeedback.locationLabel}
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Sem sessões pendentes: ou nunca houve sessão concluída, ou todas já têm feedback.
  if (!currentSession) {
    return (
      <ThemedView style={[styles.container, styles.centerState]}>
        <IconSymbol name="checkmark.circle.fill" size={56} color="#4CAF50" />
        <ThemedText style={styles.emptyTitle}>Nenhum feedback pendente</ThemedText>
        <ThemedText style={styles.emptyText}>
          Você não possui sessões concluídas aguardando feedback no momento.
        </ThemedText>
      </ThemedView>
    );
  }

  const info = describeSession(currentSession);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.headerTitle}>
          Referente a sessão do dia <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>{info.label}</ThemedText>{info.time ? <> às <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>{info.time}</ThemedText></> : null} :
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Como você se sentiu no final da sessão?</ThemedText>
          <View style={styles.emojiContainer}>
            {sentiments.map((item, index) => (
              <TouchableOpacity key={index} style={styles.emojiItem} onPress={() => setSelectedFeeling(index)}>
                <View style={getIconStyle(index, selectedFeeling)}>
                  <IconSymbol 
                    name={item.icon} 
                    size={44} 
                    color={selectedFeeling === index || selectedFeeling === null ? getSentimentColor(index) : '#AAA'} 
                  />
                </View>
                <ThemedText style={getTextStyle(index, selectedFeeling)}>{item.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Como você avaliaria seu progresso?</ThemedText>
          <View style={styles.progressContainer}>
            <ThemedText style={styles.sideLabel}>Alto{"\n"}Progresso</ThemedText>
            <View style={styles.bars}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity 
                   key={level} 
                   style={[
                     styles.bar, 
                     { 
                       height: 20 + (6 - level) * 10, 
                       backgroundColor: progress === level ? getBarColor(level) : (colorScheme === 'dark' ? '#444' : '#AAA'),
                       opacity: progress !== null && progress !== level ? 0.3 : 1
                     }
                   ]} 
                   onPress={() => setProgress(level)} 
                />
              ))}
            </View>
            <ThemedText style={styles.sideLabel}>Baixo{"\n"}Progresso</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Você saiu com mais clareza do que entrou sobre os assuntos abordados?</ThemedText>
          <View style={styles.iconSelection}>
             {climates.map((item, index) => {
               const isSelected = clarity === index || clarity === null;
               const getClarityColor = () => {
                 if (!isSelected) return '#AAA';
                 if (index === 0) return '#FFD700';
                 if (index === 1) return '#81D4FA';
                 return '#1E88E5';
               };
               
               return (
                 <TouchableOpacity key={index} style={styles.iconItem} onPress={() => setClarity(index)}>
                    <View style={getIconStyle(index, clarity)}>
                      <IconSymbol 
                        name={item.icon} 
                        size={44} 
                        color={getClarityColor()} 
                      />
                    </View>
                    <ThemedText style={getTextStyle(index, clarity)}>{item.name}</ThemedText>
                 </TouchableOpacity>
               );
             })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Você se sente motivado(a) a continuar o processo?</ThemedText>
          <View style={styles.choiceSelection}>
             <TouchableOpacity 
                style={[styles.choiceBox, { backgroundColor: motivation === 0 ? '#4CAF50' : (colorScheme === 'dark' ? '#444' : '#AAA') }]} 
                onPress={() => setMotivation(0)}
             >
                <IconSymbol name="checkmark.circle.fill" size={24} color="#FFF" style={{ opacity: motivation !== null && motivation !== 0 ? 0.3 : 1 }} />
                <ThemedText style={[styles.choiceLabel, motivation !== null && motivation !== 0 && { opacity: 0.5 }]}>Sim</ThemedText>
             </TouchableOpacity>
             <TouchableOpacity 
                style={[styles.choiceBox, { backgroundColor: motivation === 1 ? '#FFD740' : (colorScheme === 'dark' ? '#444' : '#AAA') }]} 
                onPress={() => setMotivation(1)}
             >
                <IconSymbol name="xmark.circle.fill" size={24} color="#FFF" style={{ opacity: motivation !== null && motivation !== 1 ? 0.3 : 1 }} />
                <ThemedText style={[styles.choiceLabel, motivation !== null && motivation !== 1 && { opacity: 0.5 }]}>Mais ou menos</ThemedText>
             </TouchableOpacity>
             <TouchableOpacity 
                style={[styles.choiceBox, { backgroundColor: motivation === 2 ? '#FF5252' : (colorScheme === 'dark' ? '#444' : '#AAA') }]} 
                onPress={() => setMotivation(2)}
             >
                <IconSymbol name="xmark.circle.fill" size={24} color="#FFF" style={{ opacity: motivation !== null && motivation !== 2 ? 0.3 : 1 }} />
                <ThemedText style={[styles.choiceLabel, motivation !== null && motivation !== 2 && { opacity: 0.5 }]}>Não</ThemedText>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Nota (opcional)</ThemedText>
          <TextInput 
            style={[
              styles.input, 
              { 
                borderColor: colors.purpleLight, 
                color: colors.text,
                backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#FFF'
              }
            ]} 
            multiline 
            value={note}
            onChangeText={setNote}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: colors.purpleLight }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
           {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.sendButtonText}>Enviar</ThemedText>}
        </TouchableOpacity>

        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={handleAlertClose}
        />

      </ScrollView>
    </ThemedView>
  );
}

function getBarColor(level) {
  const colors = ['#4CAF50', '#8BC34A', '#FFEB3B', '#FF9800', '#F44336'];
  return colors[level - 1] || '#AAA';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  reviewCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  reviewMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  reviewLine: {
    fontSize: 15,
    lineHeight: 21,
  },
  reviewLabel: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    lineHeight: 28,
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiItem: {
    alignItems: 'center',
    width: '18%',
  },
  deselectedItem: {
    opacity: 0.3,
  },
  emojiLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deselectedText: {
    color: '#888',
    opacity: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 15,
  },
  bar: {
    width: 25,
    marginHorizontal: 3,
    borderRadius: 5,
  },
  sideLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconItem: {
    alignItems: 'center',
  },
  choiceSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  choiceBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    width: '30%',
  },
  choiceLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 60,
    padding: 10,
  },
  sendButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
