const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");


const signupSchema = new mongoose.Schema(
  {
    F_name: { type: String, required: true },
    L_name: { type: String, required: true },
    G_mail: { type: String, required: true, unique: true, index: true },
    Phonenumber: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ["client", "engineer", "admin"],
      default: "client"
    },
    
    // Admin-Specific Fields
    isAdmin: { type: Boolean, default: false },
    adminPrivileges: {
      canManageUsers: { type: Boolean, default: false },
      canManageProjects: { type: Boolean, default: false },
      canManageContracts: { type: Boolean, default: false },
      canModerateReviews: { type: Boolean, default: false },
      canAccessAnalytics: { type: Boolean, default: false }
    },
    adminActions: [{
      action: { type: String },
      targetId: { type: mongoose.Schema.Types.ObjectId },
      timestamp: { type: Date, default: Date.now }
    }],

    // Profile Details
    // Profile Image (Updated)
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String }, // For cloud storage reference if needed
      uploadDate: { type: Date, default: Date.now }
    },
    location: { type: String, default: "" },
    bio: { type: String, maxlength: 500, default: "" },

    // Engineer-Specific Fields
    skills: { type: [String], default: [] },
    experience: [
      {
        title: { type: String },
        company: { type: String },
        years: { type: Number },
      }
    ],
    portfolio: { type: [String], default: [] },

    // Social Media Links
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      website: { type: String, default: "" }
    },

    // Account Verification & Security
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationCode: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Account Status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Project Schema
const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true },
  title: { type: String, required: true },
  landArea: { type: Number, required: true },
  buildingType: { type: String, required: true },
  budget: { type: Number, required: true },
  timeline: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "active", "completed", "cancelled"],
    default: "pending",
  },
  applications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signup'
  }],
  assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signup',
      default: null
  }
},
  { timestamps: true }
);





const contractSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // Changed from "User" to "Signup"
    engineerId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // Changed from "User" to "Signup"
    clientSignature: { type: String, default: null },
    engineerSignature: { type: String, default: null },
    title: { type: String, ref: "Project"  },
    landArea: { type: Number, ref: "Project" },
    buildingType: { type: String, ref: "Project"},
    budget: { type: Number,  ref: "Project" },
    timeline: { type: String,  ref: "Project"},
    termsConditions: { type: String, required: true },
    status: {
      type: String,
      ref: "Project",
      enum: ["pending", "signed", "active", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // Changed from "User" to "Signup"
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // Changed from "User" to "Signup"
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // Engineer being reviewed
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true }, // User giving the review
    reviewText: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true }
  },
  { timestamps: true }
);



// Models
const Signup = mongoose.model("Signup", signupSchema);
const Project = mongoose.model("Project", projectSchema);
const Contract = mongoose.model("Contract", contractSchema);
const Message = mongoose.model("Message", messageSchema);
const Review = mongoose.model("Review", reviewSchema);


// Export Models
module.exports = { Signup, Project, Contract, Message, Review };
