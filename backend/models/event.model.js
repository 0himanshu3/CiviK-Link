import mongoose from "mongoose";

const eventCategories = ["Blood Donation", "Health Camp", "Education", "Environment", "Food Distribution", "Fundraising", "Awareness"];

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: eventCategories,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    videos: [
      {
        url: String,
        caption: String,
      },
    ],
    eventLocation: {
      type: String,
      required: true,
    },
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User", // NGO user
      required: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    volunteerPositions: [
      {
        position: {
          type: String,
          required: true,
        },
        slots: {
          type: Number,
          required: true,
          min: 1,
        },
        registeredVolunteers: [
          {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    attendees: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    feedback: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Create slug from the title
EventSchema.pre("validate", function (next) {
  if (this.title) {
    this.slug = this.title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");
  }
  next();
});

export default mongoose.model("Event", EventSchema);
