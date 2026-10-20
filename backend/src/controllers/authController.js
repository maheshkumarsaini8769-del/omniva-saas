const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const generateToken = require('../utils/generateToken');

// Helper to generate URL slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Register a new Merchant & Tenant atomically
// @route   POST /api/auth/register-merchant
// @access  Public
const registerMerchant = async (req, res) => {
  try {
    const { businessName, name, email, password, phone, businessType } = req.body;

    if (!businessName || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business name, owner name, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Generate unique slug for the business
    let slug = createSlug(businessName);
    let slugExists = await Tenant.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${createSlug(businessName)}-${counter}`;
      slugExists = await Tenant.findOne({ slug });
      counter++;
    }

    // Create Tenant
    const tenant = await Tenant.create({
      businessName,
      slug,
      businessType: businessType || 'PRODUCT',
      templateCode: businessType || 'PRODUCT',
      status: 'ACTIVE',
      planTier: 'GROWTH',
      contact: {
        email: email.toLowerCase(),
        phone: phone || '',
      },
    });

    // Create Merchant Owner User
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'MERCHANT_OWNER',
      businessId: tenant._id,
      phone: phone || '',
      isActive: true,
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
      businessId: tenant._id,
    });

    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant._id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        businessType: tenant.businessType,
        planTier: tenant.planTier,
        status: tenant.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during merchant registration',
    });
  }
};

// @desc    Universal Login (Super Admin, Merchant Owner, Staff)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Fail closed when the database is unreachable. Never issue tokens without a real user record.
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service is temporarily unavailable. Please try again.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administration.',
      });
    }

    let tenant = null;
    if (user.businessId) {
      tenant = await Tenant.findById(user.businessId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Associated business tenant not found',
        });
      }

      if (tenant.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Your business account is suspended. Contact Omniva support.',
        });
      }
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      businessId: tenant ? tenant._id : null,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      tenant: tenant
        ? {
            id: tenant._id,
            businessName: tenant.businessName,
            slug: tenant.slug,
            businessType: tenant.businessType,
            templateCode: tenant.templateCode || tenant.businessType,
            enabledModules: tenant.enabledModules || {
              products: true,
              serviceBookings: false,
              travelBookings: false,
              crmLeads: true,
              marketingAds: true,
              automations: true,
            },
            planTier: tenant.planTier,
            status: tenant.status,
            branding: tenant.branding,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current logged in user & tenant profile
// @route   GET /api/auth/me
// @access  Protected
const getMe = async (req, res) => {
  try {
    let user = req.user;
    if (mongoose.connection.readyState === 1 && req.user && req.user._id) {
      const dbUser = await User.findById(req.user._id).select('-password');
      if (dbUser) user = dbUser;
    }

    let tenant = null;
    if (mongoose.connection.readyState === 1 && user.businessId) {
      tenant = await Tenant.findById(user.businessId);
    }

    res.status(200).json({
      success: true,
      user,
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

// @desc    Setup initial Super Admin (or protected creation)
// @route   POST /api/auth/setup-superadmin
// @access  Public (only if no Super Admin exists) or Protected
const setupSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, masterKey } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Always require a configured master key. Never accept a hardcoded default.
    const expectedMasterKey = process.env.MASTER_SETUP_KEY;
    if (!expectedMasterKey) {
      return res.status(503).json({
        success: false,
        message: 'Super Admin setup is disabled. Set MASTER_SETUP_KEY to enable it.',
      });
    }

    const suppliedKey = Buffer.from(String(masterKey || ''));
    const expectedKey = Buffer.from(String(expectedMasterKey));
    const keyMatches =
      suppliedKey.length === expectedKey.length &&
      crypto.timingSafeEqual(suppliedKey, expectedKey);

    if (!keyMatches) {
      return res.status(403).json({
        success: false,
        message: 'Invalid master setup key',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const superAdmin = await User.create({
      name: name || 'Omniva Platform Owner',
      email: normalizedEmail,
      password,
      role: 'SUPER_ADMIN',
      businessId: null,
      isActive: true,
    });

    const token = generateToken({
      id: superAdmin._id,
      role: superAdmin.role,
      businessId: null,
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin initialized successfully',
      token,
      user: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error setting up Super Admin',
    });
  }
};

// @desc    Merchant creates staff sub-admin account
// @route   POST /api/auth/staff
// @access  Protected (MERCHANT_OWNER only)
const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const allowedStaffRoles = [
      'ORDER_MANAGER',
      'INVENTORY_STAFF',
      'MARKETING_STAFF',
      'SUPPORT_STAFF',
    ];

    if (!allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff role. Permitted: ${allowedStaffRoles.join(', ')}`,
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Create staff strictly bound to req.businessId
    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      businessId: req.businessId,
      phone: phone || '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Staff member (${role}) created successfully`,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        businessId: staff.businessId,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating staff account',
    });
  }
};

