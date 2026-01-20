import crypto from "crypto";
import { Customer, User, Agent } from "../models/index.js";
import { sendOTPEmail } from "./email.js";
import { auditLogger } from "./admin/audit-log.js";
import { sanitizeString } from "./validator.js";

const isDev = process.env.NODE_ENV !== "production";

export const sendOTP = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = isDev ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60000);

  let existingUser = await User.findOne({ email: normalizedEmail });
  let role = existingUser?.role || "user";
  let agentId = existingUser?.agentId || null;
  let customerId = existingUser?.customerId || null;

  if (role === "user" && !customerId) {
    let customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer) {
      customer = await Customer.create({ 
        email: normalizedEmail, 
        name: sanitizeString(normalizedEmail.split("@")[0]) 
      });
    }
    customerId = customer._id;
  }

  if (role === "agent" && !agentId) {
    const agent = await Agent.findOne({ email: normalizedEmail });
    if (agent) agentId = agent._id;
  }

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    { 
      otp, 
      otpExpires: expires, 
      customerId, 
      agentId,
      name: existingUser?.name || sanitizeString(normalizedEmail.split("@")[0])
    },
    { upsert: true }
  );

  if (isDev) {
    console.log(`[DEV] OTP for ${normalizedEmail}: ${otp} (role: ${role})`);
  } else {
    await sendOTPEmail(normalizedEmail, otp);
  }

  return { success: true, message: "OTP sent to your email" };
};

export const verifyOTP = async (email, otp, req) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOTP = otp.trim();

  let user = await User.findOne({ email: normalizedEmail })
    .populate("customerId")
    .populate("agentId");

  if (!user) {
    throw new Error("User not found");
  }

  const isValidOTP = isDev 
    ? normalizedOTP === "123456" 
    : (user.otp === normalizedOTP && new Date() <= user.otpExpires);

  if (!isValidOTP) {
    throw new Error("Invalid or expired OTP");
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.sessionToken = token;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.lastSeen = new Date();
  await user.save();

  await auditLogger.userLogin(user, req);

  return { 
    success: true, 
    sessionToken: token,
    user: formatUserResponse(user),
  };
};

export const logout = async (user, req) => {
  user.sessionToken = undefined;
  await user.save();
  await auditLogger.userLogout(user, req);
};

export const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || user.email.split("@")[0],
  role: user.role,
  plan: user.customerId?.plan,
  agentName: user.agentId?.name,
  agentCategories: user.agentId?.categories,
});

export const getUsers = async ({ role, page = 1, limit = 50 }) => {
  const query = {};
  if (role && ["user", "agent", "admin"].includes(role)) {
    query.role = role;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("customerId", "plan")
      .populate("agentId", "name categories")
      .select("-otp -otpExpires -sessionToken")
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);
  
  return { 
    success: true, 
    users: users.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.customerId?.plan,
      agentName: u.agentId?.name,
      lastSeen: u.lastSeen,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    }
  };
};

export const updateUserRole = async (userId, role, adminUser, req) => {
  const oldUser = await User.findById(userId);
  if (!oldUser) {
    throw new Error("User not found");
  }

  if (oldUser.role === "admin" && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new Error("Cannot remove the last admin");
    }
  }

  const update = { role };
  
  if (role === "agent") {
    const agent = await Agent.findOne({ email: oldUser.email });
    if (agent) update.agentId = agent._id;
  }
  
  if (oldUser.role === "agent" && role !== "agent") {
    update.agentId = null;
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true })
    .select("-otp -otpExpires -sessionToken");

  if (oldUser.role !== role) {
    await auditLogger.roleChanged(user, oldUser.role, role, adminUser, req);
  }

  return { 
    success: true, 
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  };
};
