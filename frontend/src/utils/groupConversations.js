/**
 * Groups conversations by date (Today, Yesterday, Last 7 days, Older)
 * @param {Array} conversations - Array of conversation objects with updated_at field
 * @returns {Object} Grouped conversations by time period
 */
export function groupConversations(conversations) {
  if (!conversations || conversations.length === 0) {
    return { today: [], yesterday: [], lastWeek: [], older: [] };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const grouped = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: []
  };

  conversations.forEach(conv => {
    const convDate = new Date(conv.updated_at || conv.created_at);
    const convDateNormalized = new Date(
      convDate.getFullYear(),
      convDate.getMonth(),
      convDate.getDate()
    );

    if (convDateNormalized >= today) {
      grouped.today.push(conv);
    } else if (convDateNormalized >= yesterday) {
      grouped.yesterday.push(conv);
    } else if (convDateNormalized >= lastWeek) {
      grouped.lastWeek.push(conv);
    } else {
      grouped.older.push(conv);
    }
  });

  return grouped;
}
