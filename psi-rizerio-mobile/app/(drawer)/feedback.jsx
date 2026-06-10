import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, useColorScheme, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { ThemedText } from './../../components/themed-text';
import { ThemedView } from './../../components/themed-view';
import { Colors } from './../../constants/theme';
import { IconSymbol } from './../../components/ui/icon-symbol';
import { CustomAlert } from './../../components/CustomAlert';
import { getCurrentSession } from './../../services/authService';
import { getMeuPaciente, postFeedback } from './../../services/dashboardService';
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
  
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [progress, setProgress] = useState(null);
  const [clarity, setClarity] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [note, setNote] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Sucesso!');
  const [loading, setLoading] = useState(false);

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
      const session = getCurrentSession();
      let patientId = session?.usuario?.patientId;
      if (!patientId) {
        const paciente = await getMeuPaciente(session?.usuario?.id);
        patientId = paciente?.id;
      }

      await postFeedback({
        patientId,
        content: buildContent(),
        moodScore: moodScoreFromFeeling(selectedFeeling),
        latitude,
        longitude,
        locationLabel,
      });

      setAlertTitle('Sucesso!');
      setAlertMessage(
        latitude != null
          ? 'Seu feedback foi enviado com sucesso. Sua localização também foi registrada para gerar melhores insights de IA!'
          : 'Seu feedback foi enviado com sucesso.'
      );
    } catch (_e) {
      setAlertTitle('Erro');
      setAlertMessage('Não foi possível enviar seu feedback. Tente novamente.');
    } finally {
      setLoading(false);
      setAlertVisible(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.headerTitle}>
          Referente a sessão do dia <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>10/02 - Terça-Feira</ThemedText> às <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>11:30</ThemedText> :
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
          onClose={() => setAlertVisible(false)}
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
