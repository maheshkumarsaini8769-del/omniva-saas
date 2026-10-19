const mongoose = require('mongoose');
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

    // Cloud Demo Mode Fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      const normEmail = (email || '').toLowerCase().trim();
      const validPass = ['password123', 'admin123', 'rahul@123', 'admin@123'].includes((password || '').toLowerCase());

      if (
        (normEmail === 'rahul@desirasoi.com' || normEmail === 'demo@omniva.io' || normEmail === 'admin@omniva.io') &&
        validPass
      ) {
        const token = generateToken({
          id: '6acf096038d323550330be65',
          role: 'MERCHANT_OWNER',
          businessId: '6acf096038d323550330be64',
        });
        return res.json({
          success: true,
          message: 'Login successful (Cloud Demo Mode)',
          token,
          user: {
            id: '6acf096038d323550330be65',
            name: 'Rahul Sharma',
            email: 'rahul@desirasoi.com',
            role: 'MERCHANT_OWNER',
            phone: '9876543210',
          },
          tenant: {
            id: '6acf096038d323550330be64',
            businessName: 'Desi Rasoi Achar',
            slug: 'desi-rasoi-achar-1',
            businessType: 'PRODUCT',
            templateCode: 'PRODUCT',
            enabledModules: {
              automations: true,
              crmLeads: true,
              marketingAds: true,
              products: true,
              serviceBookings: false,
              travelBookings: false,
              inventory: true,
              orders: true,
            },
            planTier: 'GROWTH',
            status: 'ACTIVE',
            branding: {
              logo: '',
              primaryColor: '#4f46e5',
              secondaryColor: '#06b6d4',
            },
          },
        });
      }

      if (normEmail === 'vikram@royalfilms.com' && validPass) {
        const token = generateToken({
          id: '6acf096038d323550330be70',
          role: 'MERCHANT_OWNER',
          businessId: '6acf096038d323550330be71',
        });
        return res.json({
          success: true,
          message: 'Studio Login successful (Cloud Demo Mode)',
          token,
          user: {
            id: '6acf096038d323550330be70',
            name: 'Vikram Singh',
            email: 'vikram@royalfilms.com',
            role: 'MERCHANT_OWNER',
            phone: '9876543211',
          },
          tenant: {
            id: '6acf096038d323550330be71',
            businessName: 'Royal Films Studio',
            slug: 'royal-films-studio-1',
            businessType: 'SERVICE',
            templateCode: 'SERVICE',
            enabledModules: {
              automations: true,
              crmLeads: true,
              marketingAds: true,
              products: false,
              serviceBookings: true,
              travelBookings: true,
              inventory: false,
              orders: false,
            },
            planTier: 'GROWTH',
            status: 'ACTIVE',
            branding: {
              logo: '',
              primaryColor: '#f59e0b',
              secondaryColor: '#ec4899',
            },
          },
        });
      }

      if (
        (normEmail === 'superadmin@omniva.io' || normEmail === 'superadmin@admin.com') &&
        validPass
      ) {
        const token = generateToken({
          id: '6acf096038d323550330be63',
          role: 'SUPER_ADMIN',
        });
        return res.json({
          success: true,
          message: 'Super Admin Login successful (Cloud Demo Mode)',
          token,
          user: {
            id: '6acf096038d323550330be63',
            name: 'Mahesh (Super Admin)',
            email: 'superadmin@omniva.io',
            role: 'SUPER_ADMIN',
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Demo accounts: rahul@desirasoi.com / password123, or superadmin@omniva.io / password123',
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
    } else if (user.businessId) {
      tenant = {
        id: '6acf096038d323550330be64',
        businessName: 'Desi Rasoi Achar',
        slug: 'desi-rasoi-achar-1',
        businessType: 'PRODUCT',
        templateCode: 'PRODUCT',
        enabledModules: {
          automations: true,
          crmLeads: true,
          marketingAds: true,
          products: true,
          serviceBookings: false,
          travelBookings: false,
          inventory: true,
          orders: true,
        },
        planTier: 'GROWTH',
        status: 'ACTIVE',
        branding: {
          logo: '',
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
        },
      };
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

    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      // If one already exists, require matching masterKey
      const expectedMasterKey = process.env.MASTER_SETUP_KEY || 'omniva_master_setup_secret_2026';
      if (masterKey !== expectedMasterKey) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin already initialized. Valid master key required to add more.',
        });
      }
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const superAdmin = await User.create({
      name: name || 'Omniva Platform Owner',
      email: email.toLowerCase(),
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

// @desc    Update current tenant business profile & settings
// @route   PUT /api/auth/business-profile
// @access  Protected (MERCHANT_OWNER / ADMIN)
const updateBusinessProfile = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.businessId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const { businessName, businessType, contactEmail, contactPhone, brandTagline, brandColor, settings } = req.body;
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
    if (brandTagline !== undefined) {
      if (!tenant.branding) tenant.branding = {};
      tenant.branding.tagline = brandTagline;
    }
    if (brandColor) {
      if (!tenant.branding) tenant.branding = {};
      tenant.branding.primaryColor = brandColor;
    }
    if (settings && typeof settings === 'object') {
      tenant.settings = { ...tenant.settings, ...settings };
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
  updateBusinessProfile,
};
