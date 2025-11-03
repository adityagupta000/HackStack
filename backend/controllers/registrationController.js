const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { sanitizeInput } = require("../utils/sanitize");
const logger = require("../config/logger");

exports.registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  const session = await mongoose.startSession();

  try {
    // Use retryable writes for better handling of transient errors
    await session.withTransaction(
      async () => {
        // Lock the documents by using findOneAndUpdate with upsert
        const event = await Event.findById(eventId).session(session).lean();

        if (!event) {
          throw new Error("EVENT_NOT_FOUND");
        }

        // Try to create registration with unique constraint
        // This will fail atomically if duplicate exists
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

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

        // Store for response
        req.registrationResult = {
          registrationId: registration._id,
          message: "Successfully registered!",
        };
      },
      {
        readPreference: "primary",
        readConcern: { level: "majority" },
        writeConcern: { w: "majority" },
      }
    );

    session.endSession();

    logger.info("Event registration successful", {
      userId,
      eventId,
      registrationId: req.registrationResult.registrationId,
      requestId: req.id,
    });

    res.status(201).json(req.registrationResult);
  } catch (err) {
    session.endSession();

    // Handle custom errors
    if (err.message === "EVENT_NOT_FOUND") {
      return res.status(404).json({ message: "Event not found" });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      logger.warn("Duplicate registration attempt", {
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

// FIXED: Enhanced PDF generation with improved layout (NO OVERLAPPING)
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
      .fontSize(22)
      .fillColor("#2c3e50")
      .text("Event Registration Receipt", { align: "center" })
      .moveDown(2);

    // User Info Section
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#444")
      .text("Participant Information")
      .moveDown(0.8);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("black")
      .text(`Registration ID: ${registration._id}`)
      .moveDown(0.3)
      .text(`Name: ${registration.user.name}`)
      .moveDown(0.3)
      .text(`Email: ${registration.user.email}`)
      .moveDown(1.5);

    // Event Info Section
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#444")
      .text("Event Details")
      .moveDown(0.8);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("black")
      .text(`Title: ${registration.event.title}`)
      .moveDown(0.3)
      .text(`Domain: ${registration.event.category || "N/A"}`)
      .moveDown(0.3)
      .text(`Date: ${registration.event.date || "N/A"}`)
      .moveDown(0.3)
      .text(`Time: ${registration.event.time || "N/A"}`)
      .moveDown(0.3)
      .text(`Price: ₹${registration.event.price || 0}`)
      .moveDown(0.3)
      .text(
        `Registered On: ${new Date(
          registration.registeredAt || registration.createdAt
        ).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
      )
      .moveDown(0.3)
      .text(`Status: ${registration.status.toUpperCase()}`)
      .moveDown(0.3)
      .text(`Payment Status: ${registration.paymentStatus.toUpperCase()}`)
      .moveDown(1.5);

    // Divider
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .lineWidth(1)
      .stroke()
      .moveDown(1.5);

    // QR Code Section Header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("black")
      .text("Verification QR Code", { align: "center" })
      .moveDown(0.8);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#555")
      .text("Scan this code at the event venue for verification:", {
        align: "center",
      })
      .moveDown(1);

    // Center the QR code and track position
    const qrSize = 150;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const qrX = doc.page.margins.left + (pageWidth - qrSize) / 2;
    const qrYPosition = doc.y; // Store Y position before adding image

    doc.image(qrImage, qrX, qrYPosition, {
      width: qrSize,
      height: qrSize,
    });

    // Move cursor below the QR code (qrSize + small margin)
    doc.y = qrYPosition + qrSize + 15;

    // Verification URL
    doc
      .fontSize(9)
      .fillColor("#666")
      .text("Or visit:", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(8)
      .fillColor("blue")
      .text(qrData, {
        align: "center",
        link: qrData,
        underline: true,
      })
      .fillColor("black")
      .moveDown(2);

    // Footer Divider
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .lineWidth(1)
      .stroke()
      .moveDown(1);

    // Footer Text
    doc
      .fontSize(9)
      .fillColor("gray")
      .text("This is an auto-generated receipt. No signature required.", {
        align: "center",
      })
      .moveDown(0.5)
      .text("Please bring this receipt to the event venue.", {
        align: "center",
      })
      .moveDown(0.5)
      .fontSize(8)
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
