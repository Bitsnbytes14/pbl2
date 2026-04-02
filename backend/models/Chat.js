const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAllocation', required: true },
  sender_email: { type: String, required: true },
  sender_name: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
