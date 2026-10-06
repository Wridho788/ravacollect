import React, { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors as c } from './theme';

export function Icon({
  name,
  color = c.muted,
  size = 22,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'discover' ? (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" />
        </>
      ) : name === 'heart' ? (
        <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      ) : name === 'collection' ? (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="2" />
          <Rect x="14" y="3" width="7" height="7" rx="2" />
          <Rect x="3" y="14" width="7" height="7" rx="2" />
          <Rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      ) : name === 'activity' ? (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </>
      ) : name === 'search' ? (
        <>
          <Circle cx="10" cy="10" r="6" />
          <Path d="m15 15 5 5" />
        </>
      ) : name === 'back' ? (
        <Path d="m14 5-7 7 7 7" />
      ) : name === 'settings' ? (
        <>
          <Path d="M4 7h16M4 17h16" />
          <Circle cx="9" cy="7" r="3" fill={c.background} />
          <Circle cx="16" cy="17" r="3" fill={c.background} />
        </>
      ) : (
        <Path d="M5 12h14m-6-6 6 6-6 6" />
      )}
    </Svg>
  );
}

export function Button({
  title,
  onPress,
  testID,
  secondary = false,
  disabled = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  testID?: string;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && s.danger,
        (pressed || disabled) && s.dim,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary && s.secondaryText,
          danger && s.dangerText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  active,
  onPress,
  testID,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && s.activeChip]}
    >
      <Text style={[s.chipText, active && s.activeChipText]}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        selectionColor={c.lime}
        {...props}
        style={[s.input, props.multiline && s.multiline, props.style]}
      />
    </View>
  );
}
export function Message({
  children,
  error = false,
}: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View style={[s.message, error && s.error]}>
      <Text
        accessibilityLiveRegion="polite"
        testID={error ? 'feedback.error' : 'feedback.info'}
        style={[s.messageText, error && s.dangerText]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.empty}>
      <Icon name="collection" color={c.purple} size={36} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: c.lime,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginVertical: 5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.background,
    textAlign: 'center',
  },
  secondary: { backgroundColor: c.raised, borderWidth: 1, borderColor: c.line },
  secondaryText: { color: c.text },
  danger: { backgroundColor: '#392724' },
  dangerText: { color: c.danger },
  dim: { opacity: 0.5 },
  chip: {
    minHeight: 48,
    paddingHorizontal: 19,
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: c.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: c.line,
  },
  activeChip: { backgroundColor: c.lime, borderColor: c.lime },
  chipText: { color: c.muted, fontSize: 13, fontWeight: '600' },
  activeChipText: { color: c.background },
  field: { marginVertical: 10 },
  label: { color: c.text, fontSize: 14, marginBottom: 10, fontWeight: '600' },
  input: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.line,
    color: c.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
    fontSize: 16,
    backgroundColor: c.surface,
  },
  multiline: { minHeight: 115, textAlignVertical: 'top' },
  message: {
    padding: 16,
    backgroundColor: c.raised,
    borderRadius: 14,
    marginVertical: 12,
  },
  messageText: { color: c.muted, lineHeight: 22 },
  error: { backgroundColor: '#392724' },
  empty: {
    alignItems: 'center',
    paddingVertical: 42,
    paddingHorizontal: 22,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  emptyBody: {
    fontSize: 14,
    lineHeight: 23,
    color: c.muted,
    textAlign: 'center',
  },
});
