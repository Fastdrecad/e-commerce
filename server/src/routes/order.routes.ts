import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All order routes are protected
router.use(authMiddleware);

router.post("/", (req, res) => {
  // TODO: Implement create order
  res.status(501).json({ message: "Create order - Not implemented yet" });
});

router.get("/", (req, res) => {
  // TODO: Implement get all orders
  res.status(501).json({ message: "Get all orders - Not implemented yet" });
});

router.get("/:id", (req, res) => {
  // TODO: Implement get order by id
  res.status(501).json({ message: "Get order by id - Not implemented yet" });
});

router.put("/:id", (req, res) => {
  // TODO: Implement update order
  res.status(501).json({ message: "Update order - Not implemented yet" });
});

router.delete("/:id", (req, res) => {
  // TODO: Implement delete order
  res.status(501).json({ message: "Delete order - Not implemented yet" });
});

export default router;
