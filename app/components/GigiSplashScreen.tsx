import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const GigiSplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const [fontsLoaded] = useFonts({
    'PressStart2P-Regular': require('../../assets/fonts/PressStart2P-Regular.ttf'),
  });

  // Animation values
  const textScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  
  const moonScale = useSharedValue(0);
  const moonOpacity = useSharedValue(0);
  
  const impactFlash = useSharedValue(0);
  const craterOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  // Debris particles - 12 particles
  const d1X = useSharedValue(0);
  const d1Y = useSharedValue(0);
  const d1O = useSharedValue(0);
  const d1R = useSharedValue(0);
  
  const d2X = useSharedValue(0);
  const d2Y = useSharedValue(0);
  const d2O = useSharedValue(0);
  const d2R = useSharedValue(0);
  
  const d3X = useSharedValue(0);
  const d3Y = useSharedValue(0);
  const d3O = useSharedValue(0);
  const d3R = useSharedValue(0);
  
  const d4X = useSharedValue(0);
  const d4Y = useSharedValue(0);
  const d4O = useSharedValue(0);
  const d4R = useSharedValue(0);
  
  const d5X = useSharedValue(0);
  const d5Y = useSharedValue(0);
  const d5O = useSharedValue(0);
  const d5R = useSharedValue(0);
  
  const d6X = useSharedValue(0);
  const d6Y = useSharedValue(0);
  const d6O = useSharedValue(0);
  const d6R = useSharedValue(0);
  
  const d7X = useSharedValue(0);
  const d7Y = useSharedValue(0);
  const d7O = useSharedValue(0);
  const d7R = useSharedValue(0);
  
  const d8X = useSharedValue(0);
  const d8Y = useSharedValue(0);
  const d8O = useSharedValue(0);
  const d8R = useSharedValue(0);
  
  const d9X = useSharedValue(0);
  const d9Y = useSharedValue(0);
  const d9O = useSharedValue(0);
  const d9R = useSharedValue(0);
  
  const d10X = useSharedValue(0);
  const d10Y = useSharedValue(0);
  const d10O = useSharedValue(0);
  const d10R = useSharedValue(0);
  
  const d11X = useSharedValue(0);
  const d11Y = useSharedValue(0);
  const d11O = useSharedValue(0);
  const d11R = useSharedValue(0);
  
  const d12X = useSharedValue(0);
  const d12Y = useSharedValue(0);
  const d12O = useSharedValue(0);
  const d12R = useSharedValue(0);

  // Animated styles
  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  const moonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moonScale.value }],
    opacity: moonOpacity.value,
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: impactFlash.value,
  }));

  const craterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: craterOpacity.value,
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const d1Style = useAnimatedStyle(() => ({
    opacity: d1O.value,
    transform: [
      { translateX: d1X.value },
      { translateY: d1Y.value },
      { rotate: `${d1R.value}deg` },
    ],
  }));

  const d2Style = useAnimatedStyle(() => ({
    opacity: d2O.value,
    transform: [
      { translateX: d2X.value },
      { translateY: d2Y.value },
      { rotate: `${d2R.value}deg` },
    ],
  }));

  const d3Style = useAnimatedStyle(() => ({
    opacity: d3O.value,
    transform: [
      { translateX: d3X.value },
      { translateY: d3Y.value },
      { rotate: `${d3R.value}deg` },
    ],
  }));

  const d4Style = useAnimatedStyle(() => ({
    opacity: d4O.value,
    transform: [
      { translateX: d4X.value },
      { translateY: d4Y.value },
      { rotate: `${d4R.value}deg` },
    ],
  }));

  const d5Style = useAnimatedStyle(() => ({
    opacity: d5O.value,
    transform: [
      { translateX: d5X.value },
      { translateY: d5Y.value },
      { rotate: `${d5R.value}deg` },
    ],
  }));

  const d6Style = useAnimatedStyle(() => ({
    opacity: d6O.value,
    transform: [
      { translateX: d6X.value },
      { translateY: d6Y.value },
      { rotate: `${d6R.value}deg` },
    ],
  }));

  const d7Style = useAnimatedStyle(() => ({
    opacity: d7O.value,
    transform: [
      { translateX: d7X.value },
      { translateY: d7Y.value },
      { rotate: `${d7R.value}deg` },
    ],
  }));

  const d8Style = useAnimatedStyle(() => ({
    opacity: d8O.value,
    transform: [
      { translateX: d8X.value },
      { translateY: d8Y.value },
      { rotate: `${d8R.value}deg` },
    ],
  }));

  const d9Style = useAnimatedStyle(() => ({
    opacity: d9O.value,
    transform: [
      { translateX: d9X.value },
      { translateY: d9Y.value },
      { rotate: `${d9R.value}deg` },
    ],
  }));

  const d10Style = useAnimatedStyle(() => ({
    opacity: d10O.value,
    transform: [
      { translateX: d10X.value },
      { translateY: d10Y.value },
      { rotate: `${d10R.value}deg` },
    ],
  }));

  const d11Style = useAnimatedStyle(() => ({
    opacity: d11O.value,
    transform: [
      { translateX: d11X.value },
      { translateY: d11Y.value },
      { rotate: `${d11R.value}deg` },
    ],
  }));

  const d12Style = useAnimatedStyle(() => ({
    opacity: d12O.value,
    transform: [
      { translateX: d12X.value },
      { translateY: d12Y.value },
      { rotate: `${d12R.value}deg` },
    ],
  }));

  useEffect(() => {
    if (!fontsLoaded) return;
    
    const runAnimation = () => {
      // Phase 1: Moon fades in (0-500ms)
      moonScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
      moonOpacity.value = withTiming(1, { duration: 500 });

      // Phase 2: Text bounces 3 times (600ms-2400ms)
      setTimeout(() => {
        // Bounce 1 (bigger)
        textScale.value = withSequence(
          withTiming(1.3, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 200, easing: Easing.in(Easing.quad) })
        );
      }, 600);

      setTimeout(() => {
        // Bounce 2 (medium)
        textScale.value = withSequence(
          withTiming(1.2, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 180, easing: Easing.in(Easing.quad) })
        );
      }, 1200);

      setTimeout(() => {
        // Bounce 3 (smaller)
        textScale.value = withSequence(
          withTiming(1.15, { duration: 160, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) })
        );
      }, 1700);

      // Phase 3: Final big bounce and CRASH (2100ms)
      setTimeout(() => {
        // Big zoom in
        textScale.value = withTiming(1.5, { 
          duration: 300, 
          easing: Easing.out(Easing.back(1.5)) 
        });

        // IMPACT at 2400ms
        setTimeout(() => {
          // Flash
          impactFlash.value = withSequence(
            withTiming(0.9, { duration: 80 }),
            withTiming(0, { duration: 200 })
          );

          // Text explodes
          textOpacity.value = withTiming(0, { duration: 100 });

          // Crater appears
          craterOpacity.value = withTiming(1, { duration: 300 });

          // Moon shakes
          moonScale.value = withSequence(
            withTiming(1.15, { duration: 100 }),
            withTiming(0.9, { duration: 100 }),
            withTiming(1.08, { duration: 100 }),
            withTiming(1, { duration: 200 })
          );

          // Scatter debris in all directions
          const debris = [
            { x: d1X, y: d1Y, o: d1O, r: d1R },
            { x: d2X, y: d2Y, o: d2O, r: d2R },
            { x: d3X, y: d3Y, o: d3O, r: d3R },
            { x: d4X, y: d4Y, o: d4O, r: d4R },
            { x: d5X, y: d5Y, o: d5O, r: d5R },
            { x: d6X, y: d6Y, o: d6O, r: d6R },
            { x: d7X, y: d7Y, o: d7O, r: d7R },
            { x: d8X, y: d8Y, o: d8O, r: d8R },
            { x: d9X, y: d9Y, o: d9O, r: d9R },
            { x: d10X, y: d10Y, o: d10O, r: d10R },
            { x: d11X, y: d11Y, o: d11O, r: d11R },
            { x: d12X, y: d12Y, o: d12O, r: d12R },
          ];

          debris.forEach((d, i) => {
            const angle = (i / debris.length) * Math.PI * 2;
            const distance = 120 + Math.random() * 180;

            d.x.value = withTiming(
              Math.cos(angle) * distance,
              { duration: 700, easing: Easing.out(Easing.cubic) }
            );
            d.y.value = withTiming(
              Math.sin(angle) * distance,
              { duration: 700, easing: Easing.out(Easing.cubic) }
            );
            d.o.value = withSequence(
              withTiming(1, { duration: 80 }),
              withDelay(250, withTiming(0, { duration: 350 }))
            );
            d.r.value = withTiming(
              (Math.random() - 0.5) * 720,
              { duration: 700, easing: Easing.out(Easing.cubic) }
            );
          });

          // Fade out and complete
          setTimeout(() => {
            screenOpacity.value = withTiming(
              0,
              { duration: 400 },
              (finished) => {
                if (finished) {
                  runOnJS(onAnimationComplete)();
                }
              }
            );
          }, 600);
        }, 0);
      }, 2100);
    };

    runAnimation();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <StatusBar hidden />
      
      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashAnimatedStyle]} />
      
      {/* Stars background */}
      {Array.from({ length: 80 }).map((_, i) => (
        <View
          key={`star-${i}`}
          style={[
            styles.star,
            {
              left: Math.random() * width,
              top: Math.random() * height,
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              opacity: Math.random() * 0.8 + 0.2,
            },
          ]}
        />
      ))}
      
      {/* Center container */}
      <View style={styles.centerContainer}>
        {/* Moon (behind text) */}
        <Animated.View style={[styles.moon, moonAnimatedStyle]}>
          <View style={[styles.moonCrater, { top: '20%', left: '25%', width: 30, height: 30 }]} />
          <View style={[styles.moonCrater, { top: '50%', left: '60%', width: 40, height: 40 }]} />
          <View style={[styles.moonCrater, { top: '65%', left: '30%', width: 25, height: 25 }]} />
          <View style={[styles.moonCrater, { top: '35%', left: '70%', width: 20, height: 20 }]} />
          
          {/* Impact crater */}
          <Animated.View style={[styles.impactCrater, craterAnimatedStyle]} />
        </Animated.View>
        
        {/* GIGI BOT Text (in front of moon) */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.gigiText}>GIGI</Text>
          <Text style={styles.gigiText}>BOT</Text>
        </Animated.View>

        {/* Debris particles */}
        <Animated.View style={[styles.debris, d1Style, { width: 8, height: 8 }]} />
        <Animated.View style={[styles.debris, d2Style, { width: 6, height: 6 }]} />
        <Animated.View style={[styles.debris, d3Style, { width: 10, height: 10 }]} />
        <Animated.View style={[styles.debris, d4Style, { width: 7, height: 7 }]} />
        <Animated.View style={[styles.debris, d5Style, { width: 9, height: 9 }]} />
        <Animated.View style={[styles.debris, d6Style, { width: 5, height: 5 }]} />
        <Animated.View style={[styles.debris, d7Style, { width: 8, height: 8 }]} />
        <Animated.View style={[styles.debris, d8Style, { width: 6, height: 6 }]} />
        <Animated.View style={[styles.debris, d9Style, { width: 11, height: 11 }]} />
        <Animated.View style={[styles.debris, d10Style, { width: 7, height: 7 }]} />
        <Animated.View style={[styles.debris, d11Style, { width: 9, height: 9 }]} />
        <Animated.View style={[styles.debris, d12Style, { width: 6, height: 6 }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
  },
  moon: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#d4d4d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 5,
  },
  moonCrater: {
    position: 'absolute',
    backgroundColor: '#b0b0b0',
    borderRadius: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  impactCrater: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#808080',
    top: '40%',
    left: '40%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  gigiText: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 40, // Reduced from 64 for better fit
    color: '#ffffffff', // Changed to match theme's blue/purple
    textShadowColor: '#000000ff', // Matching glow effect
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 4, // Reduced from 8 for better spacing
    lineHeight: 60, // Adjusted for new font size
    textAlign: 'center',
  },
  debris: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

export default GigiSplashScreen;