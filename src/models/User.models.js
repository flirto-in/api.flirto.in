const mongoose = require('mongoose');
const { Schema } = mongoose;

const PremiumSchema = new Schema({
    premium01: { type: Boolean, default: false },
    premium02: { type: Boolean, default: false },
    premium03: { type: Boolean, default: false },
    premium04: { type: Boolean, default: false },
    premium05: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema({
    phoneNumber: { type: Number, index: true },
    email: { type: String, lowercase: true, index: true },
    avatar: { type: String },
    U_Id: { type: String, unique: true },        // custom id
    description: { type: String },
    tags: [{ type: String }],
    interests: [{ type: String }],

    // relations: arrays of ObjectId referencing other models
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],        
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],       
    primaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    secondaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    searchHistory: [{ type: Schema.Types.ObjectId, ref: 'User' }],     
    dailyAsk: { type: Schema.Types.ObjectId, ref: 'DailyAsk' },  
    isVerified: { type: Boolean, default: false },

    premium: PremiumSchema,  
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
