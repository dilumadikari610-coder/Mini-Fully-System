const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// 1. GET ALL REQUESTS
// Accessible at: GET http://localhost:5000/api/requests
router.get('/', async (req, res) => {
    try {
        const { role, uid } = req.query;
        let query = {};

        // Simple role-based filtering logic
        if (role === 'requester') query.requesterId = uid;
        if (role === 'recipient') query.assignedTo = uid;

        const requests = await Request.find(query).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "Error fetching requests", error: err.message });
    }
});

// 2. CREATE A NEW REQUEST
// Accessible at: POST http://localhost:5000/api/requests
router.post('/', async (req, res) => {
    try {
        const { title, description, type, priority, requesterId } = req.body;

        const newRequest = new Request({
            reqId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
            title,
            description,
            type,
            priority,
            requesterId,
            status: 'Pending'
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(400).json({ message: "Error creating request", error: err.message });
    }
});

// 3. UPDATE REQUEST STATUS (Assign, Start, Complete)
// Accessible at: PATCH http://localhost:5000/api/requests/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // e.g., { status: 'In Progress' } or { assignedTo: 'staff123' }

        const updatedRequest = await Request.findByIdAndUpdate(
            id, 
            { ...updates, updatedAt: Date.now() }, 
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(400).json({ message: "Error updating request", error: err.message });
    }
});

// 4. DELETE A REQUEST
router.delete('/:id', async (req, res) => {
    try {
        await Request.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Request deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRITICAL: This line fixes the "argument handler must be a function" error
module.exports = router;