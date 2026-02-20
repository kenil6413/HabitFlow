import express from 'express';
import { getDB } from '../db/connection.js';
import { toObjectIdOrNull } from '../utils/object-id.js';

const router = express.Router();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toIdString(value) {
  return String(value);
}

function hasId(list, targetId) {
  const target = toIdString(targetId);
  return asArray(list).some((value) => toIdString(value) === target);
}

function normalizeShareCode(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

function parseUserId(rawUserId) {
  return toObjectIdOrNull(rawUserId);
}

function parseUserAndFriendIds(rawUserId, rawFriendId) {
  const userObjectId = toObjectIdOrNull(rawUserId);
  const friendObjectId = toObjectIdOrNull(rawFriendId);

  if (!userObjectId || !friendObjectId) {
    return null;
  }

  return { userObjectId, friendObjectId };
}

function friendPayload(user) {
  return {
    userId: user._id,
    username: user.username,
    shareCode: user.shareCode,
  };
}

function getUsersCollection() {
  return getDB().collection('users');
}

router.post('/add', async (req, res) => {
  try {
    const { userId, shareCode } = req.body;
    const userObjectId = parseUserId(userId);
    const normalizedShareCode = normalizeShareCode(shareCode);

    if (!userId || !normalizedShareCode) {
      return res
        .status(400)
        .json({ error: 'userId and shareCode are required' });
    }

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const usersCollection = getUsersCollection();

    const [currentUser, friendUser] = await Promise.all([
      usersCollection.findOne(
        { _id: userObjectId },
        { projection: { friends: 1 } }
      ),
      usersCollection.findOne(
        { shareCode: normalizedShareCode },
        { projection: { username: 1, shareCode: 1, friends: 1 } }
      ),
    ]);

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    if (!friendUser) {
      return res
        .status(404)
        .json({ error: 'User with this share code not found' });
    }

    if (toIdString(friendUser._id) === toIdString(userObjectId)) {
      return res
        .status(400)
        .json({ error: 'You cannot add yourself as a friend' });
    }

    const currentHasFriend = hasId(currentUser.friends, friendUser._id);
    const friendHasCurrent = hasId(friendUser.friends, userObjectId);

    if (currentHasFriend && friendHasCurrent) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    await usersCollection.bulkWrite([
      {
        updateOne: {
          filter: { _id: userObjectId },
          update: { $addToSet: { friends: friendUser._id } },
        },
      },
      {
        updateOne: {
          filter: { _id: friendUser._id },
          update: { $addToSet: { friends: userObjectId } },
        },
      },
    ]);

    return res.status(200).json({
      message:
        currentHasFriend || friendHasCurrent
          ? 'Friend connection synchronized successfully'
          : 'Friend added successfully',
      friend: friendPayload(friendUser),
    });
  } catch (error) {
    console.error('Add friend error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId/habits/:friendId', async (req, res) => {
  try {
    const ids = parseUserAndFriendIds(req.params.userId, req.params.friendId);
    if (!ids) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    const { userObjectId, friendObjectId } = ids;
    const usersCollection = getUsersCollection();
    const habitsCollection = getDB().collection('habits');

    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { friends: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!hasId(user.friends, friendObjectId)) {
      return res
        .status(403)
        .json({ error: 'You can only view habits of your friends' });
    }

    const [friendUser, friendHabits] = await Promise.all([
      usersCollection.findOne(
        { _id: friendObjectId },
        { projection: { username: 1, shareCode: 1 } }
      ),
      habitsCollection
        .find({ userId: friendObjectId })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    if (!friendUser) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    return res.status(200).json({
      message: 'Friend habits retrieved successfully',
      friend: friendPayload(friendUser),
      count: friendHabits.length,
      habits: friendHabits,
    });
  } catch (error) {
    console.error('Get friend habits error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:userId/pin/:friendId', async (req, res) => {
  try {
    const ids = parseUserAndFriendIds(req.params.userId, req.params.friendId);
    const { pinned } = req.body;

    if (!ids) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    if (typeof pinned !== 'boolean') {
      return res.status(400).json({ error: 'pinned (boolean) is required' });
    }

    const { userObjectId, friendObjectId } = ids;
    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { friends: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!hasId(user.friends, friendObjectId)) {
      return res.status(403).json({ error: 'This user is not your friend' });
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      pinned
        ? { $addToSet: { pinnedFriends: friendObjectId } }
        : { $pull: { pinnedFriends: friendObjectId } }
    );

    return res.status(200).json({
      message: `Friend ${pinned ? 'pinned' : 'unpinned'} successfully`,
      pinned,
    });
  } catch (error) {
    console.error('Pin friend error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userObjectId = parseUserId(req.params.userId);
    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { friends: 1, pinnedFriends: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userFriends = asArray(user.friends);
    if (userFriends.length === 0) {
      return res
        .status(200)
        .json({ message: 'No friends yet', count: 0, friends: [] });
    }

    const pinnedIds = new Set(asArray(user.pinnedFriends).map(toIdString));
    const friends = await usersCollection
      .find({ _id: { $in: userFriends } })
      .project({ username: 1, shareCode: 1, createdAt: 1 })
      .toArray();

    const mappedFriends = friends
      .map((friend) => ({
        userId: friend._id,
        username: friend.username,
        shareCode: friend.shareCode,
        createdAt: friend.createdAt,
        pinned: pinnedIds.has(toIdString(friend._id)),
      }))
      .sort(
        (left, right) =>
          Number(right.pinned) - Number(left.pinned) ||
          String(left.username || '').localeCompare(
            String(right.username || ''),
            undefined,
            { sensitivity: 'base' }
          )
      );

    return res.status(200).json({
      message: 'Friends retrieved successfully',
      count: mappedFriends.length,
      friends: mappedFriends,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:userId/remove/:friendId', async (req, res) => {
  try {
    const ids = parseUserAndFriendIds(req.params.userId, req.params.friendId);
    if (!ids) {
      return res.status(400).json({ error: 'Invalid userId or friendId' });
    }

    const { userObjectId, friendObjectId } = ids;
    if (toIdString(userObjectId) === toIdString(friendObjectId)) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }

    const usersCollection = getUsersCollection();
    const currentUser = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { friends: 1 } }
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!hasId(currentUser.friends, friendObjectId)) {
      return res.status(404).json({ error: 'Friend not found in your list' });
    }

    await usersCollection.bulkWrite([
      {
        updateOne: {
          filter: { _id: userObjectId },
          update: {
            $pull: { friends: friendObjectId, pinnedFriends: friendObjectId },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: friendObjectId },
          update: {
            $pull: { friends: userObjectId, pinnedFriends: userObjectId },
          },
        },
      },
    ]);

    return res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
