import TempSession from "../models/TempSession.models.js";
import Message from "../models/Message.models.js";
import { getIO } from "../socket.js";

/**
 * Background cleanup job for expired temp sessions
 * Runs periodically to clean up messages before MongoDB TTL deletes the session
 */
export const cleanupExpiredSessions = async () => {
    try {
        // Find sessions that have expired (expiresAt < now) but not yet cleaned up
        const expiredSessions = await TempSession.find({
            expiresAt: { $lt: new Date() },
            destroyed: false,
        });

        console.log(`🧹 Cleaning up ${expiredSessions.length} expired temp sessions...`);

        for (const session of expiredSessions) {
            // Delete associated messages
            const deletedCount = await Message.deleteMany({ tempSessionId: session._id });
            console.log(`🗑️ Deleted ${deletedCount.deletedCount} messages for session ${session.code}`);

            // Mark session as destroyed
            session.destroyed = true;
            session.active = false;
            session.endedAt = new Date();
            await session.save();

            // Notify participants via socket
            try {
                const io = getIO();
                session.participants.forEach((p) => {
                    io.to(p.userId.toString()).emit("temp:session:ended", {
                        sessionId: session._id,
                        reason: "expired",
                    });
                });
            } catch (e) {
                console.error("Failed to notify participants:", e.message);
            }
        }

        if (expiredSessions.length > 0) {
            console.log(`✅ Cleanup completed for ${expiredSessions.length} sessions`);
        }
    } catch (error) {
        console.error("❌ Error during temp session cleanup:", error);
    }
};

/**
 * Initialize cleanup job - runs every hour
 */
export const initCleanupJob = () => {
    // Run cleanup every hour
    setInterval(
        async () => {
            await cleanupExpiredSessions();
        },
        60 * 60 * 1000
    ); // 1 hour

    // Run initial cleanup on startup
    setTimeout(() => {
        cleanupExpiredSessions();
    }, 5000); // 5 seconds after startup

    console.log("🔄 Temp session cleanup job initialized (runs hourly)");
};
