const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get all messages for a room
router.get('/:room_id', chatController.getRoomChat);

// Post a new message to a room
router.post('/:room_id', chatController.sendMessage);

module.exports = router;
