import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    transactionId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for faster queries
donationSchema.index({ userId: 1, ngoId: 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;