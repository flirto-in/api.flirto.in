import mongoose from 'mongoose';
const { Schema } = mongoose;

// You used question01..question05 — your choice: fixed fields or array.
// Here is a flexible array approach (keeps order):
const DailyAskSchema = new Schema({
    questions: [{ type: String }], // e.g. ["question01","question02", ...]
    createdFor: { type: Schema.Types.ObjectId, ref: 'User' } // optional: which user this set is for
}, {
    timestamps: true
});

export const DailyAsk = mongoose.model('DailyAsk', DailyAskSchema);
