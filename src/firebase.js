// import admin from 'firebase-admin';
// import fs from 'fs';

// // ✅ ADD ERROR HANDLING
// // let admin;
// let firebaseInitialized = false;

// try {
//     const serviceAccount = JSON.parse(
//         fs.readFileSync('./firebase-service-account.json', 'utf8')
//     );

//     admin = require('firebase-admin');
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//     });
//     firebaseInitialized = true;
//     console.log('✅ Firebase initialized');
// } catch (error) {
//     console.warn('⚠️ Firebase not initialized:', error.message);
//     console.warn('Push notifications will be disabled');
// }

// export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
//     if (!firebaseInitialized) {
//         console.log('Push notification skipped - Firebase not initialized');
//         return null;
//     }

//     try {
//         const message = {
//             notification: { title, body },
//             data,
//             token: fcmToken
//         };
//         const response = await admin.messaging().send(message);
//         console.log('Push notification sent:', response);
//         return response;
//     } catch (error) {
//         console.error('Error sending push notification:', error);
//         return null; // Don't throw, just log
//     }
// };


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
//     try {
//         const message = {
//             notification: {
//                 title,
//                 body
//             },
//             data,
//             token: fcmToken
//         };

//         const response = await admin.messaging().send(message);
//         console.log('Push notification sent:', response);
//         return response;
//     } catch (error) {
//         console.error('Error sending push notification:', error);
//         throw error;
//     }
// };

// export const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
//     try {
//         const message = {
//             notification: {
//                 title,
//                 body
//             },
//             data,
//             tokens: fcmTokens
//         };

//         const response = await admin.messaging().sendMulticast(message);
//         console.log(`${response.successCount} notifications sent successfully`);
//         return response;
//     } catch (error) {
//         console.error('Error sending multicast notification:', error);
//         throw error;
//     }
// };
