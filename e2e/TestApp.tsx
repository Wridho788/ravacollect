import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { open } from '@op-engineering/op-sqlite';
import App from '../App';
import { FaultStage, RavaRepository } from '../src/data/repository';

let fault: 'off' | 'purchase' | 'listing' | 'watchlist' = 'off';
const db = open({ name: 'ravacollect.sqlite' });
const repository = new RavaRepository(
  {
    async execute(sql, params = []) {
      return { rows: (await db.execute(sql, params)).rows };
    },
  },
  async (stage: FaultStage) => {
    if (
      fault !== 'off' &&
      stage ===
        `${fault}:${fault === 'purchase' ? 'after-debit' : 'after-write'}`
    ) {
      // A real SQLite statement failure inside the application's open transaction.
      await db.execute('INSERT INTO e2e_nonexistent_table VALUES (1)');
    }
  },
);
function Controls() {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState(fault);
  return (
    <View style={styles.panel}>
      <Pressable
        testID="e2e.toggle"
        accessibilityRole="button"
        onPress={() => setExpanded(!expanded)}
        style={styles.button}
      >
        <Text style={styles.text}>E2E · fault: {mode}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.row}>
          {(['off', 'purchase', 'watchlist', 'listing'] as const).map(value => (
            <Pressable
              key={value}
              testID={`e2e.fault.${value}`}
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                fault = value;
                setMode(value);
                setExpanded(false);
              }}
            >
              <Text style={styles.text}>{value}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
export function TestApp() {
  return <App repository={repository} controls={<Controls />} />;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: '#362b45' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  button: { paddingHorizontal: 12, minHeight: 48, justifyContent: 'center' },
  text: { color: '#ffffff', fontSize: 12 },
});
