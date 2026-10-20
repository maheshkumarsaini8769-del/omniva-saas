const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { triggerAutomation } = require('../services/automationEngine');

// @desc    Create a new lead (Manual, Form, or API)
// @route   POST /api/crm/leads
// @access  Protected (Merchant Owner & Staff)
const createLead = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      source,
      campaignName,
      adSetName,
      adName,
      budget,
      assignedTo,
      customFields,
      initialNote,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Lead name and phone number are required',
      });
    }

    // Check for existing duplicate lead with the same phone number for this tenant
    const existingDuplicate = await Lead.findOne({
      businessId: req.businessId,
      phone: phone.trim(),
    });

    let assignedStaffName = 'Unassigned';
    if (assignedTo) {
      const staffUser = await User.findOne({
        _id: assignedTo,
        businessId: req.businessId,
      });
      if (staffUser) {
        assignedStaffName = staffUser.name;
      }
    }

    const notesArray = [];
    if (initialNote) {
      notesArray.push({
        note: initialNote,
        author: req.user._id,
        authorName: req.user.name,
      });
    }

    if (existingDuplicate) {
      notesArray.push({
        note: `[System Notice] Possible duplicate lead. Another lead with phone ${phone} already exists in stage: ${existingDuplicate.status}.`,
        author: req.user._id,
        authorName: 'System Auditor',
      });
    }

    const lead = await Lead.create({
      businessId: req.businessId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : '',
      source: source || 'MANUAL',
      campaignName: campaignName || '',
      adSetName: adSetName || '',
      adName: adName || '',
      budget: Number(budget) || 0,
      assignedTo: assignedTo || null,
      assignedToName: assignedStaffName,
      customFields: customFields || {},
      notes: notesArray,
    });

    // Fire Automation rule asynchronously
    try {
      triggerAutomation({
        businessId: req.businessId,
        trigger: 'LEAD_INGESTED',
        entityType: 'LEAD',
        entityId: lead._id.toString(),
        data: {
          customerName: lead.name,
          customerPhone: lead.phone,
          source: lead.source,
          campaignName: lead.campaignName,
          budget: lead.budget || 0,
          isDuplicate: !!existingDuplicate,
        },
      }).catch((e) => console.error('[CRM Lead Automation Warning]:', e.message));
    } catch (autoErr) {
      console.warn('[CRM Lead Automation Error]:', autoErr.message);
    }

    res.status(201).json({
      success: true,
      message: existingDuplicate
        ? 'Lead created (Duplicate phone detected)'
        : 'Lead created successfully',
      isDuplicate: !!existingDuplicate,
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating lead',
    });
  }
};

// @desc    Get all leads with filters & Kanban pipeline summary
// @route   GET /api/crm/leads
// @access  Protected
const getLeads = async (req, res) => {
  try {
    const { status, assignedTo, source, search, limit = 50, page = 1 } = req.query;

    const query = { businessId: req.businessId };

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (source) {
      query.source = source;
    }

    if (search) {
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { campaignName: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    let leads = [];
    let totalCount = 0;
    let pipelineAggregate = [];

    if (mongoose.connection.readyState === 1) {
      [leads, totalCount, pipelineAggregate] = await Promise.all([
        Lead.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Lead.countDocuments(query),
        Lead.aggregate([
          { $match: { businessId: req.businessId } },
          { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$budget' } } },
        ]),
      ]);
    } else {
      leads = [
        {
          _id: 'lead_demo_1',
          name: 'Sunita Aggarwal',
          phone: '9876543211',
          email: 'sunita@gmail.com',
          source: 'META_ADS',
          status: 'QUALIFIED',
          campaignName: 'Diwali Festive Combo Promo',
          budget: 1500,
          createdAt: new Date()
        },
        {
          _id: 'lead_demo_2',
          name: 'Vikram Rajput',
          phone: '9812345679',
          email: 'vikram@rajputfoods.com',
          source: 'WHATSAPP',
          status: 'CONTACTED',
          campaignName: 'Restaurant B2B Bulk Inquiry',
          budget: 5000,
          createdAt: new Date(Date.now() - 3600000 * 4)
        }
      ];
      totalCount = 2;
      pipelineAggregate = [
        { _id: 'NEW', count: 1, totalBudget: 500 },
        { _id: 'CONTACTED', count: 1, totalBudget: 5000 },
        { _id: 'QUALIFIED', count: 1, totalBudget: 1500 }
      ];
    }

    // Build standard pipeline counts
    const pipelineSummary = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      QUOTATION_SENT: 0,
      WON: 0,
      LOST: 0,
    };

    let totalPipelineValue = 0;
    pipelineAggregate.forEach((item) => {
      if (pipelineSummary[item._id] !== undefined) {
        pipelineSummary[item._id] = item.count;
      }
      if (item._id !== 'LOST') {
        totalPipelineValue += item.totalBudget || 0;
      }
    });

    res.status(200).json({
      success: true,
      totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      pipelineSummary,
      totalPipelineValue,
      leads,
      data: leads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching leads',
    });
  }
};

// @desc    Get single lead by ID (Strict tenant isolation)
// @route   GET /api/crm/leads/:id
// @access  Protected
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching lead details',
    });
  }
};

