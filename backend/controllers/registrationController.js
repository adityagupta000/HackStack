const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");

exports.registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  try {
    // Check if user already registered for this event
    const alreadyRegistered = await Registration.findOne({
      user: userId,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ message: "You already registered for this event." });
    }

    // Generate unique verification token for this registration
    const verificationToken = crypto.randomBytes(20).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    const registration = new Registration({
      user: userId,
      event: eventId,
      verificationToken,
      tokenExpiresAt,
    });

    await registration.save();
    res.status(201).json({ message: "Successfully registered!" });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

exports.getUserRegistrations = async (req, res) => {
  const userId = req.user._id;

  try {
    const registrations = await Registration.find({ user: userId }).populate(
      "event"
    );
    res.json(registrations);
  } catch (err) {
    console.error("Error fetching user registrations:", err);
    res
      .status(500)
      .json({ message: "Error fetching registrations", error: err.message });
  }
};

exports.getEventRegistrants = async (req, res) => {
  const { eventId } = req.params;

  try {
    const registrants = await Registration.find({ event: eventId }).populate(
      "user"
    );
    res.json(registrants);
  } catch (err) {
    console.error("Error fetching event registrants:", err);
    res
      .status(500)
      .json({ message: "Error fetching registrants", error: err.message });
  }
};

exports.generatePdfReceipt = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("user");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify that the user requesting the PDF is the owner of the registration
    if (registration.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Generate QR Code
    const qrData = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify/${registration.verificationToken}`;
    const qrImage = await QRCode.toDataURL(qrData);

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
      .text(
        `Registered On: ${new Date(
          registration.registeredAt || registration.createdAt
        ).toLocaleString()}`
      )
      .moveDown();

    // Divider
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#cccccc")
      .stroke()
      .moveDown();

    // QR Code
    doc.text("Scan the QR code to verify your registration:", {
      align: "center",
    });
    doc.moveDown(0.5);

    doc.image(qrImage, {
      fit: [100, 100],
      align: "center",
    });

    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("blue").text(qrData, {
      align: "center",
      link: qrData,
      underline: true,
    });

    // Footer
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor("gray")
      .text("This is an auto-generated receipt. No signature required.", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: err.message });
  }
};
