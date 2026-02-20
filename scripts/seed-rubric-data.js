import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';

dotenv.config();

const DEFAULT_USERS = 40;
const DEFAULT_HABITS_PER_USER = 30;
const DEFAULT_JOURNALS_PER_USER = 6;
const USERNAME_PREFIX = 'rubric_user_';
const DEFAULT_PASSWORD = 'HabitFlow123!';

function parsePositiveInt(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseArgs() {
  const args = new Map(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.split('=');
      return [key, value];
    })
  );

  return {
    users: parsePositiveInt(args.get('--users'), DEFAULT_USERS),
    habitsPerUser: parsePositiveInt(
      args.get('--habits-per-user'),
      DEFAULT_HABITS_PER_USER
    ),
    journalsPerUser: parsePositiveInt(
      args.get('--journals-per-user'),
      DEFAULT_JOURNALS_PER_USER
    ),
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrequency() {
  const days = [0, 1, 2, 3, 4, 5, 6];
  const take = randomInt(3, 7);
  const shuffled = [...days].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, take).sort((a, b) => a - b);
}

function randomCompletions(maxEntries = 15, daysBack = 90) {
  const completionCount = randomInt(0, maxEntries);
  const seen = new Set();
  const completions = [];

  while (completions.length < completionCount) {
    const offset = randomInt(0, daysBack);
    if (seen.has(offset)) continue;
    seen.add(offset);

    const date = new Date();
    date.setDate(date.getDate() - offset);
    date.setHours(0, 0, 0, 0);

    completions.push({ date });
  }

  completions.sort((a, b) => a.date - b.date);
  return completions;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function clearExistingRubricData({
  usersCollection,
  habitsCollection,
  journalCollection,
}) {
  const existingUsers = await usersCollection
    .find(
      { username: { $regex: `^${USERNAME_PREFIX}` } },
      { projection: { _id: 1 } }
    )
    .toArray();

  const existingIds = existingUsers.map((user) => user._id);
  if (!existingIds.length) return;

  await Promise.all([
    habitsCollection.deleteMany({ userId: { $in: existingIds } }),
    journalCollection.deleteMany({ userId: { $in: existingIds } }),
    usersCollection.deleteMany({ _id: { $in: existingIds } }),
    usersCollection.updateMany(
      {
        $or: [
          { friends: { $in: existingIds } },
          { pinnedFriends: { $in: existingIds } },
        ],
      },
      {
        $pull: {
          friends: { $in: existingIds },
          pinnedFriends: { $in: existingIds },
        },
      }
    ),
  ]);
}

function buildUsers({ count, passwordHash }) {
  return Array.from({ length: count }, (_, index) => {
    const serial = String(index + 1).padStart(3, '0');
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomInt(0, 120));

    return {
      username: `${USERNAME_PREFIX}${serial}`,
      password: passwordHash,
      shareCode: `HABIT-${String(60000 + index)}`,
      friends: [],
      pinnedFriends: [],
      createdAt,
    };
  });
}

function buildHabits({ userDocs, habitsPerUser }) {
  const habitDocs = [];

  userDocs.forEach((userDoc, userIndex) => {
    for (let i = 1; i <= habitsPerUser; i += 1) {
      const completions = randomCompletions();
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomInt(0, 120));

      habitDocs.push({
        userId: userDoc._id,
        name: `Habit ${i} - User ${userIndex + 1}`,
        description: `Demo habit ${i} created for rubric data seeding.`,
        cueTime: '',
        cueLocation: '',
        stackAfter: '',
        tinyVersion: '',
        frequency: randomFrequency(),
        completions,
        currentStreak: randomInt(0, 30),
        createdAt,
      });
    }
  });

  return habitDocs;
}

function buildJournals({ userDocs, journalsPerUser }) {
  const journalDocs = [];

  userDocs.forEach((userDoc, userIndex) => {
    for (let i = 0; i < journalsPerUser; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      journalDocs.push({
        userId: userDoc._id,
        date,
        content: `Rubric seed journal entry #${i + 1} for user ${userIndex + 1}.`,
        images: [],
        createdAt: new Date(date),
        updatedAt: new Date(),
      });
    }
  });

  return journalDocs;
}

async function main() {
  const { users, habitsPerUser, journalsPerUser } = parseArgs();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment variables.');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    const habitsCollection = db.collection('habits');
    const journalCollection = db.collection('journal');

    await clearExistingRubricData({
      usersCollection,
      habitsCollection,
      journalCollection,
    });

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const usersToInsert = buildUsers({ count: users, passwordHash });
    const insertUsersResult = await usersCollection.insertMany(usersToInsert);

    const insertedUserDocs = usersToInsert.map((userDoc, index) => ({
      ...userDoc,
      _id: insertUsersResult.insertedIds[index],
    }));

    const habitDocs = buildHabits({
      userDocs: insertedUserDocs,
      habitsPerUser,
    });

    const journalDocs = buildJournals({
      userDocs: insertedUserDocs,
      journalsPerUser,
    });

    const habitChunks = chunkArray(habitDocs, 1000);
    for (const habitChunk of habitChunks) {
      await habitsCollection.insertMany(habitChunk);
    }

    const journalChunks = chunkArray(journalDocs, 1000);
    for (const journalChunk of journalChunks) {
      await journalCollection.insertMany(journalChunk);
    }

    const [userCount, habitCount, journalCount] = await Promise.all([
      usersCollection.countDocuments({
        username: { $regex: `^${USERNAME_PREFIX}` },
      }),
      habitsCollection.countDocuments({
        userId: { $in: insertedUserDocs.map((u) => u._id) },
      }),
      journalCollection.countDocuments({
        userId: { $in: insertedUserDocs.map((u) => u._id) },
      }),
    ]);

    console.log('Rubric seed completed successfully.');
    console.log(`Users inserted: ${userCount}`);
    console.log(`Habits inserted: ${habitCount}`);
    console.log(`Journal entries inserted: ${journalCount}`);
    console.log(`Default seed password for rubric users: ${DEFAULT_PASSWORD}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Rubric seed failed:', error);
  process.exit(1);
});