// @desc    Update lead status (Kanban stage transition)
// @route   PATCH /api/crm/leads/:id/status
// @access  Protected
const updateLeadStatus = async (req, res) => {
  try {
    const { status, lostReason } = req.body;

    const allowedStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTATION_SENT', 'WON', 'LOST'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Permitted: ${allowedStatuses.join(', ')}`,
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    const prevStatus = lead.status;
    lead.status = status;
    if (status === 'LOST' && lostReason) {
      lead.lostReason = lostReason;
    }

    // Add audit note to lead timeline
    lead.notes.push({
      note: `Stage changed from ${prevStatus} to ${status} by ${req.user.name}`,
      author: req.user._id,
      authorName: req.user.name,
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: `Lead moved to ${status}`,
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating lead stage',
    });
  }
};

// @desc    Assign lead to staff member
// @route   PATCH /api/crm/leads/:id/assign
// @access  Protected
const assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    let staffName = 'Unassigned';
    let staffId = null;

    if (assignedTo) {
      const staffUser = await User.findOne({
        _id: assignedTo,
        businessId: req.businessId,
      });

      if (!staffUser) {
        return res.status(404).json({
          success: false,
          message: 'Staff user not found in your business',
        });
      }
      staffName = staffUser.name;
      staffId = staffUser._id;
    }

    lead.assignedTo = staffId;
    lead.assignedToName = staffName;
    lead.notes.push({
      note: `Lead assigned to ${staffName} by ${req.user.name}`,
      author: req.user._id,
      authorName: req.user.name,
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: `Lead assigned to ${staffName}`,
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error assigning lead',
    });
  }
};

// @desc    Add a note to lead activity timeline
// @route   POST /api/crm/leads/:id/notes
// @access  Protected
const addNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot be empty',
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    const newNote = {
      note: note.trim(),
      author: req.user._id,
      authorName: req.user.name,
      createdAt: new Date(),
    };

    lead.notes.push(newNote);
    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Note added to timeline',
      note: newNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding note',
    });
  }
};

// @desc    Log a phone call interaction
// @route   POST /api/crm/leads/:id/call-logs
// @access  Protected
const logCall = async (req, res) => {
  try {
    const { durationSeconds, outcome, notes } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    const newLog = {
      durationSeconds: Number(durationSeconds) || 0,
      outcome: outcome || 'CONNECTED',
      notes: notes || '',
      loggedBy: req.user._id,
      loggedByName: req.user.name,
      createdAt: new Date(),
    };

    lead.callLogs.push(newLog);

    // Also automatically move from NEW to CONTACTED if it was in NEW stage
    if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
      lead.notes.push({
        note: `Stage automatically updated to CONTACTED following logged call by ${req.user.name}`,
        author: req.user._id,
        authorName: req.user.name,
      });
    }

    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Call log recorded',
      callLog: newLog,
      status: lead.status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error logging call',
    });
  }
};

// @desc    Schedule a follow-up task
// @route   POST /api/crm/leads/:id/tasks
// @access  Protected
const createTask = async (req, res) => {
  try {
    const { title, dueDate, assignedTo } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Task title and due date are required',
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    const newTask = {
      title: title.trim(),
      dueDate: new Date(dueDate),
      isCompleted: false,
      assignedTo: assignedTo || req.user._id,
      createdAt: new Date(),
    };

    lead.tasks.push(newTask);
    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up task scheduled',
      task: newTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating follow-up task',
    });
  }
};

// @desc    Toggle task completion
// @route   PATCH /api/crm/leads/:leadId/tasks/:taskId
// @access  Protected
const toggleTask = async (req, res) => {
  try {
    const { leadId, taskId } = req.params;

    const lead = await Lead.findOne({
      _id: leadId,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied',
      });
    }

    const task = lead.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.isCompleted = !task.isCompleted;
    await lead.save();

    res.status(200).json({
      success: true,
      message: `Task marked ${task.isCompleted ? 'completed' : 'pending'}`,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating task',
    });
  }
};

