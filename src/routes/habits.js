import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../db/connection.js';

const router = express.Router();

// Create a new habit
router.post('/', async (req, res) => {
  try {
    const { userId, name, description } = req.body;

    // Validation
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    // Create habit
    const newHabit = {
      userId: new ObjectId(userId),
      name,
      description: description || '',
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

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habits = await habitsCollection
      .find({ userId: new ObjectId(userId) })
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

    if (!ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const habit = await habitsCollection.findOne({
      _id: new ObjectId(habitId),
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
    const { name, description } = req.body;

    if (!ObjectId.isValid(habitId)) {
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

    const result = await habitsCollection.updateOne(
      { _id: new ObjectId(habitId) },
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

    if (!ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    const result = await habitsCollection.deleteOne({
      _id: new ObjectId(habitId),
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

    if (!ObjectId.isValid(habitId)) {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const db = getDB();
    const habitsCollection = db.collection('habits');

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the habit
    const habit = await habitsCollection.findOne({
      _id: new ObjectId(habitId),
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
      { _id: new ObjectId(habitId) },
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
