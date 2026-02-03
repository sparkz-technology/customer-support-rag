import { Router } from "express";
import { requireAuth } from "../middleware/index.js";
import { Ticket, Agent } from "../models/index.js";
import { getAgentWorkloads } from "../services/ticket/ticket-assignment.js";

const router = Router();

// Get comprehensive dashboard metrics
router.get("/metrics", requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Filter by user's email for regular users, show all for agents/admins
    const userFilter = req.user.role === "user" 
      ? { customerEmail: req.user.email } 
      : {};

    // Ticket counts by status
    const statusCounts = await Ticket.aggregate([
      { $match: userFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Ticket counts by priority
    const priorityCounts = await Ticket.aggregate([
      { $match: userFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Ticket counts by category
    const categoryCounts = await Ticket.aggregate([
      { $match: userFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // SLA breach stats
    const slaStats = await Ticket.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          breached: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $ne: ["$status", "resolved"] },
                  { $ne: ["$status", "closed"] },
                  { $ne: ["$slaDueAt", null] },
                  { $lt: ["$slaDueAt", now] },
                ]},
                1,
                0,
              ],
            },
          },
          atRisk: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "resolved"] },
                    { $ne: ["$status", "closed"] },
                    { $ne: ["$slaDueAt", null] },
                    { $gte: ["$slaDueAt", now] },
                    { $lt: ["$slaDueAt", new Date(now.getTime() + 4 * 60 * 60 * 1000)] }, // Due in 4 hours
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Response time metrics
    const responseMetrics = await Ticket.aggregate([
      { $match: { ...userFilter, firstResponseAt: { $exists: true } } },
      {
        $project: {
          responseTimeMs: { $subtract: ["$firstResponseAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseMs: { $avg: "$responseTimeMs" },
          minResponseMs: { $min: "$responseTimeMs" },
          maxResponseMs: { $max: "$responseTimeMs" },
        },
      },
    ]);

    // Resolution time metrics
    const resolutionMetrics = await Ticket.aggregate([
      { $match: { ...userFilter, resolvedAt: { $exists: true } } },
      {
        $project: {
          resolutionTimeMs: { $subtract: ["$resolvedAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: "$resolutionTimeMs" },
          minResolutionMs: { $min: "$resolutionTimeMs" },
          maxResolutionMs: { $max: "$resolutionTimeMs" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Tickets created over time (last 7 days)
    const ticketTrend = await Ticket.aggregate([
      { $match: { ...userFilter, createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Agent workloads (only for agents/admins)
    const agentWorkloads = req.user.role !== "user" ? await getAgentWorkloads() : [];

    // Top issues (by subject/category)
    const topIssues = await Ticket.aggregate([
      { $match: { ...userFilter, createdAt: { $gte: last30d } } },
      { $group: { _id: { category: "$category", subject: "$subject" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Format response
    const sla = slaStats[0] || { total: 0, breached: 0, atRisk: 0 };
    const response = responseMetrics[0] || { avgResponseMs: 0 };
    const resolution = resolutionMetrics[0] || { avgResolutionMs: 0, count: 0 };

    res.json({
      success: true,
      overview: {
        totalTickets: sla.total,
        openTickets: statusCounts.find(s => s._id === "open")?.count || 0,
        inProgressTickets: statusCounts.find(s => s._id === "in-progress")?.count || 0,
        resolvedTickets: statusCounts.find(s => s._id === "resolved")?.count || 0,
      },
      sla: {
        breachedCount: sla.breached,
        atRiskCount: sla.atRisk,
        breachRate: sla.total ? ((sla.breached / sla.total) * 100).toFixed(1) + "%" : "0%",
      },
      responseTime: {
        averageMinutes: response.avgResponseMs ? Math.round(response.avgResponseMs / 60000) : 0,
        averageFormatted: formatDuration(response.avgResponseMs),
      },
      resolutionTime: {
        averageHours: resolution.avgResolutionMs ? (resolution.avgResolutionMs / 3600000).toFixed(1) : 0,
        averageFormatted: formatDuration(resolution.avgResolutionMs),
        totalResolved: resolution.count,
      },
      distribution: {
        byStatus: statusCounts.map(s => ({ status: s._id, count: s.count })),
        byPriority: priorityCounts.map(p => ({ priority: p._id, count: p.count })),
        byCategory: categoryCounts.map(c => ({ category: c._id, count: c.count })),
      },
      trends: {
        last7Days: ticketTrend.map(t => ({ date: t._id, count: t.count })),
      },
      agents: agentWorkloads.map(a => ({
        name: a.name,
        categories: a.categories,
        currentLoad: a.currentLoad,
        maxLoad: a.maxLoad,
        utilization: ((a.currentLoad / a.maxLoad) * 100).toFixed(0) + "%",
      })),
      topIssues: topIssues.map(i => ({
        category: i._id.category,
        subject: i._id.subject,
        count: i.count,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Get SLA breach alerts
router.get("/sla-alerts", requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Filter by user's email for regular users
    const userFilter = req.user.role === "user" 
      ? { customerEmail: req.user.email } 
      : {};

    // Already breached
    const breached = await Ticket.find({
      ...userFilter,
      status: { $nin: ["resolved", "closed"] },
      slaDueAt: { $lt: now },
    })
      .populate("assignedTo", "name email")
      .sort({ slaDueAt: 1 })
      .limit(20);

    // At risk (due within 4 hours)
    const atRisk = await Ticket.find({
      ...userFilter,
      status: { $nin: ["resolved", "closed"] },
      slaDueAt: { $lte: fourHoursFromNow, $gt: now },
    })
      .populate("assignedTo", "name email")
      .sort({ slaDueAt: 1 })
      .limit(20);

    res.json({
      success: true,
      breached: breached.map(formatTicketAlert),
      atRisk: atRisk.map(formatTicketAlert),
    });
  } catch (err) {
    next(err);
  }
});

// Helper functions
function formatDuration(ms) {
  if (!ms) return "N/A";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTicketAlert(ticket) {
  return {
    id: ticket._id,
    subject: ticket.subject,
    customerEmail: ticket.customerEmail,
    priority: ticket.priority,
    category: ticket.category,
    assignedTo: ticket.assignedTo?.name || "Unassigned",
    slaDueAt: ticket.slaDueAt,
    timeRemaining: formatDuration(ticket.slaDueAt - new Date()),
    createdAt: ticket.createdAt,
  };
}

export default router;
