export interface TaskTimeProvider {
  now(): Date;
  getDailyPeriodKey(date?: Date): string;
  getWeeklyPeriodKey(date?: Date): string;
  getNextDailyReset(date?: Date): Date;
  getNextWeeklyReset(date?: Date): Date;
}
