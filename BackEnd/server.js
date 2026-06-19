const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- MODELS ---
const Request = require('./models/Request');
const User = require('./models/User');
const ToolGRN = require('./models/ToolGRN'); 
const Inventory = require('./models/Inventory'); 
const Department = require('./models/Department'); 
const Material = require('./models/Material');
const StaffInventory = require('./models/StaffInventory'); // ✅ ඔයා දැනටමත් Import කර ඇති මොඩල් එක
const Notification = require('./models/Notification'); // ✅ ADDED: Notification මොඩල් එක සම්බන්ධ කිරීම

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE CONNECTION & AUTOMATIC INDEX RESET LOGIC ---
mongoose.connect('mongodb://localhost:27017/mms_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB (mms_db)');
    
    try {
      if (mongoose.connection.models['Inventory']) {
        await mongoose.connection.models['Inventory'].syncIndexes();
        console.log('🔄 Inventory Database Indexes Synced Successfully.');
      }

      if (mongoose.connection.models['StaffInventory']) {
        await mongoose.connection.models['StaffInventory'].syncIndexes();
        console.log('🔄 StaffInventory Database Indexes Synced Successfully.');
      }

      const collections = await mongoose.connection.db.listCollections().toArray();
      const deptExists = collections.some(col => col.name === 'departments');
      
      if (deptExists) {
        await mongoose.connection.db.dropCollection('departments');
        console.log('🗑️ Cleared stale unique indexes by dropping departments collection.');
      }
    } catch (indexErr) {
      console.log('ℹ️ Safe core database initialization passed.');
    }

    await seedDefaultAdmin();
  })
  .catch(err => console.error('❌ Connection error:', err));

// AUTO-SEED LOGIC FOR NEW DATABASE
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
    const lastGRN = await ToolGRN.findOne({}, { grnId: 1 }).sort({ _id: -1 }); 
    if (!lastGRN || !lastGRN.grnId) return "GRN000001";
    const lastNum = parseInt(lastGRN.grnId.replace("GRN", ""), 10);
    return `GRN${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    return "GRN000001";
  }
};

// Invoice අංකය ගණනය කරන Helper එක
const generateNextInvoiceCode = async () => {
  try {
    const lastGRN = await ToolGRN.findOne({}, { invoiceCode: 1 }).sort({ _id: -1 }); 
    if (!lastGRN || !lastGRN.invoiceCode) return "INV000001";
    
    const lastNum = parseInt(lastGRN.invoiceCode.replace("INV", ""), 10);
    return `INV${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    console.error("❌ Error generating invoice code:", error);
    return "INV000001";
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
    const staff = await User.find({ userType: 'Maintenance Staff' }, 'username _id text userType');
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

// 💡 1. Admin විසින් Maintenance Staff කෙනෙක්ව Assign කරන Route එක (With Notification)
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

    // 🔔 Staff සාමාජිකයාට අලුත් Job එකක් ලැබුණු බවට Notification එකක් සාදයි
    const newNotif = new Notification({
      userId: staffId,
      message: `You have been assigned to a new Maintenance Job: ${updated.tid} - ${updated.description || 'No Description'}`,
      type: 'ASSIGNED',
      requestId: updated._id
    });
    await newNotif.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Assignment failed" });
  }
});

// 💡 2. NEW END-POINT: Staff සාමාජිකයා තමන්ගේ වැඩේ ඉවර කරලා Complete කළ විට (Status -> Under Review + Notification to Admin)
app.patch('/api/requests/complete/:id', async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Under Review', updatedAt: new Date() },
      { new: true }
    );

    // පද්ධතියේ සිටින Admin ව සොයා ගනී
    const adminUser = await User.findOne({ userType: 'Admin' });
    if (adminUser) {
      const newNotif = new Notification({
        userId: adminUser._id,
        message: `Maintenance Job ${updated.tid} has been completed by ${updated.assignedTo}. Needs your Review & Approval.`,
        type: 'COMPLETED',
        requestId: updated._id
      });
      await newNotif.save();
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to mark as complete", error: err.message });
  }
});

// 💡 3. NEW END-POINT: Admin විසින් එම Job එක Approve හෝ Reject කරන අවස්ථාව (Status මාරු වීම + Staff Notification)
app.patch('/api/requests/review/:id', async (req, res) => {
  try {
    const { action } = req.body; // 'APPROVE' හෝ 'REJECT'
    const finalStatus = action === 'APPROVE' ? 'Approved' : 'Assigned'; // Reject කළොත් නැවත Assigned තත්ත්වයට පත් වේ

    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status: finalStatus, updatedAt: new Date() },
      { new: true }
    );

    // අදාළ වැඩේ භාරව සිටි Staff සාමාජිකයාට ප්‍රතිඵලය දැනුම් දීම
    if (updated.assignedToId) {
      const msg = action === 'APPROVE' 
        ? `Congratulations! Admin APPROVED your work on Job: ${updated.tid}.` 
        : `Attention Required! Admin REJECTED your work on Job: ${updated.tid}. Please redo and complete it properly.`;

      const newNotif = new Notification({
        userId: updated.assignedToId,
        message: msg,
        type: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        requestId: updated._id
      });
      await newNotif.save();
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Review process failed", error: err.message });
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

// --- 🔔 GENERAL NOTIFICATION ROUTES ---
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifs || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.patch('/api/notifications/read/:id', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification status" });
  }
});

