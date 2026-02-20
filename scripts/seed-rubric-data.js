import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';

dotenv.config();

const DEFAULT_USERS = 40;
const DEFAULT_HABITS_PER_USER = 30;
const DEFAULT_JOURNALS_PER_USER = 6;
const USERNAME_PREFIX = 'user_';
const DEFAULT_PASSWORD = '123456';
const MIN_FRIENDS_PER_USER = 2;
const MAX_FRIENDS_PER_USER = 6;
const JOURNAL_IMAGE_POOL = [
  '/img/minimalist-mountains-river-at-dawn-desktop-wallpaper.jpg',
  '/img/pastel-ocean-sunset-aesthetic-desktop-wallpaper-4k.jpg',
  '/img/wp13694694-ultrawide-minimalist-wallpapers.jpg',
  '/img/wp13694699-ultrawide-minimalist-wallpapers.jpg',
];

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

  const rawJournalImage = args.get('--journal-image');
  const journalImage =
    typeof rawJournalImage === 'string' && rawJournalImage.trim()
      ? rawJournalImage.trim()
      : '';

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
    journalImage,
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

function randomUniqueItems(items, count) {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) return [];
  const copy = [...items];
  copy.sort(() => Math.random() - 0.5);
  return copy.slice(0, Math.min(count, copy.length));
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function clearExistingSeedData({
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
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomInt(0, 120));

    return {
      username: `${USERNAME_PREFIX}${index + 1}`,
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
        description: `Demo habit ${i} generated for sample data.`,
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

function connectUsers(friendSets, leftIndex, rightIndex) {
  if (leftIndex === rightIndex) return;
  friendSets[leftIndex].add(rightIndex);
  friendSets[rightIndex].add(leftIndex);
}

function buildFriendNetwork(userDocs) {
  const totalUsers = userDocs.length;
  const friendSets = Array.from({ length: totalUsers }, () => new Set());

  if (totalUsers <= 1) return [];

  for (let index = 0; index < totalUsers; index += 1) {
    connectUsers(friendSets, index, (index + 1) % totalUsers);
  }

  const minFriends = Math.min(MIN_FRIENDS_PER_USER, totalUsers - 1);
  const maxFriends = Math.min(MAX_FRIENDS_PER_USER, totalUsers - 1);
  const targetCounts = Array.from({ length: totalUsers }, () =>
    randomInt(minFriends, maxFriends)
  );

  let changed = true;
  let guard = 0;
  const guardLimit = totalUsers * totalUsers * 4;

  while (changed && guard < guardLimit) {
    changed = false;
    guard += 1;

    for (let index = 0; index < totalUsers; index += 1) {
      if (friendSets[index].size >= targetCounts[index]) continue;

      const candidates = [];
      for (let candidate = 0; candidate < totalUsers; candidate += 1) {
        if (candidate === index) continue;
        if (friendSets[index].has(candidate)) continue;

        if (
          friendSets[candidate].size >= targetCounts[candidate] &&
          Math.random() < 0.7
        ) {
          continue;
        }

        candidates.push(candidate);
      }

      if (!candidates.length) continue;

      const candidate =
        candidates[randomInt(0, Math.max(0, candidates.length - 1))];
      connectUsers(friendSets, index, candidate);
      changed = true;
    }
  }

  return userDocs.map((userDoc, index) => {
    const friendIds = [...friendSets[index]].map(
      (friendIndex) => userDocs[friendIndex]._id
    );
    const maxPins = Math.min(2, friendIds.length);
    const pinCount = maxPins > 0 ? randomInt(0, maxPins) : 0;
    const pinnedFriends = randomUniqueItems(friendIds, pinCount);

    return {
      userId: userDoc._id,
      friends: friendIds,
      pinnedFriends,
    };
  });
}

function buildJournals({ userDocs, journalsPerUser, journalImage }) {
  const journalDocs = [];
  const preferredImage = journalImage || null;

  userDocs.forEach((userDoc, userIndex) => {
    for (let i = 0; i < journalsPerUser; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const images = preferredImage
        ? [preferredImage]
        : randomUniqueItems(JOURNAL_IMAGE_POOL, randomInt(1, 2));

      journalDocs.push({
        userId: userDoc._id,
        date,
        content: `Daily journal entry #${i + 1} for user ${userIndex + 1}.`,
        images,
        createdAt: new Date(date),
        updatedAt: new Date(),
      });
    }
  });

  return journalDocs;
}

async function main() {
  const { users, habitsPerUser, journalsPerUser, journalImage } = parseArgs();
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

    await clearExistingSeedData({
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

    const friendNetwork = buildFriendNetwork(insertedUserDocs);
    if (friendNetwork.length) {
      await usersCollection.bulkWrite(
        friendNetwork.map((entry) => ({
          updateOne: {
            filter: { _id: entry.userId },
            update: {
              $set: {
                friends: entry.friends,
                pinnedFriends: entry.pinnedFriends,
              },
            },
          },
        }))
      );
    }

    const habitDocs = buildHabits({
      userDocs: insertedUserDocs,
      habitsPerUser,
    });

    const journalDocs = buildJournals({
      userDocs: insertedUserDocs,
      journalsPerUser,
      journalImage,
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
    const totalDirectionalFriendLinks = friendNetwork.reduce(
      (sum, entry) => sum + entry.friends.length,
      0
    );

    console.log('Seed completed successfully.');
    console.log(`Users inserted: ${userCount}`);
    console.log(`Habits inserted: ${habitCount}`);
    console.log(`Journal entries inserted: ${journalCount}`);
    console.log(
      `Friend connections created: ${Math.floor(totalDirectionalFriendLinks / 2)}`
    );
    console.log(`Default seed password: ${DEFAULT_PASSWORD}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
