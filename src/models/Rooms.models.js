const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    description: { type: String },
    icon: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema);
