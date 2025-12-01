import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Focus input on mount
  useEffect(() => {
    if (!disabled) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [disabled]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Hidden Input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          // Only allow numbers
          const cleaned = text.replace(/\D/g, '');
          onChange(cleaned.slice(0, length));
        }}
        maxLength={length}
        keyboardType="number-pad"
        style={styles.hiddenInput}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
      />

      {/* Visible Boxes */}
      <Pressable onPress={handlePress} style={styles.boxesContainer}>
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          const isCurrent = index === value.length && isFocused;
          const isFilled = !!digit;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  width: scaleSize(45),
                  height: scaleSize(56),
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderColor: error
                    ? '#EF4444'
                    : isCurrent
                    ? isDark ? '#60A5FA' : '#3B82F6'
                    : isFilled
                    ? isDark ? '#4B5563' : '#9CA3AF'
                    : isDark ? '#4B5563' : '#E5E7EB',
                },
              ]}
            >
              <Text
                style={[
                  styles.digit,
                  {
                    color: isDark ? '#FFFFFF' : '#111827',
                    fontSize: scaleFont(24),
                  },
                ]}
              >
                {digit}
              </Text>
              {isCurrent && !disabled && (
                <View
                  style={[
                    styles.cursor,
                    { backgroundColor: isDark ? '#60A5FA' : '#3B82F6' },
                  ]}
                />
              )}
            </View>
          );
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  box: {
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  digit: {
    fontWeight: '700',
  },
  cursor: {
    position: 'absolute',
    bottom: 12,
    width: '40%',
    height: 2,
    borderRadius: 1,
  },
});
