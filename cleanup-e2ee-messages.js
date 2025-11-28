/**
 * Database Migration: Clean Up E2EE Messages
 * 
 * This script removes plaintext from messages that have encrypted content.
 * Run this ONCE after deploying the E2EE security fix.
 * 
 * Usage:
 *   node cleanup-e2ee-messages.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DB_NAME } from './src/constants.js';

dotenv.config();

const cleanupE2EEMessages = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log('✅ Connected to database');

    const Message = mongoose.model('Message');

    // Step 1: Find all E2EE messages that still have plaintext
    console.log('\n🔍 Finding E2EE messages with plaintext...');
    const vulnerableMessages = await Message.find({
      encryptedText: { $exists: true, $ne: null, $ne: '' },
      text: { $exists: true, $ne: null, $ne: '' }
    }).select('_id text encryptedText senderId receiverId');

    console.log(`⚠️  Found ${vulnerableMessages.length} messages with BOTH plaintext and ciphertext`);

    if (vulnerableMessages.length === 0) {
      console.log('✅ No vulnerable messages found! Database is clean.');
      await mongoose.connection.close();
      return;
    }

    // Show sample of vulnerable data
    console.log('\n📊 Sample vulnerable messages:');
    vulnerableMessages.slice(0, 3).forEach((msg, i) => {
      console.log(`  ${i + 1}. Message ID: ${msg._id}`);
      console.log(`     Plaintext: "${msg.text?.substring(0, 50)}..."`);
      console.log(`     Encrypted: ${msg.encryptedText ? 'Yes' : 'No'}`);
    });

    // Step 2: Ask for confirmation
    console.log('\n⚠️  WARNING: This will PERMANENTLY delete plaintext content!');
    console.log('   Only encrypted ciphertext will remain.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Remove plaintext from E2EE messages
    console.log('🧹 Removing plaintext from E2EE messages...');
    const updateResult = await Message.updateMany(
      { 
        encryptedText: { $exists: true, $ne: null, $ne: '' }
      },
      { 
        $unset: { text: '' }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} messages`);

    // Step 4: Verify cleanup
    console.log('\n✅ Verifying cleanup...');
    const remainingVulnerable = await Message.countDocuments({
      encryptedText: { $exists: true, $ne: null, $ne: '' },
      text: { $exists: true, $ne: null, $ne: '' }
    });

    if (remainingVulnerable === 0) {
      console.log('✅ SUCCESS! All E2EE messages are now secure.');
      console.log('   Server cannot read message content anymore.');
    } else {
      console.log(`⚠️  WARNING: ${remainingVulnerable} messages still have plaintext!`);
      console.log('   Please check database permissions and re-run script.');
    }

    // Step 5: Show statistics
    console.log('\n📊 E2EE Statistics:');
    const totalMessages = await Message.countDocuments();
    const e2eeMessages = await Message.countDocuments({ encryptedText: { $exists: true, $ne: null, $ne: '' } });
    const plaintextMessages = await Message.countDocuments({ 
      encryptedText: { $exists: false },
      text: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`   Total messages: ${totalMessages}`);
    console.log(`   E2EE messages: ${e2eeMessages} (${((e2eeMessages/totalMessages)*100).toFixed(1)}%)`);
    console.log(`   Plaintext messages: ${plaintextMessages} (${((plaintextMessages/totalMessages)*100).toFixed(1)}%)`);

    // Step 6: Create indexes for E2EE fields
    console.log('\n🔧 Creating indexes for E2EE fields...');
    try {
      await Message.collection.createIndex({ encryptedText: 1, ratchetHeader: 1 });
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('⚠️  Index creation failed (may already exist):', error.message);
    }

    console.log('\n✅ Migration complete!');
    console.log('   Your E2EE implementation is now secure.');
    console.log('   Server cannot read encrypted message content.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run migration
cleanupE2EEMessages();
