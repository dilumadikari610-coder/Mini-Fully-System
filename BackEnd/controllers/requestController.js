const Request = require('../models/Request');

// Get all requests (with optional role filtering)
exports.getRequests = async (req, res) => {
  try {
    const { role, uid } = req.query;
    let query = {};
    
    if (role === 'requester') query.requesterId = uid;
    if (role === 'recipient') query.assignedTo = uid;

    const requests = await Request.find(query).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new request
exports.createRequest = async (req, res) => {
  try {
    const newRequest = new Request({
      ...req.body,
      reqId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`
    });
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update request status (Start, Complete, Approve)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
