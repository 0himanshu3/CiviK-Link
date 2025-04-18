import mongoose from "mongoose";

const issueTags = ["Road", "Water", "Electricity", "Education", "Health", "Sanitation"];

// Feedback sub-schema
const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resolved: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 10,
  },
  suggestions: {
    type: String,
  },
  issueProblem: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
      enum: issueTags,
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
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
    issueLocation: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: String,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Open", "Assigned", "Completed"],
      default: "Open",
    },
    upvoters: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    downvoters: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        date: { type: Date, default: Date.now },
      },
    ],
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
    feedback: [feedbackSchema], // ✅ Added feedback here
  },
  { timestamps: true }
);

// Create slug from the title
IssueSchema.pre("validate", function (next) {
  if (this.title) {
    this.slug = this.title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");
  }
  next();
});

export default mongoose.model("Issue", IssueSchema);