// @desc    Get staff members of current business
// @route   GET /api/auth/staff
// @access  Protected (MERCHANT_OWNER)
const getStaffList = async (req, res) => {
  try {
    const staffMembers = await User.find({
      businessId: req.businessId,
      _id: { $ne: req.user._id },
    }).select('-password');

    res.status(200).json({
      success: true,
      count: staffMembers.length,
      staff: staffMembers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staff members',
    });
  }
};

// @desc    Update a staff account inside the current business
// @route   PUT /api/auth/staff/:id
// @access  Protected (MERCHANT_OWNER)
const updateStaff = async (req, res) => {
  try {
    const allowedStaffRoles = [
      'ORDER_MANAGER',
      'INVENTORY_STAFF',
      'MARKETING_STAFF',
      'SUPPORT_STAFF',
    ];
    const staff = await User.findOne({
      _id: req.params.id,
      businessId: req.businessId,
      role: { $in: allowedStaffRoles },
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const { name, phone, role, isActive, customPermissions } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Staff name cannot be empty' });
      }
      staff.name = String(name).trim();
    }
    if (phone !== undefined) staff.phone = String(phone).trim();
    if (role !== undefined) {
      if (!allowedStaffRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid staff role. Permitted: ${allowedStaffRoles.join(', ')}`,
        });
      }
      staff.role = role;
    }
    if (isActive !== undefined) staff.isActive = Boolean(isActive);
    if (customPermissions !== undefined) {
      if (!Array.isArray(customPermissions)) {
        return res.status(400).json({ success: false, message: 'customPermissions must be an array' });
      }
      staff.customPermissions = customPermissions
        .filter((permission) => typeof permission === 'string')
        .map((permission) => permission.trim())
        .filter(Boolean)
        .slice(0, 30);
    }

    await staff.save();
    const safeStaff = staff.toObject();
    delete safeStaff.password;

    return res.json({ success: true, message: 'Staff permissions updated', staff: safeStaff });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating staff member',
    });
  }
};

// @desc    Remove a staff account inside the current business
// @route   DELETE /api/auth/staff/:id
// @access  Protected (MERCHANT_OWNER)
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      businessId: req.businessId,
      role: { $ne: 'MERCHANT_OWNER' },
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    if (String(staff._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own owner account' });
    }

    await User.deleteOne({ _id: staff._id, businessId: req.businessId });
    return res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error removing staff member',
    });
  }
};

// @desc    Update current tenant business profile & settings
// @route   PUT /api/auth/business-profile
// @access  Protected (MERCHANT_OWNER / ADMIN)
const updateBusinessProfile = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const { businessName, businessType, contactEmail, contactPhone, contactAddress, brandTagline, brandColor, settings } = req.body;
    if (businessName) tenant.businessName = businessName.trim();
    if (businessType) tenant.businessType = businessType.trim();
    if (contactEmail) {
      if (!tenant.contact) tenant.contact = {};
      tenant.contact.email = contactEmail.trim();
    }
    if (contactPhone) {
      if (!tenant.contact) tenant.contact = {};
      tenant.contact.phone = contactPhone.trim();
    }
    if (contactAddress !== undefined) {
      if (!tenant.contact) tenant.contact = {};
      tenant.contact.address = String(contactAddress).trim();
    }
    if (brandTagline !== undefined) {
      if (!tenant.branding) tenant.branding = {};
      tenant.branding.tagline = brandTagline;
    }
    if (brandColor) {
      if (!tenant.branding) tenant.branding = {};
      tenant.branding.primaryColor = brandColor;
    }
    if (settings && typeof settings === 'object') {
      const allowedStringSettings = [
        'gstinNumber',
        'merchantUpiId',
      ];
      const allowedNumberSettings = [
        'minOrderValue',
        'shippingFee',
        'freeShippingThreshold',
      ];
      const allowedBooleanSettings = [
        'enableCOD',
        'enableCod',
        'enableOnlinePay',
        'sendOrderNotifications',
        'whatsappAlerts',
      ];

      for (const key of allowedStringSettings) {
        if (settings[key] !== undefined) tenant.settings[key] = String(settings[key] || '').trim();
      }
      for (const key of allowedNumberSettings) {
        if (settings[key] === undefined) continue;
        const numeric = Number(settings[key]);
        if (!Number.isFinite(numeric) || numeric < 0) {
          return res.status(400).json({ success: false, message: `${key} must be a non-negative number` });
        }
        tenant.settings[key] = numeric;
      }
      for (const key of allowedBooleanSettings) {
        if (settings[key] === undefined) continue;
        const targetKey = key === 'enableCod' ? 'enableCOD' : key;
        tenant.settings[targetKey] = Boolean(settings[key]);
      }

      // The address belongs in the contact record, not in an untyped settings blob.
      if (settings.bizAddress !== undefined) {
        if (!tenant.contact) tenant.contact = {};
        tenant.contact.address = String(settings.bizAddress || '').trim();
      }
    }
    await tenant.save();
    return res.status(200).json({ success: true, message: 'Business profile updated successfully', tenant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerMerchant,
  login,
  getMe,
  setupSuperAdmin,
  createStaff,
  getStaffList,
  updateStaff,
  deleteStaff,
  updateBusinessProfile,
};
