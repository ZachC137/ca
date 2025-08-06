import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Game routes
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // User balance and transactions
  app.get('/api/user/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ balance: user.balance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get('/api/user/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Game history
  app.get('/api/user/game-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameResults = await storage.getUserGameResults(userId);
      res.json(gameResults);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  // Play game endpoint
  const playGameSchema = z.object({
    gameType: z.string(),
    betAmount: z.number().positive(),
    gameData: z.any().optional(),
  });

  app.post('/api/games/play', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameType, betAmount, gameData } = playGameSchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance || "0");
      if (currentBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Game logic based on type
      let result: any;
      let multiplier = 0;
      let winAmount = 0;

      switch (gameType) {
        case 'slots':
          result = playSlots();
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'crash':
          const cashoutMultiplier = gameData?.cashoutMultiplier || 0;
          result = playCrash(cashoutMultiplier);
          multiplier = result.success ? cashoutMultiplier : 0;
          winAmount = result.success ? betAmount * cashoutMultiplier : 0;
          break;
        case 'dice':
          const prediction = gameData?.prediction; // 'high' or 'low'
          result = playDice(prediction);
          multiplier = result.win ? 1.95 : 0;
          winAmount = betAmount * multiplier;
          break;
        case 'coinflip':
          const choice = gameData?.choice; // 'heads' or 'tails'
          result = playCoinFlip(choice);
          multiplier = result.win ? 1.95 : 0;
          winAmount = betAmount * multiplier;
          break;
        case 'roulette':
          const bet = gameData?.bet;
          result = playRoulette(bet);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'blackjack':
          result = playBlackjack(gameData);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'plinko':
          result = playPlinko();
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'baccarat':
          const baccaratBet = gameData?.bet;
          result = playBaccarat(baccaratBet);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'keno':
          const selectedNumbers = gameData?.selectedNumbers || [];
          result = playKeno(selectedNumbers);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'wheel':
          const wheelBet = gameData?.bet;
          result = playWheel(wheelBet);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'mines':
          const { action: minesAction, grid, mineCount, revealedCells } = gameData || {};
          result = playMines(minesAction, grid, mineCount, revealedCells);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        case 'hilo':
          const { action: hiloAction, currentCard, prediction } = gameData || {};
          result = playHiLo(hiloAction, currentCard, prediction);
          multiplier = result.multiplier;
          winAmount = betAmount * multiplier;
          break;
        default:
          return res.status(400).json({ message: "Invalid game type" });
      }

      const gameResultType = winAmount > betAmount ? 'win' : winAmount === betAmount ? 'push' : 'loss';
      const newBalance = (currentBalance - betAmount + winAmount).toFixed(2);

      // Create game result
      const gameResult = await storage.createGameResult({
        userId,
        gameId: `game-${gameType}`, // In real app, get from games table
        betAmount: betAmount.toString(),
        winAmount: winAmount.toString(),
        multiplier: multiplier.toString(),
        gameData: { ...gameData, result },
        result: gameResultType,
      });

      // Update user balance
      await storage.updateUserBalance(userId, newBalance);

      // Create transaction records
      await storage.createTransaction({
        userId,
        type: "bet",
        amount: (-betAmount).toString(),
        balanceAfter: (currentBalance - betAmount).toFixed(2),
        description: `${gameType} bet`,
        gameResultId: gameResult.id,
      });

      if (winAmount > 0) {
        await storage.createTransaction({
          userId,
          type: "win",
          amount: winAmount.toString(),
          balanceAfter: newBalance,
          description: `${gameType} win`,
          gameResultId: gameResult.id,
        });
      }

      res.json({
        result: gameResultType,
        multiplier,
        winAmount,
        betAmount,
        newBalance,
        gameData: result,
      });
    } catch (error) {
      console.error("Error playing game:", error);
      res.status(500).json({ message: "Failed to play game" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const topPlayers = await storage.getTopPlayersByWinnings(10);
      res.json(topPlayers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Add funds to wallet
  app.post('/api/wallet/add-funds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, method } = req.body;

      if (!amount || amount <= 0 || amount > 10000) {
        return res.status(400).json({ message: "Invalid amount. Must be between $1 and $10,000" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance || "0");
      const newBalance = (currentBalance + amount).toFixed(2);

      // Update user balance
      await storage.updateUserBalance(userId, newBalance);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        balanceAfter: newBalance,
        description: `Virtual funds deposit via ${method}`,
      });

      res.json({ 
        message: "Funds added successfully", 
        newBalance,
        amount: amount.toFixed(2)
      });
    } catch (error) {
      console.error("Error adding funds:", error);
      res.status(500).json({ message: "Failed to add funds" });
    }
  });

  // Daily bonus
  app.post('/api/daily-bonus', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const canClaim = await storage.canClaimDailyBonus(userId);
      if (!canClaim) {
        return res.status(400).json({ message: "Daily bonus already claimed" });
      }

      const user = await storage.claimDailyBonus(userId, 1); // Day 1 for now
      res.json({ message: "Daily bonus claimed", newBalance: user.balance });
    } catch (error) {
      console.error("Error claiming daily bonus:", error);
      res.status(500).json({ message: "Failed to claim daily bonus" });
    }
  });

  app.get('/api/daily-bonus/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const canClaim = await storage.canClaimDailyBonus(userId);
      res.json({ canClaim });
    } catch (error) {
      console.error("Error checking daily bonus status:", error);
      res.status(500).json({ message: "Failed to check bonus status" });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', async (req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'chat') {
          // Handle chat message
          const chatMessage = await storage.createChatMessage({
            userId: data.userId,
            message: data.message,
          });

          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat',
                message: chatMessage,
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}

// Game logic functions
function playSlots() {
  const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
  const reels = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  let multiplier = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // Three of a kind
    multiplier = reels[0] === '💎' ? 50 : reels[0] === '7️⃣' ? 25 : 10;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    // Two of a kind
    multiplier = 2;
  }

  return { reels, multiplier };
}

