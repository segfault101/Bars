import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';

type Mode = 'freestyle' | 'longform';
type RouteParams = { Swipe: { mode: Mode } };
const SCREEN_WIDTH = Dimensions.get('window').width;

const dummyOpponents = [
  { name: 'Lil Byte', bar: 'I spit logic like circuits, break code in your verses.' },
  { name: 'MC Syntax', bar: 'I debug rhymes while you lag behind in lines.' },
  { name: 'VerseBot', bar: 'Machine-learned fire, no cap in my wire.' },
];

export default function Swipe() {
  const route = useRoute<RouteProp<RouteParams, 'Swipe'>>();
  const { mode } = route.params;
  const navigation = useNavigation<any>();

  const [index, setIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-20deg', '0deg', '20deg'],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [...pan.getTranslateTransform(), { rotate }],
  };

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeOffScreen = (direction: 'left' | 'right') => {
    Animated.timing(pan, {
      toValue: {
        x: direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5,
        y: 0,
      },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const opponent = dummyOpponents[index]?.name;

      if (direction === 'right') {
        console.log(`Challenged: ${opponent} in ${mode} mode`);
        navigation.navigate('BattleRoom' as never, {
          mode,
          opponent:card.name,
        } as never);
      } else {
        console.log(`Skipped: ${opponent}`);
      }

      pan.setValue({ x: 0, y: 0 });
      setIndex((prev) => prev + 1);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) swipeOffScreen('right');
        else if (gesture.dx < -120) swipeOffScreen('left');
        else resetPosition();
      },
    })
  ).current;

  const card = dummyOpponents[index];
  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.doneText}>No more opponents!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.modeText}>
        {mode === 'freestyle' ? '🔥 Freestyle Fightin’' : '🌊 Longform Poetic Assault'}
      </Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, cardStyle]}
      >
        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.bar}>"{card.bar}"</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modeText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  card: {
    width: '100%',
    height: 400,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  name: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bar: {
    color: '#ccc',
    fontSize: 18,
    fontStyle: 'italic',
  },
  doneText: {
    color: '#888',
    fontSize: 20,
    fontStyle: 'italic',
  },
});
