/**
 * Server-Side Prekey Management
 * Stores and serves prekey bundles for X3DH key agreement
 * 
 * Security Notes:
 * - Server NEVER stores private keys
 * - Prekey bundles are public data (authenticated by signature)
 * - One-time prekeys are consumed (deleted after fetch)
 * - Signed prekeys rotated monthly
 */

import mongoose from 'mongoose';

const prekeyBundleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Ed25519 identity public key (long-term)
    identityKey: {
      type: String,
      required: true,
    },

    // Current signed prekey (X25519)
    signedPrekey: {
      id: { type: Number, required: true },
      publicKey: { type: String, required: true },
      signature: { type: String, required: true }, // Signed by identity key
      createdAt: { type: Date, default: Date.now },
    },

    // Pool of one-time prekeys (consumed on use)
    oneTimePrekeys: [
      {
        id: { type: String, required: true, unique: true },
        publicKey: { type: String, required: true },
      },
    ],

    // Last refresh timestamp
    lastRefreshed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient one-time prekey lookups
prekeyBundleSchema.index({ 'oneTimePrekeys.id': 1 });

const PrekeyBundle = mongoose.model('PrekeyBundle', prekeyBundleSchema);

export default PrekeyBundle;
