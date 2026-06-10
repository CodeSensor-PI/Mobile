import React from 'react';
import { View, StyleSheet } from 'react-native';

export function ProgressBar({ steps = 4, currentStep = 1, activeColor = '#643BA1', inactiveColor = '#D1C4E9' }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: steps }).map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.step, 
            { 
              backgroundColor: (i + 1 <= currentStep) ? activeColor : inactiveColor 
            }
          ]} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 12, 
    marginBottom: 35,
    marginTop: 10
  },
  step: { 
    flex: 1, 
    height: 8, 
    borderRadius: 4, 
  },
});