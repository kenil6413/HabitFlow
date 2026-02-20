import express from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../db/connection.js';
import { generateShareCode, isValidUsername } from '../utils/helpers.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();

function getUsersCollection() {
  return getDB().collection('users');
}

function normalizeUsername(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function validatePassword(password, { allowEmpty = false } = {}) {
  if (!password && !allowEmpty) return 'Password is required';
  if (password && password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

async function createUniqueShareCode(usersCollection) {
  for (;;) {
    const shareCode = generateShareCode();
    const existing = await usersCollection.findOne(
      { shareCode },
      { projection: { _id: 1 } }
    );
    if (!existing) return shareCode;
  }
}

async function deleteUserAssociatedData(userObjectId) {
  const db = getDB();
  const usersCollection = db.collection('users');
  const habitsCollection = db.collection('habits');
  const journalCollection = db.collection('journal');

  await Promise.all([
    habitsCollection.deleteMany({ userId: userObjectId }),
    journalCollection.deleteMany({ userId: userObjectId }),
    usersCollection.updateMany(
      {
        $or: [{ friends: userObjectId }, { pinnedFriends: userObjectId }],
      },
      {
        $pull: { friends: userObjectId, pinnedFriends: userObjectId },
      }
    ),
    usersCollection.deleteOne({ _id: userObjectId }),
  ]);
}

router.post('/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        error:
          'Username must be 3-20 characters using letters, numbers, or underscores',
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.findOne(
      { username },
      { projection: { _id: 1 } }
    );
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const [hashedPassword, shareCode] = await Promise.all([
      bcrypt.hash(password, 10),
      createUniqueShareCode(usersCollection),
    ]);

    const newUser = {
      username,
      password: hashedPassword,
      shareCode,
      friends: [],
      pinnedFriends: [],
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId,
      username: newUser.username,
      shareCode: newUser.shareCode,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const { password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      shareCode: user.shareCode,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/user/:userId/password', async (req, res) => {
  try {
    const userObjectId = toObjectIdOrNull(req.params.userId);
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Current password and new password are required' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res
        .status(400)
        .json({ error: 'New password must be at least 6 characters' });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { password: hashedPassword } }
    );

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/user/:userId', async (req, res) => {
  try {
    const userObjectId = toObjectIdOrNull(req.params.userId);
    const { password } = req.body;

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const passwordError = validatePassword(password, { allowEmpty: false });
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await deleteUserAssociatedData(userObjectId);

    return res.status(200).json({
      message: 'User account and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