function playCrash(cashoutMultiplier: number) {
  const crashPoint = Math.random() * 10 + 1; // Random crash between 1x and 11x
  const success = cashoutMultiplier <= crashPoint;
  return { crashPoint, success, cashoutMultiplier };
}

function playDice(prediction: 'high' | 'low') {
  const roll = Math.floor(Math.random() * 100) + 1; // 1-100
  const win = (prediction === 'high' && roll > 50) || (prediction === 'low' && roll <= 50);
  return { roll, prediction, win };
}

function playCoinFlip(choice: 'heads' | 'tails') {
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const win = choice === result;
  return { result, choice, win };
}

function playRoulette(bet: any) {
  const number = Math.floor(Math.random() * 37); // 0-36
  const color = number === 0 ? 'green' : (number % 2 === 0 ? 'black' : 'red');
  
  let multiplier = 0;
  if (bet.type === 'number' && bet.value === number) {
    multiplier = 35;
  } else if (bet.type === 'color' && bet.value === color) {
    multiplier = 2;
  } else if (bet.type === 'odd_even') {
    const isEven = number !== 0 && number % 2 === 0;
    if ((bet.value === 'even' && isEven) || (bet.value === 'odd' && !isEven)) {
      multiplier = 2;
    }
  }
  
  return { number, color, multiplier };
}

