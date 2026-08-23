export type TaskCadence = 'daily' | 'weekly';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export type TaskCondition =
  | { type: 'rovers.sessionsPlayed'; target: number }
  | { type: 'rovers.totalMerges'; target: number }
  | { type: 'rovers.highestLevelInSession'; target: number }
  | { type: 'rovers.scoreInSession'; target: number }
  | { type: 'rovers.totalScore'; target: number }
  | { type: 'rovers.legendaryCreated'; target: number }
  | { type: 'rovers.playTimeSeconds'; target: number }
  | { type: 'rovers.communityPointsEarned'; target: number }
  | { type: 'profile.xpEarned'; target: number }
  | { type: 'profile.levelsGained'; target: number }
  | { type: 'profile.achievementUnlocked'; target: number }
  | { type: 'navigation.profileVisited'; target: number }
  | { type: 'navigation.leaderboardVisited'; target: number }
  | { type: 'navigation.gamercommOpened'; target: number };

export interface TaskDefinition {
  id: string;
  cadence: TaskCadence;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  condition: TaskCondition;
  reward: { xp: number; communityPoints: number };
  iconId: string;
  enabled: boolean;
}

export interface ActiveTask {
  instanceId: string;
  definitionId: string;
  cadence: TaskCadence;
  periodKey: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  claimed: boolean;
  claimedAt: string | null;
}

export interface PlayerTasksState {
  version: 1;
  dailyPeriodKey: string;
  weeklyPeriodKey: string;
  daily: ActiveTask[];
  weekly: ActiveTask[];
  completedTaskInstanceIds: string[];
  processedEventIds: string[];
  unseenCompletedTaskInstanceIds: string[];
  totalClaimed: number;
  totalRewardXp: number;
  totalRewardCommunityPoints: number;
  lastUpdatedAt: string;
  lastSeenAt: string;
  clockWarning: boolean;
}

export type ProgressionEvent =
  | {
      id: string;
      type: 'rovers.sessionCompleted';
      sessionId: string;
      score: number;
      highestLevel: number;
      merges: number;
      legendaryCreated: number;
      durationSeconds: number;
      xpEarned: number;
      communityPointsEarned: number;
      levelsGained: number;
      achievementIds: string[];
      occurredAt: string;
    }
  | {
      id: string;
      type:
        | 'navigation.profileVisited'
        | 'navigation.leaderboardVisited'
        | 'navigation.gamercommOpened';
      occurredAt: string;
    };

export interface TaskEventResult {
  duplicate: boolean;
  newlyCompleted: ActiveTask[];
}
