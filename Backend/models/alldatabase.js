const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
  F_name: { 
    type: String, 
    required: true 
  },
  L_name: { 
    type: String, 
    required: true 
  },
  G_mail: { 
    type: String, 
    required: true, 
    unique: true 
  },
  Phonenumber: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ["client", "engineer"] 
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: { 
    type: String 
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
  emailVerificationCode: {
    type: String 
  }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    unique: true,
    required: true,
    default: () => `project_${uuidv4()}`
  },
  project_number: {
    type: Number,
    unique: true, 
    required: false  // 🔹 Change required to `false` to allow pre-validation setting
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  landarea: {
    type: Number,
    required: true
  },
  building_type: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  timeline: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "active", "completed", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

// ✅ Use `pre('validate')` to set `project_number` before validation runs
projectSchema.pre("validate", async function (next) {
  if (!this.project_number) {
    try {
      const lastProject = await this.constructor.findOne({}, {}, { sort: { project_number: -1 } });
      this.project_number = lastProject ? lastProject.project_number + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});


const contractSchema = new mongoose.Schema({
  contract_id: {
    type: String,
    unique: true,
    required: [true, "Contract ID is required"],
    default: () => `contract_${uuidv4()}`
  },
  client_signature: { 
    type: String, 
    required: [true, "Client signature image URL is required"] 
  },
  engineer_signature: { 
    type: String, 
    required: [true, "Engineer signature image URL is required"] 
  },
  project_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, "Project ID is required"] 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Signup', 
    required: [true, "User ID is required"] 
  },
  title: { 
    type: String, 
    required: [true, "Contract title is required"] 
  },
  landarea: { 
    type: Number, 
    required: [true, "Project land area is required"] 
  },
  building_type: { 
    type: String, 
    required: [true, "Project building type is required"] 
  },
  budget: { 
    type: Number, 
    required: [true, "Project budget is required"] 
  },
  timeline: { 
    type: String, 
    required: [true, "Project timeline is required"] 
  },
  terms_conditions: { 
    type: String, 
    required: [true, "Terms and conditions are required"] 
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  sender_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Signup', 
    required: [true, "Sender ID is required"] 
  },
  receiver_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Signup', 
    required: [true, "Receiver ID is required"] 
  },
  content: { 
    type: String, 
    required: [true, "Message content is required"] 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Signup', 
    required: [true, "User ID is required"] 
  },
  review_text: { 
    type: String, 
    required: [true, "Review text is required"] 
  },
  rating: {
    value: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: [true, "Rating value is required"] 
    },
    comments: { 
      type: String 
    }
  }
}, { timestamps: true });


// Pre-save middleware for user IDs
userSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
  if (this.role === 'client') {
    this.client_id = this.client_id || `C-${uuidv4().slice(0, 8)}`;
    this.engineer_id = undefined;
  } else if (this.role === 'engineer') {
    this.engineer_id = this.engineer_id || `E-${uuidv4().slice(0, 8)}`;
    this.client_id = undefined;
  }
  next();
});

// Models
const Signup = mongoose.model("Signup", userSchema);
const Project = mongoose.model("Project", projectSchema);
const Contract = mongoose.model("Contract", contractSchema);
const Message = mongoose.model("Message", messageSchema);
const Review = mongoose.model("Review", reviewSchema);

// Export Models
module.exports = { Signup, Project, Contract, Message, Review };