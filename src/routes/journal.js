import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../db/connection.js';

const router = express.Router();

// Create or update a journal entry for a specific date
router.post('/', async (req, res) => {
  try {
    const { userId, date, content, images } = req.body;

    // Validation
    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const journalCollection = db.collection('journal');

    // Parse date and set to midnight
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    // Check if entry already exists
    const existingEntry = await journalCollection.findOne({
      userId: new ObjectId(userId),
      date: entryDate,
    });

    const journalEntry = {
      userId: new ObjectId(userId),
      date: entryDate,
      content: content || '',
      images: images || [],
      updatedAt: new Date(),
    };

    if (existingEntry) {
      // Update existing entry
      await journalCollection.updateOne(
        { _id: existingEntry._id },
        { $set: journalEntry }
      );
      res.status(200).json({
        message: 'Journal entry updated successfully',
        entry: { ...journalEntry, _id: existingEntry._id },
      });
    } else {
      // Create new entry
      journalEntry.createdAt = new Date();
      const result = await journalCollection.insertOne(journalEntry);
      res.status(201).json({
        message: 'Journal entry created successfully',
        entry: { ...journalEntry, _id: result.insertedId },
      });
    }
  } catch (error) {
    console.error('Create/update journal entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get journal entry for a specific date
router.get('/user/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const journalCollection = db.collection('journal');

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = await journalCollection.findOne({
      userId: new ObjectId(userId),
      date: entryDate,
    });

    if (!entry) {
      return res.status(200).json({
        message: 'No journal entry found for this date',
        entry: null,
      });
    }

    res.status(200).json({
      message: 'Journal entry retrieved successfully',
      entry,
    });
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all journal entries for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const journalCollection = db.collection('journal');

    const entries = await journalCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ date: -1 })
      .toArray();

    res.status(200).json({
      message: 'Journal entries retrieved successfully',
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a journal entry
router.delete('/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;

    if (!ObjectId.isValid(entryId)) {
      return res.status(400).json({ error: 'Invalid entryId' });
    }

    const db = getDB();
    const journalCollection = db.collection('journal');

    const result = await journalCollection.deleteOne({
      _id: new ObjectId(entryId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.status(200).json({
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
