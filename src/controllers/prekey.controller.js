/**
 * Prekey Bundle Controller
 * Manages X3DH prekey distribution for E2EE
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import PrekeyBundle from '../models/PrekeyBundle.models.js';

/**
 * Upload prekey bundle (called on app start or key rotation)
 * @route POST /api/v1/keys/prekeys
 */
export const uploadPrekeyBundle = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { identityKey, signedPrekey, oneTimePrekeys } = req.body;

  if (!identityKey || !signedPrekey || !oneTimePrekeys) {
    throw new ApiError(400, 'Missing required prekey bundle fields');
  }

  // Validate structure
  if (!signedPrekey.id || !signedPrekey.publicKey || !signedPrekey.signature) {
    throw new ApiError(400, 'Invalid signed prekey format');
  }

  if (!Array.isArray(oneTimePrekeys) || oneTimePrekeys.length === 0) {
    throw new ApiError(400, 'At least one one-time prekey required');
  }

  // Upsert prekey bundle (replace existing)
  const bundle = await PrekeyBundle.findOneAndUpdate(
    { userId },
    {
      userId,
      identityKey,
      signedPrekey,
      oneTimePrekeys,
      lastRefreshed: new Date(),
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Uploaded prekey bundle for user ${userId}: ${oneTimePrekeys.length} one-time keys`);

  return res.status(200).json(
    new ApiResponse(200, {
      bundleId: bundle._id,
      oneTimePrekeyCount: bundle.oneTimePrekeys.length,
    }, 'Prekey bundle uploaded successfully')
  );
});

/**
 * Fetch prekey bundle for initiating session with peer
 * @route GET /api/v1/keys/prekeys/:userId
 * Consumes one one-time prekey (if available)
 */
export const fetchPrekeyBundle = asyncHandler(async (req, res) => {
  const { userId: peerUserId } = req.params;

  const bundle = await PrekeyBundle.findOne({ userId: peerUserId });

  if (!bundle) {
    throw new ApiError(404, 'User has not uploaded prekey bundle - E2EE not enabled');
  }

  // Pop one one-time prekey (consume it)
  let oneTimePrekey = null;
  if (bundle.oneTimePrekeys.length > 0) {
    oneTimePrekey = bundle.oneTimePrekeys.shift(); // Remove first
    await bundle.save();
    console.log(`✅ Consumed one-time prekey ${oneTimePrekey.id} for session with ${peerUserId}`);
  } else {
    console.warn(`⚠️ No one-time prekeys available for ${peerUserId} - session will use 3DH instead of X3DH`);
  }

  // Return bundle (public data)
  return res.status(200).json(
    new ApiResponse(200, {
      identityKey: bundle.identityKey,
      signedPrekey: {
        id: bundle.signedPrekey.id,
        publicKey: bundle.signedPrekey.publicKey,
        signature: bundle.signedPrekey.signature,
      },
      oneTimePrekeys: oneTimePrekey ? [oneTimePrekey] : [],
    }, 'Prekey bundle fetched successfully')
  );
});

/**
 * Refresh one-time prekeys (add new batch)
 * @route POST /api/v1/keys/refresh
 */
export const refreshOneTimePrekeys = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { oneTimePrekeys } = req.body;

  if (!Array.isArray(oneTimePrekeys) || oneTimePrekeys.length === 0) {
    throw new ApiError(400, 'No one-time prekeys provided');
  }

  const bundle = await PrekeyBundle.findOne({ userId });

  if (!bundle) {
    throw new ApiError(404, 'Prekey bundle not found - upload initial bundle first');
  }

  // Append new one-time prekeys
  bundle.oneTimePrekeys.push(...oneTimePrekeys);
  bundle.lastRefreshed = new Date();
  await bundle.save();

  console.log(`✅ Refreshed ${oneTimePrekeys.length} one-time prekeys for user ${userId}`);

  return res.status(200).json(
    new ApiResponse(200, {
      totalOneTimePrekeys: bundle.oneTimePrekeys.length,
    }, 'One-time prekeys refreshed successfully')
  );
});

/**
 * Get prekey bundle status (for debugging)
 * @route GET /api/v1/keys/status
 */
export const getPrekeyStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const bundle = await PrekeyBundle.findOne({ userId });

  if (!bundle) {
    return res.status(200).json(
      new ApiResponse(200, { e2eeEnabled: false }, 'E2EE not enabled - no prekey bundle')
    );
  }

  return res.status(200).json(
    new ApiResponse(200, {
      e2eeEnabled: true,
      signedPrekeyId: bundle.signedPrekey.id,
      signedPrekeyAge: Math.floor((Date.now() - bundle.signedPrekey.createdAt) / 86400000), // days
      oneTimePrekeyCount: bundle.oneTimePrekeys.length,
      lastRefreshed: bundle.lastRefreshed,
    }, 'Prekey status retrieved')
  );
});
