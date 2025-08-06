import {
  users,
  games,
  gameResults,
  transactions,
  achievements,
  userAchievements,
  chatMessages,
  dailyBonuses,
  type User,
  type UpsertUser,
  type Game,
  type GameResult,
  type Transaction,
  type Achievement,
  type UserAchievement,
  type ChatMessage,
  type DailyBonus,
  type InsertGame,
  type InsertGameResult,
  type InsertTransaction,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, sum, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Game operations
  getGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Game result operations
  createGameResult(gameResult: InsertGameResult): Promise<GameResult>;
  getUserGameResults(userId: string, limit?: number): Promise<GameResult[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  updateUserBalance(userId: string, amount: string): Promise<User>;
  
  // Leaderboard operations
  getTopPlayersByWinnings(limit?: number): Promise<User[]>;
  getTopPlayersByGamesPlayed(limit?: number): Promise<User[]>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  
  // Chat operations
  getChatMessages(limit?: number): Promise<(ChatMessage & { user: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Daily bonus operations
  getDailyBonuses(): Promise<DailyBonus[]>;
  claimDailyBonus(userId: string, day: number): Promise<User>;
  canClaimDailyBonus(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Game operations
  async getGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.isActive, true));
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  // Game result operations
  async createGameResult(gameResult: InsertGameResult): Promise<GameResult> {
    const [result] = await db.insert(gameResults).values(gameResult).returning();
    return result;
  }

  async getUserGameResults(userId: string, limit = 50): Promise<GameResult[]> {
    return await db
      .select()
      .from(gameResults)
      .where(eq(gameResults.userId, userId))
      .orderBy(desc(gameResults.createdAt))
      .limit(limit);
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        balance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Leaderboard operations
  async getTopPlayersByWinnings(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalWinnings))
      .limit(limit);
  }

  async getTopPlayersByGamesPlayed(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.gamesPlayed))
      .limit(limit);
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const [achievement] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
      })
      .returning();
    return achievement;
  }

  // Chat operations
  async getChatMessages(limit = 50): Promise<(ChatMessage & { user: User })[]> {
    const results = await db
      .select({
        id: chatMessages.id,
        userId: chatMessages.userId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        user: users,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return results.map(row => ({
      id: row.id,
      userId: row.userId,
      message: row.message,
      createdAt: row.createdAt,
      user: row.user!,
    }));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Daily bonus operations
  async getDailyBonuses(): Promise<DailyBonus[]> {
    return await db.select().from(dailyBonuses);
  }

  async claimDailyBonus(userId: string, day: number): Promise<User> {
    // Get bonus amount for the day
    const [bonus] = await db
      .select()
      .from(dailyBonuses)
      .where(eq(dailyBonuses.day, day));

    if (!bonus) {
      throw new Error("Invalid bonus day");
    }

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const bonusAmount = parseFloat(bonus.amount || "0") * parseFloat(bonus.multiplier || "1");
    const newBalance = (parseFloat(user.balance || "0") + bonusAmount).toFixed(2);

    // Update user balance and last bonus claim
    const [updatedUser] = await db
      .update(users)
      .set({
        balance: newBalance,
        lastDailyBonus: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Create transaction record
    await this.createTransaction({
      userId,
      type: "bonus",
      amount: bonusAmount.toFixed(2),
      balanceAfter: newBalance,
      description: `Daily bonus day ${day}`,
    });

    return updatedUser;
  }

  async canClaimDailyBonus(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    if (!user.lastDailyBonus) return true;

    const now = new Date();
    const lastClaim = new Date(user.lastDailyBonus);
    const timeDiff = now.getTime() - lastClaim.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    return hoursDiff >= 24; // Can claim once per 24 hours
  }
}

export const storage = new DatabaseStorage();
