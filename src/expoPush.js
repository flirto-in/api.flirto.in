import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification via Expo Push Notification service
 * FREE service, no credentials needed
 * 
 * @param {string} expoPushToken - Expo push token (starts with ExponentPushToken[...])
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  // Check that the token is valid
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Invalid Expo push token: ${expoPushToken}`);
    return;
  }

  // Construct the notification message
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
    channelId: 'default', // Android notification channel
  };

  try {
    // The Expo push notification service accepts batches of notifications
    // Chunk the notifications to comply with their limits
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    // Send the chunks to the Expo push notification service
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('✅ Push notification sent via Expo:', ticketChunk);
      } catch (error) {
        console.error('❌ Error sending push notification chunk:', error);
      }
    }

    // Check for any errors in the tickets
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`❌ Push notification error: ${ticket.message}`);
        if (ticket.details?.error) {
          console.error(`Error details: ${ticket.details.error}`);
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    throw error;
  }
}

/**
 * Check delivery receipts for sent notifications
 * This can be used to verify if notifications were delivered
 */
export async function checkPushReceipts(receiptIds) {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log('📨 Push notification receipts:', receipts);

        // Check for any delivery errors
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (receipt.status === 'error') {
            console.error(`❌ Delivery error for ${receiptId}:`, receipt.message);
            
            // Handle DeviceNotRegistered error (token is invalid/expired)
            if (receipt.details?.error === 'DeviceNotRegistered') {
              console.log('⚠️ Device token is no longer valid, should remove from database');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching push receipts:', error);
      }
    }
  } catch (error) {
    console.error('❌ Failed to check push receipts:', error);
  }
}

export default { sendPushNotification, checkPushReceipts };
