const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { sanitizeInput } = require("../utils/sanitize");
const logger = require("../config/logger");

// FIXED: Proper atomic registration with better duplicate handling
exports.registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if event exists
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Event not found" });
    }

    // Check for existing registration within transaction
    const existingRegistration = await Registration.findOne({
      user: userId,
      event: eventId,
    }).session(session);

    if (existingRegistration) {
      await session.abortTransaction();
      session.endSession();
      logger.warn("Duplicate registration attempt", {
        userId,
        eventId,
        requestId: req.id,
      });
      return res.status(400).json({
        message: "You have already registered for this event.",
        registrationId: existingRegistration._id,
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Create new registration
    const registration = new Registration({
      user: userId,
      event: eventId,
      verificationToken,
      tokenExpiresAt,
      registeredAt: new Date(),
      status: "pending",
      paymentStatus: "unpaid",
    });

    await registration.save({ session });

    const response = {
      message: "Successfully registered!",
      registrationId: registration._id,
    };

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(response);

    logger.info("Event registration successful", {
      userId,
      eventId,
      registrationId: registration._id,
      requestId: req.id,
    });

    // Send response after successful commit
    res.status(201).json(response);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Handle duplicate key error (backup safety net)
    if (err.code === 11000) {
      logger.warn("Duplicate key error in registration", {
        userId,
        eventId,
        requestId: req.id,
      });
      return res.status(400).json({
        message: "You have already registered for this event.",
      });
    }

    logger.error("Registration error", {
      error: err.message,
      stack: err.stack,
      userId,
      eventId,
      requestId: req.id,
    });

    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getUserRegistrations = async (req, res) => {
  const userId = req.user._id;

  try {
    const registrations = await Registration.find({ user: userId })
      .populate("event")
      .sort({ registeredAt: -1 })
      .lean();

    res.json(registrations);
  } catch (err) {
    console.error("Error fetching user registrations:", err);
    res.status(500).json({
      message: "Error fetching registrations",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getEventRegistrants = async (req, res) => {
  const { eventId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    // Only admins should see all registrants
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const registrants = await Registration.find({ event: eventId })
      .populate("user", "name email")
      .sort({ registeredAt: -1 })
      .lean();

    res.json(registrants);
  } catch (err) {
    console.error("Error fetching event registrants:", err);
    res.status(500).json({
      message: "Error fetching registrants",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// FIXED: Enhanced PDF generation with better security
exports.generatePdfReceipt = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("user", "name email")
      .lean();

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // FIXED: Verify ownership or admin access
    const isOwner =
      registration.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied. You can only download your own receipts.",
      });
    }

    // Verify that verification token exists
    if (!registration.verificationToken) {
      return res.status(400).json({
        message: "Invalid registration state. Please contact support.",
      });
    }

    // Generate QR Code with verification URL
    const qrData = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify/${registration.verificationToken}`;

    let qrImage;
    try {
      qrImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 200,
      });
    } catch (qrErr) {
      console.error("QR Code generation error:", qrErr);
      return res.status(500).json({ message: "Failed to generate QR code" });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${registrationId}.pdf`
    );

    doc.pipe(res);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#2c3e50")
      .text("Event Registration Receipt", { align: "center" })
      .moveDown(1.5);

    // User Info Section
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#444")
      .text("Participant Information")
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("black")
      .text(`Registration ID: ${registration._id}`)
      .text(`Name: ${registration.user.name}`)
      .text(`Email: ${registration.user.email}`)
      .moveDown(1);

    // Event Info Section
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#444")
      .text("Event Details")
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("black")
      .text(`Title: ${registration.event.title}`)
      .text(`Domain: ${registration.event.category || "N/A"}`)
      .text(`Date: ${registration.event.date || "N/A"}`)
      .text(`Time: ${registration.event.time || "N/A"}`)
      .text(`Price: ₹${registration.event.price || 0}`)
      .text(
        `Registered On: ${new Date(
          registration.registeredAt || registration.createdAt
        ).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
      )
      .text(`Status: ${registration.status.toUpperCase()}`)
      .text(`Payment Status: ${registration.paymentStatus.toUpperCase()}`)
      .moveDown();

    // Divider
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .stroke()
      .moveDown();

    // QR Code Section
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("black")
      .text("Verification QR Code", { align: "center" })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Scan this code at the event venue for verification:", {
        align: "center",
      })
      .moveDown(0.5);

    // Center the QR code
    const qrSize = 150;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const qrX = doc.page.margins.left + (pageWidth - qrSize) / 2;

    doc.image(qrImage, qrX, doc.y, {
      width: qrSize,
      height: qrSize,
    });

    doc.moveDown(8); // Move down to account for QR code height

    // Verification URL
    doc
      .fontSize(9)
      .fillColor("blue")
      .text("Or visit:", { align: "center" })
      .text(qrData, {
        align: "center",
        link: qrData,
        underline: true,
      })
      .fillColor("black");

    // Footer
    doc.moveDown(2);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("This is an auto-generated receipt. No signature required.", {
        align: "center",
      })
      .moveDown(0.3)
      .text("Please bring this receipt to the event venue.", {
        align: "center",
      })
      .moveDown(0.3)
      .text(
        `Generated on: ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`,
        {
          align: "center",
        }
      );

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);

    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        message: "Error generating PDF receipt",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
};

// FIXED: Add cancellation functionality
exports.cancelRegistration = async (req, res) => {
  const { registrationId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    return res.status(400).json({ message: "Invalid registration ID" });
  }

  try {
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify ownership
    if (registration.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if already cancelled
    if (registration.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Registration already cancelled" });
    }

    // Check if payment was made
    if (registration.paymentStatus === "paid") {
      return res.status(400).json({
        message:
          "Cannot cancel paid registration. Please contact support for refund.",
      });
    }

    // Update status
    registration.status = "cancelled";
    await registration.save();

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("Cancellation error:", err);
    res.status(500).json({
      message: "Failed to cancel registration",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
