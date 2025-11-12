import { Task } from "./types";

/**
 * Calculate the current streak for a daily task
 * A streak is the number of consecutive days (including today) that the task has been completed
 */
export function calculateStreak(task: Task): number {
  if (!task.isDaily || !task.completionHistory) {
    return 0;
  }

  const history = task.completionHistory;
  const today = new Date();
  let streak = 0;

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    // Max check 1 year back
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (history[dateStr] === true) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}

/**
 * Get the longest streak for a daily task
 */
export function calculateLongestStreak(task: Task): number {
  if (!task.isDaily || !task.completionHistory) {
    return 0;
  }

  const history = task.completionHistory;
  const dates = Object.keys(history)
    .filter((date) => history[date] === true)
    .sort();

  if (dates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);

    // Check if dates are consecutive
    const dayDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Get completion rate for a task (percentage of days completed)
 */
export function calculateCompletionRate(task: Task, days: number = 30): number {
  if (!task.isDaily) return 0;

  const history = task.completionHistory || {};
  const today = new Date();
  const taskCreatedDate = new Date(task.createdAt);

  let completedDays = 0;
  let totalDays = 0;

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    // Only count days after task was created
    if (checkDate < taskCreatedDate) break;

    const dateStr = checkDate.toISOString().split("T")[0];
    totalDays++;

    if (history[dateStr] === true) {
      completedDays++;
    }
  }

  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
}
