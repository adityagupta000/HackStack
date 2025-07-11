const Registration = require("../models/Registration");
const PDFDocument = require("pdfkit");
const Event = require("../models/Event");
const User = require("../models/User");

exports.registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  try {
    const alreadyRegistered = await Registration.findOne({
      user: userId,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ message: "You already registered for this event." });
    }

    const registration = new Registration({ user: userId, event: eventId });
    await registration.save();

    res.status(201).json({ message: "Successfully registered!" });
  } catch (err) {
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

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${registrationId}.pdf`
    );

    // Pipe before writing content
    doc.pipe(res);

    // Title
    doc
      .fontSize(20)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Event Registration Receipt", { align: "center" });

    doc.moveDown(1);

    // Section: User Info
    doc
      .fontSize(14)
      .fillColor("#444")
      .font("Helvetica-Bold")
      .text("Participant Information")
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("black")
      .text(`Registration ID: ${registration._id}`)
      .text(`Name: ${registration.user.name}`)
      .text(`Email: ${registration.user.email}`)
      .moveDown();

    // Section: Event Info
    doc
      .fontSize(14)
      .fillColor("#444")
      .font("Helvetica-Bold")
      .text("Event Details")
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("black")
      .text(`Event Title : ${registration.event.title}`)
      .text(`Domain      : ${registration.event.category || "N/A"}`)
      .text(`Date        : ${registration.event.date || "N/A"}`)
      .text(`Time        : ${registration.event.time || "N/A"}`)
      .text(
        `Registered On: ${new Date(
          registration.registeredAt
        ).toLocaleString()}`
      )

      .moveDown();

    // Divider
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#bbbbbb")
      .lineWidth(1)
      .stroke()
      .moveDown();

    // Footer message
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        "This is a system-generated receipt and does not require a physical signature.",
        { align: "center", lineGap: 4 }
      )
      .moveDown(1);

    // Thank you
    doc
      .fontSize(13)
      .fillColor("#27ae60")
      .font("Helvetica-Bold")
      .text("Thank you for registering!", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: err.message });
  }
};
