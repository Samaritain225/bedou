import { useTheme } from '@/src/state/ThemeProvider';
import { useResponsive } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', dialCode: '+225' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChangeText,
  countryCode = '+225',
  onCountryCodeChange,
  error,
  disabled = false,
}: PhoneInputProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { scaleSpacing, scaleFont, scaleSize } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.dialCode === countryCode) || COUNTRIES[0];

  // Format phone number as user types (simple formatting)
  const handleChangeText = (text: string) => {
    // Remove non-numeric chars
    const cleaned = text.replace(/\D/g, '');
    onChangeText(cleaned);
  };

  const handleCountrySelect = (country: Country) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(country.dialCode);
    }
    setShowCountryPicker(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? '#374151' : '#F9FAFB',
            borderColor: error
              ? '#EF4444'
              : isFocused
              ? isDark ? '#60A5FA' : '#3B82F6'
              : isDark ? '#4B5563' : '#E5E7EB',
          },
        ]}
      >
        {/* Country Code Selector */}
        <TouchableOpacity
          style={[
            styles.countryCodeButton,
            { borderRightColor: isDark ? '#4B5563' : '#E5E7EB' },
          ]}
          disabled={disabled}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text
            style={[
              styles.countryCodeText,
              { color: isDark ? '#FFFFFF' : '#111827' },
            ]}
          >
            {selectedCountry.flag} {selectedCountry.dialCode}
          </Text>
          <Ionicons
            name="chevron-down"
            size={scaleSize(16)}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={[
            styles.input,
            { color: isDark ? '#FFFFFF' : '#111827' },
            disabled && { opacity: 0.5 },
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder="01 23 45 67"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          keyboardType="number-pad"
          maxLength={15}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={scaleSize(14)} color="#EF4444" />
          <Text style={[styles.errorText, { fontSize: scaleFont(12) }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowCountryPicker(false)}
        >
          <Pressable 
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View style={styles.handleBarContainer}>
              <View style={[styles.handleBar, { backgroundColor: isDark ? '#4B5563' : '#E5E7EB' }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >
                Select Country
              </Text>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isSelected = item.dialCode === countryCode;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.countryItem,
                      {
                        backgroundColor: pressed
                          ? isDark ? '#374151' : '#F3F4F6'
                          : isSelected
                          ? isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => handleCountrySelect(item)}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <View style={styles.countryInfo}>
                      <Text
                        style={[
                          styles.countryName,
                          { 
                            color: isDark ? '#FFFFFF' : '#111827',
                            fontWeight: isSelected ? '600' : '400'
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.countryDialCode,
                          { 
                            color: isSelected 
                              ? isDark ? '#60A5FA' : '#2563EB'
                              : isDark ? '#9CA3AF' : '#6B7280' 
                          },
                        ]}
                      >
                        {item.dialCode}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={isDark ? '#60A5FA' : '#2563EB'} 
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    height: 64,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: '100%',
    borderRightWidth: 1.5,
    gap: 10,
    backgroundColor: 'transparent',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 18,
    fontSize: 17,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34, // Safe area padding
    maxHeight: '70%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  handleBarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  countryName: {
    fontSize: 16,
  },
  countryDialCode: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
