import express from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../db/connection.js';
import { generateShareCode, isValidUsername } from '../utils/helpers.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    if (!isValidUsername(username)) {
      return res
        .status(400)
        .json({ error: 'Username must be 3-20 alphanumeric characters' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Check if username already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique share code
    let shareCode;
    let isUnique = false;
    while (!isUnique) {
      shareCode = generateShareCode();
      const codeExists = await usersCollection.findOne({ shareCode });
      if (!codeExists) isUnique = true;
    }

    // Create user
    const newUser = {
      username,
      password: hashedPassword,
      shareCode,
      friends: [],
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId,
      username: newUser.username,
      shareCode: newUser.shareCode,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      shareCode: user.shareCode,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = toObjectIdOrNull(userId);

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');
    const habitsCollection = db.collection('habits');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all user's habits
    await habitsCollection.deleteMany({ userId: userObjectId });

    // Remove user from other users' friends lists
    await usersCollection.updateMany(
      { friends: userObjectId },
      { $pull: { friends: userObjectId } }
    );

    // Delete the user
    await usersCollection.deleteOne({ _id: userObjectId });

    res.status(200).json({
      message: 'User account and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/user/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userObjectId = toObjectIdOrNull(userId);

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'New password must be at least 6 characters' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
