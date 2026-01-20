import * as authService from "../services/auth/auth.service.js";
import { schemas } from "../services/validator.js";

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const validation = schemas.sendOTP({ email });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    const result = await authService.sendOTP(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    const validation = schemas.verifyOTP({ email, otp });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    const result = await authService.verifyOTP(email, otp, req);
    res.json(result);
  } catch (err) {
    if (err.message === "User not found" || err.message === "Invalid or expired OTP") {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user, req);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: authService.formatUserResponse(req.user),
  });
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const result = await authService.getUsers({ role, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const validation = schemas.updateUserRole({ role });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    const result = await authService.updateUserRole(id, role, req.user, req);
    res.json(result);
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === "Cannot remove the last admin") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};
