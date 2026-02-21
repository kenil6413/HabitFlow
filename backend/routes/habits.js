import express from 'express';
import { getDB } from '../db/connection.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();
const MAX_PLAN_FIELD_LENGTH = 120;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function dateKeyFromValue(value) {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value.trim());
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}`;
}

function parseDateKeyToUTCDate(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month, day));
}

function normalizePlanField(value, maxLength = MAX_PLAN_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function isSameDate(a, b) {
  const left = dateKeyFromValue(a);
  const right = dateKeyFromValue(b);
  return Boolean(left && right && left === right);
}

function normalizeFrequency(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((d) => typeof d === 'number' && d >= 0 && d <= 6);
}

router.post('/', async (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      cueTime,
      cueLocation,
      stackAfter,
      tinyVersion,
      frequency,
    } = req.body;
    const userObjectId = toObjectIdOrNull(userId);

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const newHabit = {
      userId: userObjectId,
      name,
      description: description || '',
      cueTime: normalizePlanField(cueTime, 8),
      cueLocation: normalizePlanField(cueLocation),
      stackAfter: normalizePlanField(stackAfter),
      tinyVersion: normalizePlanField(tinyVersion),
      frequency: normalizeFrequency(frequency),
      completions: [],
      currentStreak: 0,
      createdAt: new Date(),
    };

    const result = await habitsCollection.insertOne(newHabit);

    res.status(201).json({
      message: 'Habit created successfully',
      habitId: result.insertedId,
      habit: newHabit,
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = toObjectIdOrNull(userId);

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habits = await habitsCollection
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      message: 'Habits retrieved successfully',
      count: habits.length,
      habits,
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habit = await habitsCollection.findOne({ _id: habitObjectId });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({
      message: 'Habit retrieved successfully',
      habit,
    });
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const {
      name,
      description,
      cueTime,
      cueLocation,
      stackAfter,
      tinyVersion,
      frequency,
    } = req.body;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const updateData = {
      name,
      description: description || '',
    };

    if (cueTime !== undefined)
      updateData.cueTime = normalizePlanField(cueTime, 8);
    if (cueLocation !== undefined)
      updateData.cueLocation = normalizePlanField(cueLocation);
    if (stackAfter !== undefined)
      updateData.stackAfter = normalizePlanField(stackAfter);
    if (tinyVersion !== undefined)
      updateData.tinyVersion = normalizePlanField(tinyVersion);
    if (frequency !== undefined)
      updateData.frequency = normalizeFrequency(frequency);

    const result = await habitsCollection.updateOne(
      { _id: habitObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({ message: 'Habit updated successfully' });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const result = await habitsCollection.deleteOne({ _id: habitObjectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:habitId/complete', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const todayKey = dateKeyFromValue(new Date());

    const habit = await habitsCollection.findOne({ _id: habitObjectId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const alreadyCompleted = habit.completions.some((completion) => {
      return dateKeyFromValue(completion.date) === todayKey;
    });

    if (alreadyCompleted) {
      return res.status(400).json({ error: 'Habit already completed today' });
    }

    const newCompletion = { date: todayKey, completed: true };
    const newStreak = calculateStreak([...habit.completions, newCompletion]);

    await habitsCollection.updateOne(
      { _id: habitObjectId },
      {
        $push: { completions: newCompletion },
        $set: { currentStreak: newStreak },
      }
    );

    res.status(200).json({
      message: 'Habit completed for today',
      currentStreak: newStreak,
    });
  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:habitId/complete/today', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const todayKey = dateKeyFromValue(new Date());

    const habit = await habitsCollection.findOne({ _id: habitObjectId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const filteredCompletions = (habit.completions || []).filter(
      (completion) => {
        return dateKeyFromValue(completion.date) !== todayKey;
      }
    );

    if (filteredCompletions.length === (habit.completions || []).length) {
      return res
        .status(400)
        .json({ error: 'Habit is not marked complete for today' });
    }

    const newStreak = calculateStreak(filteredCompletions);

    await habitsCollection.updateOne(
      { _id: habitObjectId },
      { $set: { completions: filteredCompletions, currentStreak: newStreak } }
    );

    res.status(200).json({
      message: 'Habit completion removed for today',
      currentStreak: newStreak,
    });
  } catch (error) {
    console.error('Undo complete habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:habitId/completion', async (req, res) => {
  try {
    const { habitId } = req.params;
    const { date, completed } = req.body;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const targetDateKey = dateKeyFromValue(date);
    if (!targetDateKey) {
      return res.status(400).json({ error: 'Valid date is required' });
    }

    const todayKey = dateKeyFromValue(new Date());
    if (targetDateKey > todayKey) {
      return res
        .status(400)
        .json({ error: 'Cannot change completion for a future date' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habit = await habitsCollection.findOne({ _id: habitObjectId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const currentCompletions = Array.isArray(habit.completions)
      ? habit.completions
      : [];
    const cleanedCompletions = currentCompletions.filter(
      (entry) => !isSameDate(entry.date, targetDateKey)
    );

    const shouldBeCompleted = Boolean(completed);
    if (shouldBeCompleted) {
      cleanedCompletions.push({ date: targetDateKey, completed: true });
    }

    const newStreak = calculateStreak(cleanedCompletions);

    await habitsCollection.updateOne(
      { _id: habitObjectId },
      { $set: { completions: cleanedCompletions, currentStreak: newStreak } }
    );

    res.status(200).json({
      message: shouldBeCompleted
        ? 'Habit marked complete for selected date'
        : 'Habit marked incomplete for selected date',
      currentStreak: newStreak,
    });
  } catch (error) {
    console.error('Set completion by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateStreak(completions) {
  if (completions.length === 0) return 0;

  const sortedCompletions = [...new Set(completions.map((c) => dateKeyFromValue(c.date)).filter(Boolean))]
    .map((key) => parseDateKeyToUTCDate(key))
    .filter(Boolean)
    .sort((a, b) => b - a);

  let streak = 0;
  const todayKey = dateKeyFromValue(new Date());
  let expectedDate = parseDateKeyToUTCDate(todayKey);
  if (!expectedDate) return 0;

  for (const completionDate of sortedCompletions) {
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate = new Date(expectedDate);
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else if (completionDate.getTime() > expectedDate.getTime()) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export default router;
