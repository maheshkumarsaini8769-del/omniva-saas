const mongoose = require('mongoose');
const { getPrimaryImageUrl } = require('../utils/productImages');
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
      data: lead,
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

    if (search && String(search).trim()) {
      const tokens = String(search).trim().split(/\s+/).filter(Boolean);
      const andClauses = tokens.map((token) => {
        const safeToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const tokenRegex = new RegExp(safeToken, 'i');
        return {
          $or: [
            { name: tokenRegex },
            { phone: tokenRegex },
            { email: tokenRegex },
            { campaignName: tokenRegex },
            { source: tokenRegex },
            { 'notes.note': tokenRegex },
          ],
        };
      });
      if (andClauses.length > 0) {
        query.$and = andClauses;
      }
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
      // Database unavailable: return an empty pipeline instead of inventing
      // customer leads that do not exist.
      leads = [];
      totalCount = 0;
      pipelineAggregate = [];
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
      data: lead,
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
      data: lead,
      note: newNote,
      notes: lead.notes,
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

    const allowedOutcomes = ['CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'CALLBACK_REQUESTED'];
    if (!allowedOutcomes.includes(outcome)) {
      return res.status(400).json({ success: false, message: 'Select a valid call outcome' });
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

    const newLog = {
      durationSeconds: Number(durationSeconds) || 0,
      outcome,
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
      paymentMethod,
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

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number' });
    }
    const qty = parsedQty;

    const cleanPaymentMethod = String(paymentMethod || '').trim().toUpperCase();
    if (!['COD', 'ONLINE'].includes(cleanPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Select a payment method (COD or ONLINE) before converting the lead',
      });
    }

    // Never invent an address or PIN code. Use the submitted values or data
    // already recorded on the lead, and fail closed when either is incomplete.
    const addressStreet = String(street || lead.customFields?.get?.('address') || '').trim();
    const addressCity = String(city || lead.customFields?.get?.('city') || '').trim();
    const addressState = String(state || lead.customFields?.get?.('state') || '').trim();
    const addressPin = String(pincode || lead.customFields?.get?.('pincode') || '').replace(/\D/g, '');
    if (!addressStreet || !addressCity || !/^[1-9][0-9]{5}$/.test(addressPin)) {
      return res.status(400).json({
        success: false,
        message: 'A complete delivery address with a valid 6-digit Indian PIN code is required',
      });
    }

    const requestedItemName = String(
      productName || lead.customFields?.get?.('productName') || ''
    ).trim();
    const requestedPrice = Number(price) > 0 ? Number(price) : Number(lead.budget) > 0 ? Number(lead.budget) : 0;
    if (!productId && (!requestedItemName || requestedPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'A line-item name and positive price are required when converting without a catalog product',
      });
    }

    // Determine target Product for Order validation. Prices always come from
    // the catalog when a product is selected; the browser cannot set them.
    let targetProductId = null;
    let itemVariantId = null;
    let itemPrice = requestedPrice;
    let itemName = requestedItemName;
    let itemImage = '';
    let productForStock = null;

    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }
      const prod = await Product.findOne({ _id: productId, businessId: req.businessId });
      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product not found in this catalog' });
      }
      targetProductId = prod._id;
      itemName = prod.name;
      itemPrice = Number(prod.price) || 0;
      itemImage = getPrimaryImageUrl(prod.images);
      productForStock = prod;

      if (prod.variants && prod.variants.length > 0) {
        const variant =
          (req.body.variantId && prod.variants.id(req.body.variantId)) || prod.variants[0];
        if (variant) {
          itemVariantId = variant._id.toString();
          itemPrice = Number(variant.price) || itemPrice;
          itemName = `${prod.name} (${variant.name})`;
        }
      }
    } else {
      // A manual lead conversion without a catalog product is a custom line
      // item. Use a non-persisted ObjectId so it cannot pollute the catalog.
      targetProductId = new mongoose.Types.ObjectId();
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const subtotal = itemPrice * qty;
    const totalAmount = subtotal;

    // Reserve stock before creating the order so repeated conversions cannot
    // oversell, and roll it back if the order write fails.
    let stockDecremented = false;
    if (productForStock && productForStock.trackQuantity !== false) {
      let result;
      if (itemVariantId) {
        result = await Product.updateOne(
          {
            _id: productForStock._id,
            'variants._id': itemVariantId,
            'variants.stockQuantity': { $gte: qty },
          },
          { $inc: { 'variants.$.stockQuantity': -qty } }
        );
      } else {
        result = await Product.updateOne(
          { _id: productForStock._id, stockQuantity: { $gte: qty } },
          { $inc: { stockQuantity: -qty } }
        );
      }
      if (result.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${productForStock.name}`,
        });
      }
      stockDecremented = true;
    }

    // Create the Order directly
    let newOrder;
    try {
      newOrder = await Order.create({
        businessId: req.businessId,
        orderNumber,
        customerName: lead.name,
        customerPhone: lead.phone,
        customerEmail: lead.email || '',
        shippingAddress: {
          street: addressStreet,
          city: addressCity,
          state: addressState,
          pincode: addressPin,
          landmark: landmark || '',
        },
        items: [
          {
            productId: targetProductId,
            variantId: itemVariantId,
            name: itemName,
            price: itemPrice,
            quantity: qty,
            subtotal: subtotal,
            image: itemImage,
          },
        ],
        subtotal,
        shippingFee: 0,
        discount: 0,
        totalAmount,
        paymentMethod: cleanPaymentMethod,
        // A lead conversion creates an unpaid order. ONLINE payments become PAID
        // only after the signed Razorpay webhook confirms the captured amount.
        paymentStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        stockDecremented,
        timeline: [
          {
            status: 'CONFIRMED',
            note: `Converted directly from CRM Lead by ${req.user.name || 'Staff'}${notes ? ': ' + notes : ''}`,
            updatedBy: req.user.name || 'Staff',
            timestamp: new Date(),
          },
        ],
      });
    } catch (orderErr) {
      if (stockDecremented) {
        try {
          if (itemVariantId) {
            await Product.updateOne(
              { _id: productForStock._id, 'variants._id': itemVariantId },
              { $inc: { 'variants.$.stockQuantity': qty } }
            );
          } else {
            await Product.updateOne(
              { _id: productForStock._id },
              { $inc: { stockQuantity: qty } }
            );
          }
        } catch (restoreErr) {
          console.warn('[CRM Conversion Stock Rollback Warning]:', restoreErr.message);
        }
      }
      throw orderErr;
    }

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