function playBlackjack(gameData: any) {
  const { action, playerHand, dealerHand, gameState } = gameData;

  // Create a deck of cards
  function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit });
      }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  // Calculate hand value
  function calculateHandValue(hand: any[]) {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  }

  // Deal initial hand
  if (action === 'deal' || !gameState) {
    const deck = createDeck();
    const newPlayerHand = [deck.pop(), deck.pop()];
    const newDealerHand = [deck.pop(), deck.pop()];
    
    const playerValue = calculateHandValue(newPlayerHand);
    const dealerValue = calculateHandValue(newDealerHand);
    
    // Check for natural blackjack
    const playerBlackjack = playerValue === 21;
    const dealerBlackjack = dealerValue === 21;
    
    let multiplier = 0;
    let gameComplete = false;
    
    if (playerBlackjack && dealerBlackjack) {
      multiplier = 1; // Push
      gameComplete = true;
    } else if (playerBlackjack) {
      multiplier = 2.5; // Blackjack pays 3:2
      gameComplete = true;
    } else if (dealerBlackjack) {
      multiplier = 0; // Dealer blackjack
      gameComplete = true;
    }
    
    return {
      playerHand: newPlayerHand,
      dealerHand: newDealerHand,
      playerValue,
      dealerValue,
      multiplier,
      gameComplete,
      canHit: !gameComplete && playerValue < 21,
      canStand: !gameComplete,
      remainingDeck: deck
    };
  }

  // Handle hit action
  if (action === 'hit') {
    const deck = gameState.remainingDeck || createDeck();
    const newPlayerHand = [...playerHand, deck.pop()];
    const playerValue = calculateHandValue(newPlayerHand);
    
    let multiplier = 0;
    let gameComplete = false;
    
    if (playerValue > 21) {
      multiplier = 0; // Player busts
      gameComplete = true;
    }
    
    return {
      playerHand: newPlayerHand,
      dealerHand,
      playerValue,
      dealerValue: calculateHandValue(dealerHand),
      multiplier,
      gameComplete,
      canHit: !gameComplete && playerValue < 21,
      canStand: !gameComplete,
      remainingDeck: deck
    };
  }

  // Handle stand action
  if (action === 'stand') {
    let deck = gameState.remainingDeck || createDeck();
    let newDealerHand = [...dealerHand];
    let dealerValue = calculateHandValue(newDealerHand);
    const playerValue = calculateHandValue(playerHand);
    
    // Dealer hits on 16, stands on 17
    while (dealerValue < 17) {
      newDealerHand.push(deck.pop());
      dealerValue = calculateHandValue(newDealerHand);
    }
    
    let multiplier = 0;
    
    if (dealerValue > 21) {
      multiplier = 2; // Dealer busts
    } else if (playerValue > dealerValue) {
      multiplier = 2; // Player wins
    } else if (playerValue === dealerValue) {
      multiplier = 1; // Push
    } else {
      multiplier = 0; // Dealer wins
    }
    
    return {
      playerHand,
      dealerHand: newDealerHand,
      playerValue,
      dealerValue,
      multiplier,
      gameComplete: true,
      canHit: false,
      canStand: false,
      remainingDeck: deck
    };
  }

  // Default fallback
  return {
    playerHand: playerHand || [],
    dealerHand: dealerHand || [],
    playerValue: calculateHandValue(playerHand || []),
    dealerValue: calculateHandValue(dealerHand || []),
    multiplier: 0,
    gameComplete: false,
    canHit: true,
    canStand: true,
    remainingDeck: []
  };
}

function playPlinko() {
  const multipliers = [0.2, 0.5, 1, 1.5, 2, 5, 10, 5, 2, 1.5, 1, 0.5, 0.2];
  const slot = Math.floor(Math.random() * multipliers.length);
  return { slot, multiplier: multipliers[slot] };
}

function playBaccarat(bet: { type: 'player' | 'banker' | 'tie' }) {
  // Deal cards
  const dealCard = () => Math.floor(Math.random() * 13) + 1;
  const cardValue = (card: number) => card > 10 ? 0 : card;
  
  let playerCards = [dealCard(), dealCard()];
  let bankerCards = [dealCard(), dealCard()];
  
  let playerTotal = (cardValue(playerCards[0]) + cardValue(playerCards[1])) % 10;
  let bankerTotal = (cardValue(bankerCards[0]) + cardValue(bankerCards[1])) % 10;
  
  // Third card rules
  if (playerTotal <= 5) {
    const thirdCard = dealCard();
    playerCards.push(thirdCard);
    playerTotal = (playerTotal + cardValue(thirdCard)) % 10;
  }
  
  if (bankerTotal <= 6 && playerCards.length === 2) {
    const thirdCard = dealCard();
    bankerCards.push(thirdCard);
    bankerTotal = (bankerTotal + cardValue(thirdCard)) % 10;
  }
  
  let winner: 'player' | 'banker' | 'tie';
  if (playerTotal > bankerTotal) winner = 'player';
  else if (bankerTotal > playerTotal) winner = 'banker';
  else winner = 'tie';
  
  let multiplier = 0;
  if (bet.type === winner) {
    multiplier = winner === 'tie' ? 8 : winner === 'banker' ? 1.95 : 2;
  }
  
  return { playerCards, bankerCards, playerTotal, bankerTotal, winner, multiplier };
}

