import Chat from '../models/chat.model.js';

// Archive messages older than specified days
export const archiveOldMessages = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Chat.updateMany(
      {
        timestamp: { $lt: cutoffDate },
        archived: false
      },
      {
        $set: {
          archived: true,
          archivedAt: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    console.error('Error archiving messages:', error);
    throw error;
  }
};

// Get messages with pagination and archive status
export const getMessagesWithPagination = async (issueId, page = 1, limit = 50, includeArchived = false) => {
  try {
    const query = { issueId };
    if (!includeArchived) {
      query.archived = false;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Chat.find(query)
        .populate('sender', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments(query)
    ]);

    return {
      messages,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error getting messages with pagination:', error);
    throw error;
  }
}; 