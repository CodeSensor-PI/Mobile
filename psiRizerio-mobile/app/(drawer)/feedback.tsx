import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomAlert } from '@/components/CustomAlert';
const sentiments: { name: string; icon: any }[] = [
  { name: 'Muito bem', icon: 'sentiment.very.satisfied' },
  { name: 'Bem', icon: 'sentiment.satisfied' },
  { name: 'Indiferente', icon: 'sentiment.neutral' },
  { name: 'Mal', icon: 'sentiment.dissatisfied' },
  { name: 'Muito mal', icon: 'sentiment.very.dissatisfied' },
];

const climates: { name: string; icon: any }[] = [
  { name: 'Muito mais', icon: 'sun.max.fill' },
  { name: 'Um pouco mais', icon: 'cloud.sun.fill' },
  { name: 'Nem um pouco', icon: 'cloud.rain.fill' },
];

export default function FeedbackScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);

  const getIconStyle = (index: number, selectedValue: number | null) => {
    if (selectedValue === null) return [];
    return [selectedValue !== index && styles.deselectedItem];
  };

  const getTextStyle = (index: number, selectedValue: number | null) => {
    if (selectedValue === null) return [styles.emojiLabel];
    return [styles.emojiLabel, selectedValue !== index && styles.deselectedText];
  };

  const getSentimentColor = (index: number) => {
    const sentimentColors = ['#4CAF50', '#8BC34A', '#00BCD4', '#3F51B5', '#9C27B0'];
    return sentimentColors[index];
  };

  const handleSubmit = () => {
    setAlertVisible(true);
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
        >
           <ThemedText style={styles.sendButtonText}>Enviar</ThemedText>
        </TouchableOpacity>

        <CustomAlert 
          visible={alertVisible}
          title="Sucesso!"
          message="Seu feedback foi enviado com sucesso."
          onClose={() => setAlertVisible(false)}
        />

      </ScrollView>
    </ThemedView>
  );
}

function getBarColor(level: number) {
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
