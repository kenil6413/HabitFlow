import express from 'express';
import { getDB } from '../db/connection.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();

// Add a friend using their share code
router.post('/add', async (req, res) => {
  try {
    const { userId, shareCode } = req.body;
    const userObjectId = toObjectIdOrNull(userId);

    // Validation
    if (!userId || !shareCode) {
      return res
        .status(400)
        .json({ error: 'userId and shareCode are required' });
    }

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Find the user to add as friend
    const friendUser = await usersCollection.findOne({ shareCode });

    if (!friendUser) {
      return res
        .status(404)
        .json({ error: 'User with this share code not found' });
    }

    // Can't add yourself
    if (friendUser._id.toString() === userId) {
      return res
        .status(400)
        .json({ error: 'You cannot add yourself as a friend' });
    }

    // Check if already friends
    const currentUser = await usersCollection.findOne({
      _id: userObjectId,
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const alreadyFriends = currentUser.friends.some(
      (friendId) => friendId.toString() === friendUser._id.toString()
    );

    if (alreadyFriends) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Add friend
    await usersCollection.updateOne(
      { _id: userObjectId },
      { $push: { friends: friendUser._id } }
    );

    res.status(200).json({
      message: 'Friend added successfully',
      friend: {
        userId: friendUser._id,
        username: friendUser.username,
        shareCode: friendUser.shareCode,
      },
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a friend's habits (must be before /:userId to match correctly)
router.get('/:userId/habits/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const userObjectId = toObjectIdOrNull(userId);
    const friendObjectId = toObjectIdOrNull(friendId);

    if (!userObjectId || !friendObjectId) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');
    const habitsCollection = db.collection('habits');

    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFriend = user.friends.some((fId) => fId.toString() === friendId);

    if (!isFriend) {
      return res
        .status(403)
        .json({ error: 'You can only view habits of your friends' });
    }

    const friendHabits = await habitsCollection
      .find({ userId: friendObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    const friendUser = await usersCollection.findOne(
      { _id: friendObjectId },
      { projection: { username: 1, shareCode: 1 } }
    );

    if (!friendUser) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    res.status(200).json({
      message: 'Friend habits retrieved successfully',
      friend: {
        userId: friendUser._id,
        username: friendUser.username,
        shareCode: friendUser.shareCode,
      },
      count: friendHabits.length,
      habits: friendHabits,
    });
  } catch (error) {
    console.error('Get friend habits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pin or unpin a friend
router.put('/:userId/pin/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const { pinned } = req.body;
    const userObjectId = toObjectIdOrNull(userId);
    const friendObjectId = toObjectIdOrNull(friendId);

    if (!userObjectId || !friendObjectId) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    if (typeof pinned !== 'boolean') {
      return res.status(400).json({ error: 'pinned (boolean) is required' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isFriend = user.friends.some(
      (fId) => fId.toString() === friendId
    );
    if (!isFriend) {
      return res.status(403).json({ error: 'This user is not your friend' });
    }

    if (pinned) {
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $addToSet: { pinnedFriends: friendObjectId } }
      );
    } else {
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $pull: { pinnedFriends: friendObjectId } }
      );
    }

    res.status(200).json({
      message: `Friend ${pinned ? 'pinned' : 'unpinned'} successfully`,
      pinned,
    });
  } catch (error) {
    console.error('Pin friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all friends for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = toObjectIdOrNull(userId);

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.friends.length === 0) {
      return res.status(200).json({ message: 'No friends yet', count: 0, friends: [] });
    }

    const pinnedIds = (user.pinnedFriends || []).map((id) => id.toString());

    const friends = await usersCollection
      .find({ _id: { $in: user.friends } })
      .project({ password: 0 })
      .toArray();

    const mappedFriends = friends.map((friend) => ({
      userId: friend._id,
      username: friend.username,
      shareCode: friend.shareCode,
      createdAt: friend.createdAt,
      pinned: pinnedIds.includes(friend._id.toString()),
    }));

    // Pinned friends first
    mappedFriends.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    res.status(200).json({
      message: 'Friends retrieved successfully',
      count: friends.length,
      friends: mappedFriends,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a friend
router.delete('/:userId/remove/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const userObjectId = toObjectIdOrNull(userId);
    const friendObjectId = toObjectIdOrNull(friendId);

    if (!userObjectId || !friendObjectId) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Remove friend
    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      { $pull: { friends: friendObjectId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'Friend removed successfully',
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
