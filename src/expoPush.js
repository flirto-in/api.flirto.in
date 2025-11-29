import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Send push notification to a user via Expo Push Service
 * 
 * @param {string} expoPushToken - The Expo push token of the recipient
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Optional data payload (e.g., { messageId, senderId })
 */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
  const messages = [{
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'default', // For Android 8.0+
  }];

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications.
  // We recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get compressed).
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  try {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('✅ Push notification sent via Expo:', ticketChunk);
        tickets.push(...ticketChunk);

        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it. For example, invalid tokens will return an error here.
      } catch (error) {
        console.error('❌ Error sending chunk:', error);
      }
    }
  } catch (error) {
    console.error('❌ Expo push failed:', error);
  }

  // Later, you may want to check the receipts to see if the notifications were
  // actually delivered. This requires a separate process (not implemented here
  // for simplicity, but recommended for production).
}
