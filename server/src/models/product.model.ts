import { Schema, model, Document } from "mongoose";
import { IReview } from "./review.model";

export interface IProduct extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  title: string;
  description: {
    material: "Cotton" | "Polyester" | "Wool" | "Linen" | "Silk";
    fabric: "Knit" | "Woven" | "Nonwoven" | "Lace";
    careInstructions:
      | "Machine Wash Cold"
      | "Hand Wash"
      | "Dry Clean Only"
      | "Do Not Bleach";
  };
  images: string[];
  slug: string;
  brand: Schema.Types.ObjectId;
  category: Schema.Types.ObjectId;
  reviews: IReview[];
  rating: number;
  numReviews: number;
  price: number;
  sizes: Array<{
    size: "XS" | "S" | "M" | "L" | "XL";
    quantity: number;
  }>;
  countInStock: number;
  isNewProduct: boolean;
  isDeal: boolean;
  discount?: number;
  type: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "User is required"],
      ref: "User"
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters long"],
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      material: {
        type: String,
        enum: ["Cotton", "Polyester", "Wool", "Linen", "Silk"],
        required: [true, "Material is required"]
      },
      fabric: {
        type: String,
        enum: ["Knit", "Woven", "Nonwoven", "Lace"],
        required: [true, "Fabric type is required"]
      },
      careInstructions: {
        type: String,
        enum: [
          "Machine Wash Cold",
          "Hand Wash",
          "Dry Clean Only",
          "Do Not Bleach"
        ],
        required: [true, "Care instructions are required"]
      }
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: function (images: string[]) {
          return images.length > 0;
        },
        message: "At least one image is required"
      }
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      required: [true, "Slug is required"],
      trim: true,
      lowercase: true
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review"
      }
    ],
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"]
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Number of reviews cannot be negative"]
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      default: 0,
      min: [0, "Price cannot be negative"]
    },
    sizes: [
      {
        size: {
          type: String,
          enum: ["XS", "S", "M", "L", "XL"],
          required: [true, "Size is required"]
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          default: 0,
          min: [0, "Quantity cannot be negative"]
        }
      }
    ],
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock count cannot be negative"]
    },
    isNewProduct: {
      type: Boolean,
      default: false
    },
    isDeal: {
      type: Boolean,
      default: false
    },
    discount: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      validate: {
        validator: function (value: number) {
          if (value) {
            return this.isDeal; // Ensure `isDeal` is true if discount is provided
          }
          return true;
        },
        message: "Discount can only be set if `isDeal` is true"
      }
    },
    type: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for discounted price
productSchema.virtual("discountedPrice").get(function () {
  if (this.discount && this.price) {
    return this.price - this.price * (this.discount / 100);
  }
  return this.price; // No discount applied
});

// Virtual for average rating
productSchema.virtual("averageRating").get(function () {
  if (this.reviews.length === 0) return 0;
  return (
    this.reviews.reduce((sum, review) => sum + review.rating, 0) /
    this.reviews.length
  );
});

// Pre-save middleware to generate slug
productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

// Pre-save middleware to update countInStock based on sizes
productSchema.pre("save", function (next) {
  if (this.sizes && this.sizes.length > 0) {
    this.countInStock = this.sizes.reduce(
      (total, size) => total + size.quantity,
      0
    );
  }
  next();
});

// Add indexes for better query performance
// Create a text index for full-text search on name, title and description fields
productSchema.index({ name: "text", title: "text", description: "text" });

// Create an ascending index on price field for efficient price-based queries and sorting
productSchema.index({ price: 1 });

// Create a descending index on rating field for efficient rating-based queries and sorting
productSchema.index({ rating: -1 });

// Create an index on isNewProduct field to quickly find new products
productSchema.index({ isNewProduct: 1 });

// Create an index on isDeal field to quickly find products with deals
productSchema.index({ isDeal: 1 });

// Create a compound index on size and quantity fields within the sizes array
// This helps optimize queries that filter or sort by specific sizes and their quantities
productSchema.index({ "sizes.size": 1, "sizes.quantity": 1 });

export const Product = model<IProduct>("Product", productSchema);
