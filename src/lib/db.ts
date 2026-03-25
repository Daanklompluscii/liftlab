import Dexie, { type Table } from 'dexie';
import type { UserProfile, Program, WorkoutLog } from '../types';

export class LiftLabDB extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  programs!: Table<Program, string>;
  workoutLogs!: Table<WorkoutLog, string>;

  constructor() {
    super('liftlab');

    this.version(1).stores({
      userProfiles: 'id, createdAt',
      programs: 'id, userId, createdAt',
      workoutLogs: 'id, programWorkoutId, startedAt',
    });
  }
}

export const db = new LiftLabDB();