// @desc    Get CRM KPI Analytics
// @route   GET /api/crm/stats
// @access  Protected
const getCRMStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [totalLeads, wonLeads, pipelineAggregate, overdueTasksAggregate] = await Promise.all([
      Lead.countDocuments({ businessId: req.businessId }),
      Lead.countDocuments({ businessId: req.businessId, status: 'WON' }),
      Lead.aggregate([
        { $match: { businessId: req.businessId } },
        { $group: { _id: null, totalValue: { $sum: '$budget' } } },
      ]),
      Lead.aggregate([
        { $match: { businessId: req.businessId } },
        { $unwind: '$tasks' },
        {
          $match: {
            'tasks.isCompleted': false,
            'tasks.dueDate': { $lt: now },
          },
        },
        { $count: 'overdueCount' },
      ]),
    ]);

    const totalPipelineValue = pipelineAggregate[0]?.totalValue || 0;
    const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const overdueTasks = overdueTasksAggregate[0]?.overdueCount || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalLeads,
        wonLeads,
        winRate: `${winRate}%`,
        totalPipelineValue,
        overdueTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching CRM stats',
    });
  }
};

// @desc    Convert an existing CRM Lead into a confirmed Order (1-Click)
// @route   POST /api/crm/leads/:id/convert-to-order
// @access  Protected (Merchant Owner & Staff)
const convertLeadToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      street,
      city,
      state,
      pincode,
      landmark,
      productId,
      productName,
      price,
      quantity = 1,
      paymentMethod = 'COD',
      notes,
    } = req.body;

    const lead = await Lead.findOne({
      _id: id,
      businessId: req.businessId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or does not belong to your business',
      });
    }

    // Determine target Product for Order validation
    let targetProductId = productId;
    let itemPrice = price !== undefined ? Number(price) : (lead.budget > 0 ? lead.budget : 299);
    let itemName = productName || lead.customFields?.get?.('productName') || 'Product from Lead Deal';
    let itemImage = '';

    if (targetProductId && mongoose.Types.ObjectId.isValid(targetProductId)) {
      const prod = await Product.findOne({ _id: targetProductId, businessId: req.businessId });
      if (prod) {
        itemName = prod.name;
        if (!price) itemPrice = prod.price;
        itemImage = prod.images?.[0] || '';
      }
    } else {
      // Find any existing business product or fallback placeholder
      const existingProduct = await Product.findOne({ businessId: req.businessId });
      if (existingProduct) {
        targetProductId = existingProduct._id;
        if (!productName) itemName = existingProduct.name;
        if (!price && lead.budget === 0) itemPrice = existingProduct.price;
        itemImage = existingProduct.images?.[0] || '';
      } else {
        // Create an ad-hoc product placeholder
        const createdProd = await Product.create({
          businessId: req.businessId,
          name: itemName,
          price: itemPrice,
          isAvailable: true,
        });
        targetProductId = createdProd._id;
      }
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = itemPrice * quantity;
    const totalAmount = subtotal;

    // Create the Order directly
    const cleanPin = (pincode || lead.customFields?.get?.('pincode') || '110001').toString().replace(/\D/g, '');
    const validPin = cleanPin.length === 6 && /^[1-9][0-9]{5}$/.test(cleanPin) ? cleanPin : '110001';

    const newOrder = await Order.create({
      businessId: req.businessId,
      orderNumber,
      customerName: lead.name,
      customerPhone: lead.phone,
      customerEmail: lead.email || '',
      shippingAddress: {
        street: street || lead.customFields?.get?.('address') || 'Direct Inquired Address',
        city: city || lead.customFields?.get?.('city') || 'Local City',
        state: state || '',
        pincode: validPin,
        landmark: landmark || '',
      },
      items: [
        {
          productId: targetProductId,
          name: itemName,
          price: itemPrice,
          quantity: quantity,
          subtotal: subtotal,
          image: itemImage,
        },
      ],
      subtotal,
      shippingFee: 0,
      discount: 0,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      orderStatus: 'CONFIRMED',
      timeline: [
        {
          status: 'CONFIRMED',
          note: `Converted directly from CRM Lead by ${req.user.name || 'Staff'}${notes ? ': ' + notes : ''}`,
          updatedBy: req.user.name || 'Staff',
          timestamp: new Date(),
        },
      ],
    });

    // Mark Lead as WON and record note
    lead.status = 'WON';
    lead.budget = totalAmount;
    lead.notes.push({
      note: `⚡ Successfully converted to Order #${orderNumber} (₹${totalAmount}) via 1-Click Conversion by ${req.user.name || 'Staff'}.`,
      author: req.user._id,
      authorName: req.user.name || 'Staff',
      createdAt: new Date(),
    });
    await lead.save();

    res.status(201).json({
      success: true,
      message: `Lead successfully converted to Order #${orderNumber}`,
      data: {
        order: newOrder,
        lead,
      },
    });
  } catch (error) {
    console.error('Error converting lead to order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while converting lead to order',
    });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  assignLead,
  addNote,
  logCall,
  createTask,
  toggleTask,
  getCRMStats,
  convertLeadToOrder,
};
