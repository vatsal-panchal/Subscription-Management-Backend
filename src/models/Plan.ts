import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  features: string[];
  maxProjects: number;
  maxStorage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 1
    },
    features: {
      type: [String],
      default: []
    },
    maxProjects: {
      type: Number,
      required: true,
      min: 0
    },
    maxStorage: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
