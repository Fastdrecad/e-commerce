import { Schema, model, Document, Model } from "mongoose";

class DuplicateReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateReviewError";
  }
}

export interface IReview extends Document {
  name: string;
  rating: number;
  comment: string;
  user: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters long"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"]
    },
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "User is required"],
      ref: "User"
    },
    product: {
      type: Schema.Types.ObjectId,
      required: [true, "Product is required"],
      ref: "Product"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted date
reviewSchema.virtual("formattedDate").get(function (this: IReview) {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

// Virtual for formatted rating
reviewSchema.virtual("formattedRating").get(function (this: IReview) {
  return `${this.rating} out of 5`;
});

// Pre-save middleware to trim and sanitize comment
reviewSchema.pre("save", function (this: IReview, next) {
  if (this.isModified("comment")) {
    this.comment = this.comment.trim();
  }
  next();
});

// Pre-save middleware to validate user hasn't reviewed the same product before
reviewSchema.pre("save", async function (this: IReview & { _id: any }, next) {
  const Review = this.constructor as Model<IReview>;
  const existingReview = (await Review.findOne({
    user: this.user,
    product: this.product
  })) as (IReview & { _id: any }) | null;

  if (existingReview && existingReview._id.toString() !== this._id.toString()) {
    return next(
      new DuplicateReviewError("You have already reviewed this product")
    );
  }
  next();
});

// Post-save middleware to update product rating and numReviews
reviewSchema.post("save", async function (this: IReview) {
  const Review = this.constructor as Model<IReview>;
  const Product = model("Product");
  const product = await Product.findById(this.product);

  if (product) {
    const reviews = await Review.find({ product: this.product });
    const totalRating = reviews.reduce(
      (sum: number, review: IReview) => sum + review.rating,
      0
    );

    product.rating = totalRating / reviews.length;
    product.numReviews = reviews.length;
    await product.save();
  }
});

// Post-delete middleware to update product rating and numReviews
reviewSchema.post("deleteOne", async function (this: IReview) {
  const Review = this.constructor as Model<IReview>;
  const Product = model("Product");
  const product = await Product.findById(this.product);

  if (product) {
    const reviews = await Review.find({ product: this.product });
    const totalRating = reviews.reduce(
      (sum: number, review: IReview) => sum + review.rating,
      0
    );

    product.rating = reviews.length > 0 ? totalRating / reviews.length : 0;
    product.numReviews = reviews.length;
    await product.save();
  }
});

// Add indexes for better query performance
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // Ensure one review per user per product
reviewSchema.index({ product: 1, rating: -1 }); // For sorting reviews by rating
reviewSchema.index({ createdAt: -1 }); // For sorting reviews by date

export const Review = model<IReview>("Review", reviewSchema);
