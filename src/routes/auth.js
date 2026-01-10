import { Router } from "express";
import crypto from "crypto";
import { Customer, User } from "../models/index.js";
import { sendOTPEmail } from "../services/email.js";
import { authLimiter } from "../middleware/index.js";

const router = Router();

// Email validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Request OTP
router.post("/send-otp", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required." });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000);

    let customer = await Customer.findOne({ email });
    if (!customer) {
      customer = await Customer.create({ email, name: email.split("@")[0] });
    }

    await User.findOneAndUpdate(
      { email },
      { otp, otpExpires: expires, customerId: customer._id },
      { upsert: true }
    );

    await sendOTPEmail(email, otp);
    res.json({ success: true, message: "OTP sent." });
  } catch (err) {
    next(err);
  }
});

// Verify OTP
router.post("/verify-otp", authLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Valid email required." });
    if (!otp) return res.status(400).json({ error: "OTP required." });

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(401).json({ error: "Invalid or expired OTP." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.sessionToken = token;
    user.otp = undefined;
    await user.save();

    res.json({ success: true, sessionToken: token });
  } catch (err) {
    next(err);
  }
});

export default router;
