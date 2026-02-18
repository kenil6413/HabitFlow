import express from 'express';
import { getDB } from '../db/connection.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();
const MAX_PLAN_FIELD_LENGTH = 120;

function normalizePlanField(value, maxLength = MAX_PLAN_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizeDateOnly(value) {
  if (typeof value === 'string') {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      const parsedLocal = new Date(year, month, day);
      if (!Number.isNaN(parsedLocal.getTime())) {
        parsedLocal.setHours(0, 0, 0, 0);
        return parsedLocal;
      }
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function isSameDate(a, b) {
  const left = new Date(a);
  const right = new Date(b);
  left.setHours(0, 0, 0, 0);
  right.setHours(0, 0, 0, 0);
  return left.getTime() === right.getTime();
}

// Create a new habit
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
    } = req.body;
    const userObjectId = toObjectIdOrNull(userId);

    // Validation
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    // Create habit
    const newHabit = {
      userId: userObjectId,
      name,
      description: description || '',
      cueTime: normalizePlanField(cueTime, 8),
      cueLocation: normalizePlanField(cueLocation),
      stackAfter: normalizePlanField(stackAfter),
      tinyVersion: normalizePlanField(tinyVersion),
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

// Get all habits for a user
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

// Get a single habit by ID
router.get('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habit = await habitsCollection.findOne({
      _id: habitObjectId,
    });

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

// Update a habit
router.put('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const { name, description, cueTime, cueLocation, stackAfter, tinyVersion } =
      req.body;
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

    if (cueTime !== undefined) {
      updateData.cueTime = normalizePlanField(cueTime, 8);
    }
    if (cueLocation !== undefined) {
      updateData.cueLocation = normalizePlanField(cueLocation);
    }
    if (stackAfter !== undefined) {
      updateData.stackAfter = normalizePlanField(stackAfter);
    }
    if (tinyVersion !== undefined) {
      updateData.tinyVersion = normalizePlanField(tinyVersion);
    }

    const result = await habitsCollection.updateOne(
      { _id: habitObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({
      message: 'Habit updated successfully',
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a habit
router.delete('/:habitId', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const result = await habitsCollection.deleteOne({
      _id: habitObjectId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log a habit completion for today
router.post('/:habitId/complete', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the habit
    const habit = await habitsCollection.findOne({
      _id: habitObjectId,
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if already completed today
    const alreadyCompleted = habit.completions.some((completion) => {
      const completionDate = new Date(completion.date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });

    if (alreadyCompleted) {
      return res.status(400).json({ error: 'Habit already completed today' });
    }

    // Add completion
    const newCompletion = {
      date: today,
      completed: true,
    };

    // Calculate new streak
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

// Remove today's completion for a habit
router.delete('/:habitId/complete/today', async (req, res) => {
  try {
    const { habitId } = req.params;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habit = await habitsCollection.findOne({ _id: habitObjectId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const filteredCompletions = (habit.completions || []).filter((completion) => {
      const completionDate = new Date(completion.date);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() !== today.getTime();
    });

    if (filteredCompletions.length === (habit.completions || []).length) {
      return res
        .status(400)
        .json({ error: 'Habit is not marked complete for today' });
    }

    const newStreak = calculateStreak(filteredCompletions);

    await habitsCollection.updateOne(
      { _id: habitObjectId },
      {
        $set: {
          completions: filteredCompletions,
          currentStreak: newStreak,
        },
      }
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

// Set or unset completion for an arbitrary date (developer mode helper)
router.put('/:habitId/completion', async (req, res) => {
  try {
    const { habitId } = req.params;
    const { date, completed } = req.body;
    const habitObjectId = toObjectIdOrNull(habitId);

    if (!habitObjectId) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const targetDate = normalizeDateOnly(date);
    if (!targetDate) {
      return res.status(400).json({ error: 'Valid date is required' });
    }

    const today = normalizeDateOnly(new Date());
    if (targetDate.getTime() > today.getTime()) {
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
      (entry) => !isSameDate(entry.date, targetDate)
    );

    const shouldBeCompleted = Boolean(completed);
    if (shouldBeCompleted) {
      cleanedCompletions.push({ date: targetDate, completed: true });
    }

    const newStreak = calculateStreak(cleanedCompletions);

    await habitsCollection.updateOne(
      { _id: habitObjectId },
      {
        $set: {
          completions: cleanedCompletions,
          currentStreak: newStreak,
        },
      }
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

// Helper function to calculate streak
function calculateStreak(completions) {
  if (completions.length === 0) return 0;

  // Sort completions by date (newest first)
  const sortedCompletions = completions
    .map((c) => new Date(c.date))
    .sort((a, b) => b - a);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i]);
    completionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default router;
