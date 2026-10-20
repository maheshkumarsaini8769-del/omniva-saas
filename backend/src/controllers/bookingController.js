const ServicePackage = require('../models/ServicePackage');
const Booking = require('../models/Booking');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const { sendCapiEvent } = require('../services/metaCapiService');
const { triggerAutomation } = require('../services/automationEngine');

// ==================== PACKAGES ====================

// @desc    Get all service packages for merchant
// @route   GET /api/packages
// @access  Private (Merchant Admin/Staff)
const getServicePackages = async (req, res) => {
  try {
    const packages = await ServicePackage.find({ businessId: req.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a service package
// @route   POST /api/packages
// @access  Private (Merchant Admin)
const createServicePackage = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      duration,
      price,
      advanceTokenPercent,
      deliverables,
      images,
      maxCapacityPerDay,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Package name and price are required' });
    }

    const pkgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await ServicePackage.findOne({ businessId: req.businessId, slug: pkgSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A package with this slug already exists' });
    }

    const pkg = await ServicePackage.create({
      businessId: req.businessId,
      name,
      slug: pkgSlug,
      category: category || 'Photography',
      description: description || '',
      duration: duration || 'Full Day',
      price: Number(price),
      advanceTokenPercent: advanceTokenPercent !== undefined ? Number(advanceTokenPercent) : 20,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      images: Array.isArray(images) ? images : [],
      maxCapacityPerDay: maxCapacityPerDay ? Number(maxCapacityPerDay) : 1,
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service package
// @route   PUT /api/packages/:id
// @access  Private (Merchant Admin)
const updateServicePackage = async (req, res) => {
  try {
    const pkg = await ServicePackage.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Service package not found' });
    }

    const fields = [
      'name',
      'slug',
      'category',
      'description',
      'duration',
      'price',
      'advanceTokenPercent',
      'deliverables',
      'images',
      'isAvailable',
      'maxCapacityPerDay',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        pkg[field] = req.body[field];
      }
    });

    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete service package
// @route   DELETE /api/packages/:id
// @access  Private (Merchant Admin)
const deleteServicePackage = async (req, res) => {
  try {
    const pkg = await ServicePackage.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Service package not found' });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BOOKINGS ====================

// @desc    Get all bookings for merchant
// @route   GET /api/bookings
// @access  Private (Merchant Admin/Staff)
const getBookings = async (req, res) => {
  try {
    const { bookingStatus, bookingType, search, page = 1, limit = 50 } = req.query;
    const filter = { businessId: req.businessId };

    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (bookingType) filter.bookingType = bookingType;
    if (search) {
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { bookingNumber: { $regex: safeSearch, $options: 'i' } },
        { customerName: { $regex: safeSearch, $options: 'i' } },
        { customerPhone: { $regex: safeSearch, $options: 'i' } },
        { packageName: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ eventDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: bookings.length,
      total,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Merchant Admin/Staff)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status, assign staff, or record payment
// @route   PATCH /api/bookings/:id/status
// @access  Private (Merchant Admin/Staff)
const updateBookingStatus = async (req, res) => {
  try {
    const {
      bookingStatus,
      assignedStaff,
      assignedStaffName,
      advancePaid,
      note,
    } = req.body;

    const booking = await Booking.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updater = req.user ? `${req.user.name} (${req.user.role})` : 'Merchant Admin';

    if (bookingStatus && bookingStatus !== booking.bookingStatus) {
      booking.bookingStatus = bookingStatus;
      booking.timeline.push({
        status: bookingStatus,
        note: note || `Booking stage updated to ${bookingStatus}`,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    if (assignedStaff !== undefined) {
      booking.assignedStaff = assignedStaff || null;
    }
    if (assignedStaffName !== undefined) {
      booking.assignedStaffName = assignedStaffName || 'Unassigned';
    }

    if (advancePaid !== undefined) {
      const adv = Number(advancePaid);
      booking.advancePaid = adv;
      booking.balanceDue = Math.max(0, booking.totalAmount - adv);
      if (adv >= booking.totalAmount) {
        booking.paymentStatus = 'PAID';
      } else if (adv > 0) {
        booking.paymentStatus = 'PARTIALLY_PAID';
      } else {
        booking.paymentStatus = 'UNPAID';
      }
    }

    if (note && !bookingStatus) {
      booking.timeline.push({
        status: booking.bookingStatus,
        note,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking KPIs & stats
// @route   GET /api/bookings/stats
// @access  Private (Merchant Admin/Staff)
const getBookingStats = async (req, res) => {
  try {
    const businessId = req.businessId;

    const [totalBookings, statusCounts, financialStats] = await Promise.all([
      Booking.countDocuments({ businessId }),
      Booking.aggregate([
        { $match: { businessId } },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { businessId, bookingStatus: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalBookedValue: { $sum: '$totalAmount' },
            advanceCollected: { $sum: '$advancePaid' },
            balanceDue: { $sum: '$balanceDue' },
          },
        },
      ]),
    ]);

    const statusMap = {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((s) => {
      if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
    });

    const finances = financialStats[0] || {
      totalBookedValue: 0,
      advanceCollected: 0,
      balanceDue: 0,
    };

    res.json({
      success: true,
      data: {
        totalBookings,
        statusCounts: statusMap,
        finances,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PUBLIC BOOKINGS ====================

// @desc    Submit a public booking request (Photography Shoot or Travel Tour)
// @route   POST /api/public/store/:slug/book
// @access  Public
const createPublicBooking = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      packageId,
      customerName,
      customerPhone,
      customerEmail,
      eventDate,
      timeSlot = 'Full Day',
      location = '',
      passengers = [],
      notes = '',
      attribution = {},
    } = req.body;

    if (!customerName || !customerPhone || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, and event date are required',
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Business storefront not found or inactive' });
    }

    let packageName = req.body.packageName || 'Custom Booking';
    let totalAmount = Number(req.body.totalAmount) > 0 ? Number(req.body.totalAmount) : 5000;
    let advanceTokenPercent = Number(req.body.advanceTokenPercent) > 0 ? Number(req.body.advanceTokenPercent) : 20;

    if (packageId) {
      const pkg = await ServicePackage.findOne({ _id: packageId, businessId: tenant._id, isAvailable: true });
      if (pkg) {
        packageName = pkg.name;
        totalAmount = pkg.price;
        advanceTokenPercent = pkg.advanceTokenPercent || 20;
      }
    }

    // Required token advance calculation
    const calculatedAdvance = req.body.advancePaid !== undefined && Number(req.body.advancePaid) >= 0
      ? Number(req.body.advancePaid)
      : Math.round((totalAmount * advanceTokenPercent) / 100);
    const balanceDue = Math.max(0, totalAmount - calculatedAdvance);

    const dateCode = Date.now().toString().slice(-6);
    const randCode = Math.floor(100 + Math.random() * 900);
    const bookingNumber = `BK-${dateCode}-${randCode}`;

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const enrichedAttribution = {
      ...attribution,
      clientIp: attribution.clientIp || clientIp,
      userAgent: attribution.userAgent || userAgent,
    };

    const booking = await Booking.create({
      businessId: tenant._id,
      bookingNumber,
      bookingType: tenant.businessType === 'TRAVEL' ? 'TRAVEL' : 'SERVICE',
      packageId: packageId || null,
      packageName,
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      eventDate: new Date(eventDate),
      timeSlot,
      location,
      totalAmount,
      advancePaid: calculatedAdvance,
      balanceDue,
      paymentStatus: 'PARTIALLY_PAID',
      bookingStatus: 'PENDING',
      passengers: Array.isArray(passengers) ? passengers : [],
      notes,
      attribution: enrichedAttribution,
      timeline: [
        {
          status: 'PENDING',
          note: `Booking request received for ${packageName} on ${new Date(eventDate).toDateString()}`,
          updatedBy: 'Customer Online',
          timestamp: new Date(),
        },
      ],
    });

    // Fire Automation Engine Event
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: booking._id.toString(),
      data: {
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        packageName: booking.packageName,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
      },
    }).catch((err) => console.error('[Automation Booking Trigger Error]:', err.message));

    // Sync Customer / Enquiry into CRM Lead Pipeline
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const existingLead = await Lead.findOne({ businessId: tenant._id, phone: cleanPhone });

      if (existingLead) {
        existingLead.status = 'QUALIFIED';
        existingLead.budget = totalAmount;
        existingLead.notes.push({
          note: `Booking request ${bookingNumber} placed for ${packageName} on ${new Date(eventDate).toDateString()}`,
          authorName: 'Online Booking System',
          createdAt: new Date(),
        });
        await existingLead.save();
      } else {
        await Lead.create({
          businessId: tenant._id,
          name: customerName,
          phone: cleanPhone,
          email: customerEmail || '',
          source: 'WEBSITE',
          campaignName: enrichedAttribution.utmCampaign || 'Organic Studio Booking',
          utmSource: enrichedAttribution.utmSource || '',
          utmCampaign: enrichedAttribution.utmCampaign || '',
          status: 'QUALIFIED',
          budget: totalAmount,
          notes: [
            {
              note: `Initial Booking request ${bookingNumber} for ${packageName}`,
              authorName: 'Online Booking System',
              createdAt: new Date(),
            },
          ],
        });
      }
    } catch (leadSyncErr) {
      console.error('[CRM Booking Sync Warning]:', leadSyncErr.message);
    }

    // Fire Meta CAPI 'Schedule' event asynchronously
    if (tenant.settings?.metaPixelId && tenant.settings?.metaCapiToken) {
      sendCapiEvent({
        tenant,
        eventName: 'Schedule',
        eventId: booking.bookingNumber,
        eventSourceUrl: req.headers.referer || `https://${slug}.omniva.io/book`,
        userData: {
          email: customerEmail,
          phone: customerPhone,
          fbclid: enrichedAttribution.fbclid,
        },
        customData: {
          currency: tenant.settings.currency || 'INR',
          value: totalAmount,
          contentName: packageName,
        },
      }).catch((err) => console.error('[CAPI Schedule Event Error]:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        packageName: booking.packageName,
        eventDate: booking.eventDate,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
        balanceDue: booking.balanceDue,
        bookingStatus: booking.bookingStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats,
  createPublicBooking,
};
