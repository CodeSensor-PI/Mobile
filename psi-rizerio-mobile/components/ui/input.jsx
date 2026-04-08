import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { useThemeColor } from '../../hooks/use-theme-color';

export function FormInput({ label, containerStyle, inputStyle, ...props }) {
    // Buscando as cores semânticas do tema
    const labelColor = useThemeColor({}, 'inputLabel');
    const bgColor = useThemeColor({}, 'inputBackground');
    const placeholderColor = useThemeColor({}, 'inputPlaceholder');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    return (
        <View style={[styles.container, containerStyle]}>
            <ThemedText style={[styles.label, { color: labelColor }]}>
                {label}
            </ThemedText>
            <TextInput
                style={[
                    styles.input, 
                    { 
                        backgroundColor: bgColor, 
                        color: textColor, 
                        borderColor: borderColor 
                    },
                    inputStyle
                ]}
                placeholderTextColor={placeholderColor}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderRadius: 20,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
});