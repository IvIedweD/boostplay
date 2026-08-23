import type { TaskTimeProvider } from './TaskTimeProvider';

const pad = (value: number) => String(value).padStart(2, '0');

export class LocalTaskTimeProvider implements TaskTimeProvider {
  private developmentOffsetMs = 0;

  constructor(private readonly nowOverride?: () => Date) {}

  now() {
    const current = this.nowOverride?.() ?? new Date();
    return new Date(current.getTime() + this.developmentOffsetMs);
  }

  setDevelopmentOffset(offsetMs: number) {
    this.developmentOffsetMs = offsetMs;
  }

  getDailyPeriodKey(date = this.now()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  getWeeklyPeriodKey(date = this.now()) {
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = local.getDay() || 7;
    local.setDate(local.getDate() + 4 - day);
    const yearStart = new Date(local.getFullYear(), 0, 1);
    const week = Math.ceil((((local.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${local.getFullYear()}-W${pad(week)}`;
  }

  getNextDailyReset(date = this.now()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }

  getNextWeeklyReset(date = this.now()) {
    const day = date.getDay() || 7;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (8 - day));
  }
}

export const localTaskTimeProvider = new LocalTaskTimeProvider();
