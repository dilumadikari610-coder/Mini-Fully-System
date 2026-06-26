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
const StaffInventory = require('./models/StaffInventory'); 
const Notification = require('./models/Notification'); 
const Supplier = require('./models/Supplier'); 
// WORKFLOW ENGINE MODEL
const WorkflowTemplate = require('./models/WorkflowTemplate'); 

const app = Web = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE CONNECTION & AUTOMATIC INDEX RESET LOGIC ---
mongoose.connect('mongodb://localhost:27017/mms_db')
  .then(() => {
    console.log('✅ Connected to MongoDB (mms_db)');
    
    // Core database safe initializations
    if (mongoose.connection.models['Inventory']) {
      mongoose.connection.models['Inventory'].syncIndexes()
        .then(() => console.log('🔄 Inventory Database Indexes Synced Successfully.'))
        .catch(() => {});
    }

    if (mongoose.connection.models['StaffInventory']) {
      mongoose.connection.models['StaffInventory'].syncIndexes()
        .then(() => console.log('🔄 StaffInventory Database Indexes Synced Successfully.'))
        .catch(() => {});
    }

    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        const deptExists = collections.some(col => col.name === 'departments');
        if (deptExists) {
          mongoose.connection.db.dropCollection('departments')
            .then(() => console.log('🗑️ Cleared stale unique indexes by dropping departments collection.'))
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Trigger Admin Auto-seed rotation without top-level await
    seedDefaultAdmin();
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
    const lastGRN = await ToolGRN.findOne({}, { grnId: 1, invoiceCode: 1 }).sort({ _id: -1 }); 
    if (!lastGRN) return "GRN000001";
    
    const targetCode = lastGRN.grnId || lastGRN.invoiceCode || "GRN000000";
    const lastNum = parseInt(targetCode.replace("GRN", "").replace("INV", ""), 10);
    
    if (isNaN(lastNum)) return "GRN000001";
    return `GRN${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    return "GRN000001";
  }
};

const generateNextInvoiceCode = async () => {
  try {
    const lastGRN = await ToolGRN.findOne({}, { invoiceCode: 1, grnId: 1 }).sort({ _id: -1 }); 
    if (!lastGRN) return "INV000001";
    
    const targetCode = lastGRN.invoiceCode || lastGRN.grnId || "INV000000";
    const lastNum = parseInt(targetCode.replace("INV", "").replace("GRN", ""), 10);
    
    if (isNaN(lastNum)) return "INV000001";
    return `INV${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    console.error("❌ Error generating invoice code:", error);
    return "INV000001";
  }
};

// Helper for Supplier ID (SPL000001)
const generateNextSupplierID = async () => {
  try {
    const lastSupplier = await Supplier.findOne({}, { supplierId: 1 }).sort({ _id: -1 });
    if (!lastSupplier || !lastSupplier.supplierId) return "SPL000001";
    const lastNum = parseInt(lastSupplier.supplierId.replace("SPL", ""), 10);
    return `SPL${(lastNum + 1).toString().padStart(6, '0')}`;
  } catch (error) {
    return "SPL000001";
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
    const { username, password, userType, department, permissionMatrix } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    const newUser = new User({ 
      username, 
      password, 
      userType, 
      department,
      permissionMatrix: permissionMatrix || {}
    });
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

app.patch('/api/users/update-permissions/:id', async (req, res) => {
  try {
    const { userType, department, permissionMatrix } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          userType, 
          department, 
          permissionMatrix 
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User profile context not discovered" });
    }

    res.json({ message: "User security matrix clearance tokens updated successfully!" });
  } catch (err) {
    console.error("❌ Permission Matrix Update Error:", err);
    res.status(500).json({ message: "Failed to finalize encryption matrix update" });
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

    const newNotif = new Notification({
      userId: staffId,
      message: `You have been assigned to a new Maintenance Job: ${updated.tid} - ${updated.description || 'No Description'}`,
      type: 'ASSIGNED',
      requestId: updated._id
    });
    await newNotif.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Authorization assignment failed" });
  }
});

app.patch('/api/requests/complete/:id', async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Under Review', updatedAt: new Date() },
      { new: true }
    );

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

app.patch('/api/requests/review/:id', async (req, res) => {
  try {
    const { action } = req.body; 
    const finalStatus = action === 'APPROVE' ? 'Approved' : 'Assigned'; 

    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { status: finalStatus, updatedAt: new Date() },
      { new: true }
    );

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

// 💡 DYNAMIC WORKFLOW CONFIGURATION INTEGRATED GRN POST ROUTE
app.post('/api/grn', async (req, res) => {
  try {
    const incomingCode = req.body.invoiceCode || await generateNextInvoiceCode();
    const finalGRNCode = incomingCode.replace("INV", "GRN"); 

    const { workflowTemplateCode } = req.body;
    let initialStatus = 'In Stock'; 
    let assignedApproversChain = [];
    let currentApprovalLevel = 0;

    if (workflowTemplateCode) {
      const template = await WorkflowTemplate.findOne({ 
        code: { $regex: new RegExp(`^${workflowTemplateCode.trim()}$`, 'i') } 
      });
      
      if (template && template.approvers.length > 0) {
        initialStatus = 'PENDING_APPROVAL';
        assignedApproversChain = template.approvers;
        currentApprovalLevel = 1; 
      }
    }

    console.log(`📥 Database Syncing New GRN Sequence: ${finalGRNCode} | Status: ${initialStatus}`);
    
    const newGrn = new ToolGRN({
      ...req.body,
      invoiceCode: finalGRNCode,
      grnId: finalGRNCode,
      status: initialStatus,
      workflowTemplateCode: workflowTemplateCode || 'DIRECT_POST',
      currentApprovalLevel: currentApprovalLevel,
      approversChain: assignedApproversChain
    });
    const savedGrn = await newGrn.save();

    if (initialStatus === 'In Stock' && req.body.items && req.body.items.length > 0) {
      const inventoryEntries = req.body.items.map(item => {
        const parsedQty = Number(item.qty || item.quantity);
        const parsedCost = Number(item.cost || item.price);

        return {
          code: item.code || "GEN-MAT", 
          itemName: item.itemName || item.itemDescription || "UNKNOWN ITEM",
          grnId: finalGRNCode,
          grnObjectId: savedGrn._id,
          cost: isNaN(parsedCost) ? 0 : parsedCost,
          quantity: isNaN(parsedQty) ? 1 : parsedQty, 
          status: 'In Stock',
          supplier: req.body.supplier || req.body.vendor || "NOT SPECIFIED"
        };
      });
      
      await Inventory.insertMany(inventoryEntries);
    } else if (initialStatus === 'PENDING_APPROVAL' && assignedApproversChain.length > 0) {
      const firstApprover = assignedApproversChain.find(appr => appr.orderLevel === 1);
      if (firstApprover) {
        const newNotif = new Notification({
          userId: firstApprover.user,
          message: `New GRN Pending Approval: ${finalGRNCode} requires your Level-1 Authorization.`,
          type: 'COMPLETED', 
          createdAt: new Date()
        });
        await newNotif.save();
      }
    }

    res.status(201).json(savedGrn);
  } catch (err) {
    console.error("GRN POST ERROR:", err);
    res.status(400).json({ message: "GRN creation failed", error: err.message });
  }
});

app.patch('/api/grn/allocate', async (req, res) => {
  try {
    const { grnObjectId, itemObjectId, staffName, staffId, itemName } = req.body;
    const targetItemName = itemName || req.body.itemName;

    const inventoryItem = await Inventory.findOneAndUpdate(
      { grnObjectId: grnObjectId, itemName: targetItemName }, 
      { status: 'Assigned', assignedTo: staffName },
      { new: true }
    );

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

// 💡 FIXED & VALIDATED WORKFLOW METHOD: BULK MULTI-ITEM ALLOCATION PIPELINE
app.post('/api/grn/allocate-bulk', async (req, res) => {
  try {
    const { allocationDocNo, staffId, staffName, allocatedItems } = req.body;

    if (!allocatedItems || allocatedItems.length === 0) {
      return res.status(400).json({ message: "Allocation item list basket is empty" });
    }

    // --- 🔍 FIRST PASS: VALIDATE ALL ITEM STOCK QUANTITIES ---
    for (const item of allocatedItems) {
      const dbItem = await Inventory.findOne({ grnId: item.grnInvoiceCode, code: item.materialCode });
      
      if (!dbItem) {
        return res.status(404).json({ message: `Material [${item.materialCode}] not found in GRN ${item.grnInvoiceCode}` });
      }

      // දැනට ඉතිරිව තියෙන ප්‍රමාණයට වඩා වැඩි ගාණක් ඉල්ලනවා නම් මෙතනින්ම බ්ලොක් කරනවා
      if (Number(item.qty) > Number(dbItem.quantity)) {
        return res.status(400).json({ 
          message: `Validation Error: Imbalance stock for ${item.itemName}. Available: ${dbItem.quantity}, Requested: ${item.qty}` 
        });
      }
    }

    // --- 💾 SECOND PASS: EXECUTE ALLOCATION PIPELINE IF VALIDATION PASSES ---
    const operations = allocatedItems.map(async (item) => {
      await Inventory.findOneAndUpdate(
        { grnId: item.grnInvoiceCode, code: item.materialCode },
        { 
          $set: { status: 'Assigned', assignedTo: staffName },
          $inc: { quantity: -Number(item.qty) } 
        }
      );

      await StaffInventory.findOneAndUpdate(
        { userId: staffId, code: item.materialCode },
        {
          $set: { staffName: staffName, itemName: item.itemName, grnId: item.grnInvoiceCode },
          $inc: { quantity: Number(item.qty) },
          $setOnInsert: { allocatedDate: new Date() }
        },
        { upsert: true, new: true }
      );

      await ToolGRN.findOneAndUpdate(
        { grnId: item.grnInvoiceCode, "items.code": item.materialCode },
        {
          $set: {
            "items.$.status": "Assigned",
            "items.$.assignedStaff": staffName
          }
        }
      );
    });

    await Promise.all(operations);

    const bulkNotif = new Notification({
      userId: staffId,
      message: `Bulk Stock Handover Verified! Document ${allocationDocNo} assigned ${allocatedItems.length} inventory tools to your custody.`,
      type: 'ASSIGNED',
      createdAt: new Date()
    });
    await bulkNotif.save();

    res.status(200).json({ message: "Bulk allocation document posted successfully", allocationDocNo });
  } catch (err) {
    console.error("❌ Bulk Allocation Engine Error:", err);
    res.status(500).json({ message: "Failed to process complex bulk allocation registry" });
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

// --- SUPPLIER MANAGEMENT ROUTES ---
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    res.status(200).json(suppliers || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const nextSplId = await generateNextSupplierID();
    const { name, contactPerson, phone, address } = req.body;

    const duplicate = await Supplier.findOne({ name: name.trim().toUpperCase() });
    if (duplicate) return res.status(400).json({ message: "This Supplier Name already exists!" });

    const newSupplier = new Supplier({
      supplierId: nextSplId,
      name, contactPerson, phone, address
    });

    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(400).json({ message: "Failed to register supplier", error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
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

// --- NEW WORKFLOW ROUTING ENGINE ENDPOINTS ---
app.post('/api/workflow/templates', async (req, res) => {
  try {
    const { code, description, permission, approvers } = req.body;
    const existing = await WorkflowTemplate.findOne({ code: code.trim().toUpperCase() });
    if (existing) return res.status(400).json({ message: "This Workflow Code already exists!" });

    const newTemplate = new WorkflowTemplate({
      code: code.trim().toUpperCase(),
      description,
      permission,
      approvers
    });
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(500).json({ message: "Failed to post workflow matrix template" });
  }
});

app.get('/api/workflow/templates', async (req, res) => {
  try {
    const templates = await WorkflowTemplate.find({}).sort({ createdAt: -1 });
    res.json(templates || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to load workflow engine templates" });
  }
});

app.delete('/api/workflow/templates/:id', async (req, res) => {
  try {
    await WorkflowTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: "Workflow Template Purged Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove matrix template" });
  }
});

// 💡 NEW WORKFLOW METHOD: APPROVER REVIEW & AUTHORIZATION ENGINE
app.patch('/api/grn/review/:id', async (req, res) => {
  try {
    const grnId = req.params.id;
    const { action, username, rejectionComment } = req.body; 

    const grn = await ToolGRN.findById(grnId);
    if (!grn) return res.status(404).json({ message: "GRN record not found" });

    if (grn.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: "This GRN has already been processed" });
    }

    if (action === 'REJECT') {
      grn.status = 'REJECTED'; 
      grn.rejectionComment = rejectionComment || 'No comment provided';
      await grn.save();

      const rejectNotif = new Notification({
        userId: grn.submittedBy || mongoose.Types.ObjectId(), 
        message: `Attention! GRN ${grn.invoiceCode} was REJECTED by ${username}. Status changed to Draft. Reason: ${rejectionComment}`,
        type: 'REJECTED',
        createdAt: new Date()
      });
      await rejectNotif.save();

      return res.json({ message: "GRN rejected back to draft successfully", status: "REJECTED" });
    }

    if (action === 'APPROVE') {
      const currentLevel = grn.currentApprovalLevel;
      const totalLevels = grn.approversChain?.length || 0;

      if (currentLevel < totalLevels) {
        grn.currentApprovalLevel = currentLevel + 1;
        await grn.save();

        const nextApprover = grn.approversChain.find(appr => appr.orderLevel === (currentLevel + 1));
        if (nextApprover) {
          const nextNotif = new Notification({
            userId: nextApprover.user,
            message: `GRN ${grn.invoiceCode} requires your Level-${currentLevel + 1} Authorization.`,
            type: 'COMPLETED',
            createdAt: new Date()
          });
          await nextNotif.save();
        }

        return res.json({ message: `Level-${currentLevel} approved successfully. Routed to next tier.`, status: "PENDING_APPROVAL" });
      } else {
        grn.status = 'APPROVED';
        await grn.save();

        if (grn.items && grn.items.length > 0) {
          const inventoryEntries = grn.items.map(item => {
            return {
              code: item.code || "GEN-MAT", 
              itemName: item.itemName || item.itemDescription || "UNKNOWN ITEM",
              grnId: grn.invoiceCode || grn.grnId,
              grnObjectId: grn._id,
              cost: Number(item.cost || item.price || 0),
              quantity: Number(item.qty || item.quantity || 1), 
              status: 'In Stock',
              supplier: grn.supplier || grn.vendor || "NOT SPECIFIED"
            };
          });
          
          await Inventory.insertMany(inventoryEntries);
        }

        return res.json({ message: "GRN fully approved and posted to stock registry database!", status: "APPROVED" });
      }
    }

  } catch (err) {
    console.error("❌ Review API Error:", err);
    res.status(500).json({ message: "Approval process transaction execution failed" });
  }
});

// --- START SERVER ---
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MMS Backend running at http://localhost:${PORT}`);
});