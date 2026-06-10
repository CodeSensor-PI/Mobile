import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Renderizador leve de Markdown para os textos gerados pela IA.
// Trata títulos (#, ##, ###), negrito (**texto**) e listas (-, *).

function renderInline(text, baseStyle, keyPrefix) {
  // Divide por **negrito** e alterna o estilo.
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (
    <Text key={`${keyPrefix}-${i}`} style={i % 2 === 1 ? styles.bold : null}>
      {part}
    </Text>
  ));
}

export function SimpleMarkdown({ content, color = '#111827' }) {
  if (!content) return null;
  const lines = String(content).replace(/\r/g, '').split('\n');

  return (
    <View>
      {lines.map((raw, idx) => {
        const line = raw.trimEnd();
        const key = `md-${idx}`;

        if (line.trim() === '' || line.trim() === '---') {
          return <View key={key} style={styles.spacer} />;
        }

        // Títulos
        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          const level = h[1].length;
          const sizeStyle = level <= 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
          return (
            <Text key={key} style={[sizeStyle, { color }]}>
              {renderInline(h[2], null, key)}
            </Text>
          );
        }

        // Listas
        const li = line.match(/^\s*[-*]\s+(.*)$/);
        if (li) {
          return (
            <View key={key} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color }]}>•</Text>
              <Text style={[styles.paragraph, { color, flex: 1 }]}>{renderInline(li[1], null, key)}</Text>
            </View>
          );
        }

        // Itens numerados (1. ...)
        const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (ol) {
          return (
            <View key={key} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color }]}>{ol[1]}.</Text>
              <Text style={[styles.paragraph, { color, flex: 1 }]}>{renderInline(ol[2], null, key)}</Text>
            </View>
          );
        }

        return (
          <Text key={key} style={[styles.paragraph, { color }]}>
            {renderInline(line, null, key)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 8 },
  bold: { fontWeight: '800' },
  h1: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  h2: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  h3: { fontSize: 14, fontWeight: '800', marginTop: 6, marginBottom: 3 },
  paragraph: { fontSize: 14, lineHeight: 20, marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 2, paddingLeft: 2 },
  bulletDot: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
});
