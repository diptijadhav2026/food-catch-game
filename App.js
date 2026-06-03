import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  PanResponder,
  Alert,
} from 'react-native';
import { Canvas, useFrame } from '@react-three/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function App() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [basketX, setBasketX] = useState(SCREEN_WIDTH / 2 - 30);

  const gameRef = useRef({
    basketX: SCREEN_WIDTH / 2 - 30,
    basketY: SCREEN_HEIGHT - 100,
    foods: [],
    gameRunning: true,
    score: 0,
    level: 1,
    foodSpeed: 3,
    spawnRate: 0.08,
    frameCount: 0,
  });

  const healthyFoods = [
    { emoji: '🍎', name: 'Apple', points: 10 },
    { emoji: '🥗', name: 'Salad', points: 15 },
    { emoji: '🥕', name: 'Carrot', points: 10 },
    { emoji: '🍌', name: 'Banana', points: 10 },
  ];

  const unhealthyFoods = [
    { emoji: '🍕', name: 'Pizza' },
    { emoji: '🍔', name: 'Burger' },
    { emoji: '🍩', name: 'Donut' },
    { emoji: '🍪', name: 'Cookie' },
  ];

  const startGame = () => {
    gameRef.current = {
      basketX: SCREEN_WIDTH / 2 - 30,
      basketY: SCREEN_HEIGHT - 100,
      foods: [],
      gameRunning: true,
      score: 0,
      level: 1,
      foodSpeed: 3,
      spawnRate: 0.08,
      frameCount: 0,
    };
    setScore(0);
    setLevel(1);
    setBasketX(SCREEN_WIDTH / 2 - 30);
    setGameState('playing');
  };

  const endGame = () => {
    setGameState('gameOver');
    gameRef.current.gameRunning = false;
    Alert.alert(
      '💥 Game Over!',
      `Final Score: ${gameRef.current.score}\nLevel: ${gameRef.current.level}`,
      [{ text: 'Play Again', onPress: startGame }]
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gameState === 'playing') {
          let newX = basketX + gestureState.dx;
          newX = Math.max(0, Math.min(SCREEN_WIDTH - 60, newX));
          setBasketX(newX);
          gameRef.current.basketX = newX;
        }
      },
    })
  ).current;

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      const game = gameRef.current;

      // Spawn foods
      game.frameCount++;
      if (Math.random() < game.spawnRate) {
        const isHealthy = Math.random() > 0.4;
        const foodList = isHealthy ? healthyFoods : unhealthyFoods;
        const food = foodList[Math.floor(Math.random() * foodList.length)];
        game.foods.push({
          ...food,
          x: Math.random() * (SCREEN_WIDTH - 40),
          y: -50,
          isHealthy,
          id: Math.random(),
        });
      }

      // Update foods
      for (let i = game.foods.length - 1; i >= 0; i--) {
        const food = game.foods[i];
        food.y += game.foodSpeed;

        // Check collision
        if (
          food.y + 40 >= game.basketY &&
          food.y <= game.basketY + 30 &&
          food.x < game.basketX + 60 &&
          food.x + 40 > game.basketX
        ) {
          if (food.isHealthy) {
            game.score += food.points;
            setScore(game.score);

            const newLevel = Math.floor(game.score / 100) + 1;
            if (newLevel > game.level) {
              game.level = newLevel;
              game.foodSpeed += 0.5;
              game.spawnRate += 0.02;
              setLevel(newLevel);
            }
          } else {
            endGame();
            return;
          }
          game.foods.splice(i, 1);
        } else if (food.y > SCREEN_HEIGHT) {
          game.foods.splice(i, 1);
        }
      }
    }, 30);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🍎 Food Catch 🍕</Text>
        <Text style={styles.subtitle}>Collect healthy foods, avoid junk!</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✅ Healthy Foods:</Text>
          <Text style={styles.infoText}>
            🍎 Apple (10) | 🥗 Salad (15){'\n'}
            🥕 Carrot (10) | 🍌 Banana (10)
          </Text>

          <Text style={[styles.infoTitle, { marginTop: 15 }]}>❌ Unhealthy Foods:</Text>
          <Text style={styles.infoText}>
            🍕 Pizza | 🍔 Burger | 🍩 Donut | 🍪 Cookie
          </Text>
        </View>

        <View style={styles.controlBox}>
          <Text style={styles.controlTitle}>Controls:</Text>
          <Text style={styles.controlText}>👆 Swipe left/right to move basket</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={startGame}>
          <Text style={styles.buttonText}>🎮 Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>💥 Game Over!</Text>
        <Text style={styles.subtitle}>You ate unhealthy food!</Text>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.levelText}>Level {level}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => setGameState('menu')}>
          <Text style={styles.buttonText}>🔄 Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.levelText}>Level: {level}</Text>
      </View>

      <View style={styles.gameArea}>
        {gameRef.current.foods.map((food) => (
          <View
            key={food.id}
            style={[
              styles.foodItem,
              {
                left: food.x,
                top: food.y,
              },
            ]}
          >
            <Text style={styles.foodEmoji}>{food.emoji}</Text>
          </View>
        ))}

        <View
          style={[
            styles.basket,
            {
              left: basketX,
            },
          ]}
        >
          <Text style={styles.basketEmoji}>🛒</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#fff9e6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#ffe6f0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
  },
  controlBox: {
    backgroundColor: '#ffe6f0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  controlText: {
    fontSize: 13,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 230, 0.8)',
  },
  foodItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: 30,
  },
  basket: {
    position: 'absolute',
    bottom: 20,
    width: 60,
    height: 40,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  basketEmoji: {
    fontSize: 24,
  },
  scoreBox: {
    backgroundColor: '#ffe6f0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
