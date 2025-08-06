import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("1000.00"),
  totalWinnings: decimal("total_winnings", { precision: 12, scale: 2 }).default("0.00"),
  totalLosses: decimal("total_losses", { precision: 12, scale: 2 }).default("0.00"),
  gamesPlayed: integer("games_played").default(0),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  lastDailyBonus: timestamp("last_daily_bonus"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // slots, crash, dice, etc.
  isActive: boolean("is_active").default(true),
  minBet: decimal("min_bet", { precision: 8, scale: 2 }).default("1.00"),
  maxBet: decimal("max_bet", { precision: 8, scale: 2 }).default("1000.00"),
  houseEdge: decimal("house_edge", { precision: 4, scale: 4 }).default("0.0200"), // 2%
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).default("0.00"),
  multiplier: decimal("multiplier", { precision: 6, scale: 2 }),
  gameData: jsonb("game_data"), // game-specific data
  result: varchar("result").notNull(), // win, loss, push
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, bet, win, bonus
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  gameResultId: varchar("game_result_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
  requirement: jsonb("requirement").notNull(), // conditions to unlock
  reward: decimal("reward", { precision: 8, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyBonuses = pgTable("daily_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  day: integer("day").notNull(), // 1-7 for consecutive days
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).default("1.00"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  gameResults: many(gameResults),
  transactions: many(transactions),
  userAchievements: many(userAchievements),
  chatMessages: many(chatMessages),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  gameResults: many(gameResults),
}));

export const gameResultsRelations = relations(gameResults, ({ one, many }) => ({
  user: one(users, {
    fields: [gameResults.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameResults.gameId],
    references: [games.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  gameResult: one(gameResults, {
    fields: [transactions.gameResultId],
    references: [gameResults.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertGameSchema = createInsertSchema(games);
export const insertGameResultSchema = createInsertSchema(gameResults);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertDailyBonusSchema = createInsertSchema(dailyBonuses);

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type DailyBonus = typeof dailyBonuses.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
