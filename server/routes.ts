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
