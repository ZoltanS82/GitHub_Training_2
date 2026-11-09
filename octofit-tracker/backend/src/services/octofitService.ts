import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity input is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw Object.assign(new Error('userId must be a valid Mongo object id'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('teamId must be a valid Mongo object id'), { status: 400 });
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team input is required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('mascot is required'), { status: 400 });
  }

  let normalizedMembers: string[] = [];
  if (members !== undefined) {
    if (!Array.isArray(members)) {
      throw Object.assign(new Error('members must be an array of user ids'), { status: 400 });
    }
    normalizedMembers = members.map((member) => {
      if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
        throw Object.assign(new Error('members must contain valid Mongo object ids'), { status: 400 });
      }
      return member;
    });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return rows.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw Object.assign(new Error('userEmail is required'), { status: 400 });
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const fallbackFocus = recentActivities[0]?.type ?? user.fitnessGoal ?? 'endurance';
  const focusByType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    yoga: 'mobility',
    walk: 'mobility',
  };

  const preferredFocus = focusByType[String(fallbackFocus).toLowerCase()] ?? String(fallbackFocus).toLowerCase();

  const workouts = await Workout.find({ focus: preferredFocus }).lean();
  if (!workouts.length) {
    return [];
  }

  const [firstWorkout] = workouts;
  const activitySummary = recentActivities[0]?.type ?? user.fitnessGoal ?? 'recent activity';

  return [{
    ...firstWorkout,
    reason: `Based on your recent ${activitySummary} activity, this ${firstWorkout.focus} workout matches your training pattern.`,
  }];
}

export { User };
