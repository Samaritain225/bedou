import { useOnboarding } from "@/src/state/OnboardingProvider";
import { useTheme } from "@/src/state/ThemeProvider";
import { useResponsive } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    icon: "wallet-outline",
    title: "onboarding.welcome.title",
    description: "onboarding.welcome.description",
    gradient: ["#6366F1", "#8B5CF6"],
  },
  {
    id: "2",
    icon: "analytics-outline",
    title: "onboarding.track.title",
    description: "onboarding.track.description",
    gradient: ["#10B981", "#059669"],
  },
  {
    id: "3",
    icon: "calendar-outline",
    title: "onboarding.bills.title",
    description: "onboarding.bills.description",
    gradient: ["#F59E0B", "#D97706"],
  },
  {
    id: "4",
    icon: "trending-up-outline",
    title: "onboarding.budget.title",
    description: "onboarding.budget.description",
    gradient: ["#EF4444", "#DC2626"],
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { hasCompletedOnboarding, completeOnboarding, isLoading } = useOnboarding();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { scaleSpacing, scaleSize, scaleFont } = useResponsive();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const slidesRef = React.useRef<FlatList>(null);

  // Redirect if onboarding is already completed
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && hasCompletedOnboarding) {
        router.replace("/(tabs)");
      }
    }, [hasCompletedOnboarding, isLoading])
  );

  // Don't render if loading or already completed
  if (isLoading || hasCompletedOnboarding) {
    return null;
  }

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      slidesRef.current?.scrollToIndex({ index: nextIndex });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
      },
    }
  );

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons
              name={item.icon}
              size={scaleSize(80)}
              color="#FFFFFF"
            />
          </LinearGradient>

          <Text
            style={[
              styles.title,
              {
                color: isDark ? "#FFFFFF" : "#111827",
                fontSize: scaleFont(32),
              },
            ]}
          >
            {t(item.title)}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: isDark ? "#9CA3AF" : "#6B7280",
                fontSize: scaleFont(16),
              },
            ]}
          >
            {t(item.description)}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor:
                    currentIndex === index ? "#3B82F6" : "#9CA3AF",
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Skip Button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: scaleSpacing(20),
          paddingTop: scaleSpacing(16),
        }}
      >
        <Pressable
          onPress={handleSkip}
          style={{
            paddingHorizontal: scaleSpacing(16),
            paddingVertical: scaleSpacing(8),
          }}
        >
          <Text
            style={{
              color: isDark ? "#9CA3AF" : "#6B7280",
              fontSize: scaleFont(16),
              fontWeight: "600",
            }}
          >
            {t("onboarding.skip", "Skip")}
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={slidesRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(index);
        }}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Action Buttons */}
      <View
        style={{
          paddingHorizontal: scaleSpacing(20),
          paddingBottom: scaleSpacing(20),
        }}
      >
        <Pressable
          onPress={handleNext}
          style={[
            styles.button,
            {
              backgroundColor: isDark ? "#3B82F6" : "#2563EB",
            },
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: scaleFont(16),
              fontWeight: "600",
            }}
          >
            {currentIndex === ONBOARDING_SLIDES.length - 1
              ? t("onboarding.getStarted", "Get Started")
              : t("onboarding.next", "Next")}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={scaleSize(20)}
            color="#FFFFFF"
            style={{ marginLeft: scaleSpacing(8) }}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
});

