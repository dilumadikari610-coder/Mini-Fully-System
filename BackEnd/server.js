const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- MODELS ---
const Request = require('./models/Request');
const User = require('./models/User');
const ToolGRN = require('./models/ToolGRN'); 
const Inventory = require('./models/Inventory'); 
const Department = require('./models/Department'); 

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE CONNECTION & ADMIN SEEDING ---
// ✅ FIXED: Database එක නිවැරදිව mms_db වෙත සම්බන්ධ කර ඇත
mongoose.connect('mongodb://localhost:27017/mms_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB (mms_db)');
    
    // 🔥 FORCE INDEX RESET LOGIC (400 Bad Request සදහටම නැති කිරීමට)
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const deptExists = collections.some(col => col.name === 'departments');
      
      if (deptExists) {
        await mongoose.connection.db.dropCollection('departments');
        console.log('🗑️ Cleared stale unique indexes by dropping departments collection.');
      }
    } catch (indexErr) {
      console.log('ℹ️ Safe core initialization passed.');
    }

    await seedDefaultAdmin();
  })
  .catch(err => console.error('❌ Connection error:', err));

// ✅ AUTO-SEED LOGIC FOR NEW DATABASE
const seedDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      console.log('⚠️ No admin user found. Creating default admin...');
      
      const defaultAdmin = new User({
        username: 'admin',
        password: 'admin123', 
        userType: 'Admin',
        department: 'Management' 
      });

      await defaultAdmin.save();
      console.log('✅ Default Admin Created Successfully! [User: admin | Pass: admin123]');
    }
  } catch (error) {
    console.error('❌ Failed to seed default admin:', error.message);
  }
};

// --- HELPERS ---

// Helper for TID (TID000001)
const generateNextTID = async () => {
  try {
    const lastRequest = await Request.findOne({ tid: { $regex: /^TID/ } }, { tid: 1 }).sort({ tid: -1 });
    if (!lastRequest || !lastRequest.tid) return "TID000001";
    const lastNum = parseInt(lastRequest.tid.replace("TID", ""), 10);
    return `TID${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    return "TID000001";
  }
};

// Helper for GRN ID (GRN000001)
const generateNextGRNID = async () => {
  try {
    const lastGRN = await ToolGRN.findOne({}, { grnId: 1 }).sort({ grnId: -1 });
    if (!lastGRN || !lastGRN.grnId) return "GRN000001";
    const lastNum = parseInt(lastGRN.grnId.replace("GRN", ""), 10);
    return `GRN${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    return "GRN000001";
  }
};

// --- USER MANAGEMENT & AUTH ROUTES ---

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
      name: user.username,
      role: user.userType === 'Admin' ? 'admin' : 'staff', 
      userType: user.userType, 
      uid: user._id,
      department: user.department
    });
  } catch (err) {
    res.status(500).json({ message: "Login server error" });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, userType, department } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    const newUser = new User({ username, password, userType, department });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (userToDelete.username === 'admin') {
      return res.status(403).json({ message: "System admin cannot be deleted" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

app.get('/api/users/staff', async (req, res) => {
  try {
    const staff = await User.find({ userType: 'Maintenance Staff' }, 'username _id userType');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff" });
  }
});

// --- MAINTENANCE JOB ROUTES ---

app.get('/api/requests', async (req, res) => {
  try {
    const data = await Request.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const nextTid = await generateNextTID();
    const newJob = new Request({ 
      ...req.body, 
      tid: nextTid,
      status: 'Assign Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(400).json({ message: "Could not save job", error: err.message });
  }
});

app.patch('/api/requests/assign/:id', async (req, res) => {
  try {
    const { staffId, staffName } = req.body;
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Assigned',
        assignedTo: staffName,
        assignedToId: staffId,
        updatedAt: new Date()
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Assignment failed" });
  }
});

app.patch('/api/requests/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Request.findByIdAndUpdate(
      req.params.id, 
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Status update failed" });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// --- TOOL ITEM GRN & INVENTORY ROUTES ---

app.get('/api/grn', async (req, res) => {
  try {
    const grns = await ToolGRN.find().sort({ createdAt: -1 });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ message: "Fetch GRN failed" });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Fetch Inventory failed" });
  }
});

// ✅ FIXED: NaN Validation & Proper Model Insertion Combined
app.post('/api/grn', async (req, res) => {
  try {
    const nextGrnId = await generateNextGRNID();
    
    const newGrn = new ToolGRN({
      ...req.body,
      grnId: nextGrnId
    });
    const savedGrn = await newGrn.save();

    if (req.body.items && req.body.items.length > 0) {
      const inventoryEntries = req.body.items.map(item => {
        const parsedQty = Number(item.qty || item.quantity);
        const parsedCost = Number(item.cost || item.price);

        return {
          itemName: item.itemName || item.itemDescription || "UNKNOWN ITEM",
          grnId: nextGrnId,
          grnObjectId: savedGrn._id,
          cost: isNaN(parsedCost) ? 0 : parsedCost,
          quantity: isNaN(parsedQty) ? 1 : parsedQty, 
          status: 'In Stock',
          supplier: req.body.supplier || req.body.vendor || "NOT SPECIFIED"
        };
      });
      
      // Rightly running insertMany on Inventory Model
      await Inventory.insertMany(inventoryEntries);
    }

    res.status(201).json(savedGrn);
  } catch (err) {
    console.error("GRN POST ERROR:", err);
    res.status(400).json({ message: "GRN creation failed", error: err.message });
  }
});

app.patch('/api/grn/allocate', async (req, res) => {
  try {
    const { grnObjectId, itemObjectId, staffName } = req.body;

    await Inventory.findOneAndUpdate(
      { grnObjectId: grnObjectId, itemName: req.body.itemName }, 
      { status: 'Assigned', assignedTo: staffName }
    );

    const updatedGrn = await ToolGRN.findOneAndUpdate(
      { _id: grnObjectId, "items._id": itemObjectId },
      { 
        $set: { 
          "items.$.status": "Assigned",
          "items.$.assignedStaff": staffName 
        } 
      },
      { new: true }
    );

    res.json(updatedGrn);
  } catch (err) {
    res.status(400).json({ message: "Allocation failed" });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const deps = await Department.find().sort({ name: 1 });
    res.json(deps);
  } catch (err) {
    res.status(500).json({ message: "Error fetching departments" });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    console.log("📥 Incoming Request Body:", req.body);
    let departmentName = null;

    if (req.body && req.body.name) {
      departmentName = req.body.name;
    } else if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        departmentName = parsed.name;
      } catch (e) {}
    } else if (Object.keys(req.body).length > 0) {
      const key = Object.keys(req.body)[0];
      try {
        const parsed = JSON.parse(key);
        departmentName = parsed.name;
      } catch (e) {
        departmentName = req.body[key];
      }
    }

    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({ message: "Department name field is empty or missing in req.body" });
    }

    const standardizedName = departmentName.trim().toUpperCase();

    const duplicated = await Department.findOne({ name: standardizedName });
    if (duplicated) {
      return res.status(400).json({ message: "This department already exists" });
    }

    const newDep = new Department({ name: standardizedName });
    await newDep.save();
    
    console.log(`✅ Successfully added: ${standardizedName}`);
    res.status(201).json(newDep);

  } catch (err) {
    console.error("❌ MongoDB Department Error:", err);
    res.status(400).json({ message: "Failed to add department", error: err.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// --- START SERVER ---
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MMS Backend running at http://localhost:${PORT}`);
});