function playKeno(selectedNumbers: number[]) {
  // Draw 20 random numbers from 1-80
  const drawnNumbers = [];
  while (drawnNumbers.length < 20) {
    const num = Math.floor(Math.random() * 80) + 1;
    if (!drawnNumbers.includes(num)) {
      drawnNumbers.push(num);
    }
  }
  
  const matches = selectedNumbers.filter(num => drawnNumbers.includes(num)).length;
  const spots = selectedNumbers.length;
  
  // Keno payout table (simplified)
  const payoutTable: { [key: string]: { [key: number]: number } } = {
    '1': { 1: 3 },
    '2': { 2: 12 },
    '3': { 2: 1, 3: 42 },
    '4': { 2: 1, 3: 4, 4: 142 },
    '5': { 3: 1, 4: 12, 5: 810 },
    '6': { 3: 1, 4: 3, 5: 72, 6: 1800 },
    '7': { 4: 1, 5: 21, 6: 400, 7: 7000 },
    '8': { 5: 12, 6: 98, 7: 1652, 8: 25000 },
    '9': { 5: 5, 6: 44, 7: 335, 8: 4700, 9: 25000 },
    '10': { 5: 2, 6: 24, 7: 142, 8: 1000, 9: 4500, 10: 25000 }
  };
  
  const multiplier = payoutTable[spots.toString()]?.[matches] || 0;
  
  return { drawnNumbers, matches, multiplier, selectedNumbers };
}

function playWheel(bet: { type: 'number' | 'color' | 'multiplier', value: any }) {
  const segments = [
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 10, color: 'green', multiplier: 10 },
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 20, color: 'purple', multiplier: 20 },
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 40, color: 'orange', multiplier: 40 }
  ];
  
  const winningSegment = segments[Math.floor(Math.random() * segments.length)];
  let multiplier = 0;
  
  if (bet.type === 'number' && bet.value === winningSegment.number) {
    multiplier = winningSegment.multiplier;
  } else if (bet.type === 'color' && bet.value === winningSegment.color) {
    multiplier = 2;
  } else if (bet.type === 'multiplier' && bet.value === winningSegment.multiplier) {
    multiplier = winningSegment.multiplier;
  }
  
  return { winningSegment, multiplier };
}

function playMines(action: string, grid?: boolean[][], mineCount = 5, revealedCells?: boolean[][]) {
  if (action === 'start' || !grid) {
    // Initialize new game
    const newGrid = Array(5).fill(null).map(() => Array(5).fill(false));
    const newRevealed = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      if (!newGrid[row][col]) {
        newGrid[row][col] = true;
        minesPlaced++;
      }
    }
    
    return { grid: newGrid, revealedCells: newRevealed, multiplier: 1, gameOver: false, won: false };
  }
  
  if (action === 'reveal') {
    const { row, col } = arguments[4] || {};
    if (grid && revealedCells && typeof row === 'number' && typeof col === 'number') {
      const newRevealed = revealedCells.map(r => [...r]);
      newRevealed[row][col] = true;
      
      if (grid[row][col]) {
        // Hit a mine
        return { grid, revealedCells: newRevealed, multiplier: 0, gameOver: true, won: false };
      } else {
        // Safe cell
        const revealedCount = newRevealed.flat().filter(Boolean).length;
        const safeCount = 25 - mineCount;
        const multiplier = Math.pow(1.2, revealedCount);
        
        if (revealedCount === safeCount) {
          // Won the game
          return { grid, revealedCells: newRevealed, multiplier, gameOver: true, won: true };
        }
        
        return { grid, revealedCells: newRevealed, multiplier, gameOver: false, won: false };
      }
    }
  }
  
  return { grid: grid || [], revealedCells: revealedCells || [], multiplier: 0, gameOver: false, won: false };
}

function playHiLo(action: string, currentCard?: number, prediction?: 'higher' | 'lower') {
  if (action === 'start' || !currentCard) {
    const newCard = Math.floor(Math.random() * 13) + 1; // 1-13 (A-K)
    return { currentCard: newCard, multiplier: 1, gameOver: false, streak: 0 };
  }
  
  if (action === 'predict' && currentCard && prediction) {
    const nextCard = Math.floor(Math.random() * 13) + 1;
    let correct = false;
    
    if (prediction === 'higher' && nextCard > currentCard) correct = true;
    if (prediction === 'lower' && nextCard < currentCard) correct = true;
    if (nextCard === currentCard) correct = false; // Tie loses
    
    if (correct) {
      const streak = (arguments[3] || 0) + 1;
      const multiplier = Math.pow(1.5, streak);
      return { currentCard: nextCard, nextCard, multiplier, gameOver: false, streak, correct };
    } else {
      return { currentCard, nextCard, multiplier: 0, gameOver: true, streak: 0, correct };
    }
  }
  
  return { currentCard: currentCard || 1, multiplier: 0, gameOver: false, streak: 0 };
}
