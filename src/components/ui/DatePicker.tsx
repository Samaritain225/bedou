import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, Text, View } from "react-native";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date: Date): string => {
    const locale = t("common.locale", "en-US"); // Get locale from translations
    return date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " " + date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false); // Close picker on Android after selection
      
      if (event.type === "set" && selectedDate) {
        if (pickerMode === "date") {
          // Update date and show time picker
          const updatedDate = new Date(selectedDate);
          updatedDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
          setTempDate(updatedDate);
          setPickerMode("time");
          setShowPicker(true);
        } else if (pickerMode === "time") {
          // Time selected, combine with date
          const finalDate = new Date(tempDate);
          finalDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
          onChange(finalDate);
          setPickerMode("date");
        }
      } else if (event.type === "dismissed") {
        // User cancelled - reset to date mode
        setPickerMode("date");
        setTempDate(value);
      }
    } else {
      // iOS
      if (event.type === "set" && selectedDate) {
        setTempDate(selectedDate);
        onChange(selectedDate);
      } else if (event.type === "dismissed") {
        setShowPicker(false);
      }
    }
  };

  return (
    <View>
      <Pressable
        onPress={() => {
          setTempDate(value);
          setPickerMode("date");
          setShowPicker(true);
        }}
        style={{
          borderRadius: scaleSpacing(12),
          paddingHorizontal: scaleSpacing(16),
          paddingVertical: scaleSpacing(14),
          backgroundColor: isDark ? "#374151" : "#FFFFFF",
          borderWidth: 1.5,
          borderColor: isDark ? "#4B5563" : "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSpacing(12) }}>
          <Ionicons
            name="calendar-outline"
            size={scaleSize(20)}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            style={{
              color: isDark ? "#FFFFFF" : "#111827",
              fontSize: scaleFont(16),
              fontWeight: "500",
            }}
          >
            {formatDate(value)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={scaleSize(20)}
          color={isDark ? "#9CA3AF" : "#6B7280"}
        />
      </Pressable>

      {/* Android: DateTimePicker shows as native dialog automatically */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={pickerMode === "date" ? value : tempDate}
          mode={pickerMode}
          display="default"
          onChange={handleDateChange}
          minimumDate={pickerMode === "date" ? minimumDate : undefined}
          maximumDate={pickerMode === "date" ? maximumDate : undefined}
        />
      )}

      {/* iOS: Show picker in modal */}
      {Platform.OS === "ios" && showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setPickerMode("date");
            setShowPicker(false);
            setTempDate(value);
          }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => {
              setPickerMode("date");
              setShowPicker(false);
              setTempDate(value);
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  borderTopLeftRadius: scaleSpacing(20),
                  borderTopRightRadius: scaleSpacing(20),
                  paddingBottom: scaleSpacing(20),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: scaleSpacing(20),
                    paddingTop: scaleSpacing(16),
                    paddingBottom: scaleSpacing(12),
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setPickerMode("date");
                      setShowPicker(false);
                      setTempDate(value);
                    }}
                  >
                    <Text
                      style={{
                        color: "#EF4444",
                        fontSize: scaleFont(16),
                        fontWeight: "600",
                      }}
                    >
                      {t("common.cancel", "Cancel")}
                    </Text>
                  </Pressable>
                  <Text
                    style={{
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontSize: scaleFont(18),
                      fontWeight: "700",
                    }}
                  >
                    {t("add.date", "Select Date & Time")}
                  </Text>
                  <Pressable
                    onPress={() => {
                      onChange(tempDate);
                      setShowPicker(false);
                      setPickerMode("date");
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#3B82F6" : "#2563EB",
                        fontSize: scaleFont(16),
                        fontWeight: "600",
                      }}
                    >
                      {t("common.done", "Done")}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const updated = new Date(selectedDate);
                      updated.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
                      setTempDate(updated);
                    }
                  }}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  themeVariant={isDark ? "dark" : "light"}
                />
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const updated = new Date(tempDate);
                      updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                      setTempDate(updated);
                    }
                  }}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