// --- TOOL ITEM GRN & INVENTORY ROUTES ---

app.get('/api/grn', async (req, res) => {
  try {
    const grns = await ToolGRN.find({}).sort({ createdAt: -1 });
    res.status(200).json(grns || []);
  } catch (err) {
    console.error("❌ Fetch GRN Server Error:", err);
    res.status(200).json([]); 
  }
});

app.get('/api/grn/next-invoice', async (req, res) => {
  try {
    const nextInvoice = await generateNextInvoiceCode();
    res.status(200).json({ nextInvoice });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate invoice code" });
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
          code: item.code || "GEN-MAT", 
          itemName: item.itemName || item.itemDescription || "UNKNOWN ITEM",
          grnId: nextGrnId,
          grnObjectId: savedGrn._id,
          cost: isNaN(parsedCost) ? 0 : parsedCost,
          quantity: isNaN(parsedQty) ? 1 : parsedQty, 
          status: 'In Stock',
          supplier: req.body.supplier || req.body.vendor || "NOT SPECIFIED"
        };
      });
      
      await Inventory.insertMany(inventoryEntries);
    }

    res.status(201).json(savedGrn);
  } catch (err) {
    console.error("GRN POST ERROR:", err);
    res.status(400).json({ message: "GRN creation failed", error: err.message });
  }
});

// ✅ පොදු ගබඩාවෙන් බඩුවක් දෙන ගමන්ම, අදාළ Staff User ගේ පුද්ගලික Stock එකට (StaffInventory) දත්ත එකතු වන පරිදි සකස් කළා.
app.patch('/api/grn/allocate', async (req, res) => {
  try {
    const { grnObjectId, itemObjectId, staffName, staffId, itemName } = req.body;

    const targetItemName = itemName || req.body.itemName;

    // 1. පොදු Inventory එකේ status එක 'Assigned' කිරීම
    const inventoryItem = await Inventory.findOneAndUpdate(
      { grnObjectId: grnObjectId, itemName: targetItemName }, 
      { status: 'Assigned', assignedTo: staffName },
      { new: true }
    );

    // 2. 💡 NEW UNIQUE SCENARIO: එකම Collection එකක් ඇතුළේ අදාළ Staff User ID එක යටතේ දත්ත වෙන් කර තැබීම
    if (inventoryItem && staffId) {
      await StaffInventory.findOneAndUpdate(
        { userId: staffId, code: inventoryItem.code || "GEN-MAT" },
        {
          $set: { staffName: staffName, itemName: inventoryItem.itemName },
          $inc: { quantity: inventoryItem.quantity || 1 }, 
          $setOnInsert: { grnId: inventoryItem.grnId || "N/A", allocatedDate: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    // 3. ToolGRN එක ඇතුළත දත්ත යාවත්කාලීන කිරීම
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
    console.error("❌ Allocation Route Error:", err);
    res.status(400).json({ message: "Allocation failed" });
  }
});

app.get('/api/staff-inventory/:staffId', async (req, res) => {
  try {
    const staffStock = await StaffInventory.find({ userId: req.params.staffId }).sort({ updatedAt: -1 });
    res.status(200).json(staffStock || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff personal inventory" });
  }
});

// --- MATERIALS REGISTRY ROUTES (GET & POST) ---
app.get('/api/materials', async (req, res) => {
  try {
    const materials = await Material.find({}).sort({ createdAt: -1 });
    res.status(200).json(materials || []);
  } catch (err) {
    console.error("❌ Fetch Materials Server Error:", err);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { code, itemName, description, cost } = req.body;

    const existingMaterial = await Material.findOne({ code: code.trim().toUpperCase() });
    if (existingMaterial) {
      return res.status(400).json({ message: "This Material Code already exists!" });
    }

    const newMaterial = new Material({
      code: code.trim().toUpperCase(),
      itemName,
      description,
      cost: Number(cost)
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json(savedMaterial);
  } catch (err) {
    console.error("❌ Material Registration Server Error:", err);
    res.status(400).json({ message: "Failed to register material", error: err.message });
  }
});

// --- DEPARTMENT MANAGEMENT ---

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