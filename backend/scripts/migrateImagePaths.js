// backend/scripts/migrateImagePaths.js
// Run this ONCE to update all existing database records

require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/Event"); // ✅ fixed path
const logger = require("../config/logger"); // ✅ correct path

const migrateImagePaths = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    const events = await Event.find({});
    console.log(`📊 Found ${events.length} events to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      let needsUpdate = false;
      const updates = {};

      if (event.image && event.image.startsWith("/uploads/image_")) {
        const filename = event.image.split("/").pop();
        updates.image = `/uploads/images/${filename}`;
        needsUpdate = true;
        console.log(`  📸 Fixing image: ${event.image} -> ${updates.image}`);
      }

      if (event.ruleBook && event.ruleBook.startsWith("/uploads/ruleBook_")) {
        const filename = event.ruleBook.split("/").pop();
        updates.ruleBook = `/uploads/rulebooks/${filename}`;
        needsUpdate = true;
        console.log(
          `  📚 Fixing rulebook: ${event.ruleBook} -> ${updates.ruleBook}`
        );
      }

      if (needsUpdate) {
        await Event.findByIdAndUpdate(event._id, updates);
        updatedCount++;
        console.log(`✅ Updated event: ${event.title}`);
      } else {
        skippedCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`  ✅ Updated: ${updatedCount} events`);
    console.log(`  ⏭️  Skipped: ${skippedCount} events (already correct)`);
    console.log("\n✨ Migration completed successfully!");

    await mongoose.connection.close();
    console.log("👋 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateImagePaths();
