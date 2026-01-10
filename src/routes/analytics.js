import { Router } from "express";
import { requireAuth } from "../middleware/index.js";
import { Ticket } from "../models/index.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [statusCounts, priorityCounts] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    ]);

    const resolvedStats = await Ticket.aggregate([
      { $match: { status: "resolved", resolvedAt: { $exists: true } } },
      {
        $project: {
          diffMs: { $subtract: ["$resolvedAt", "$createdAt"] },
          agentLogsSize: { $size: { $ifNull: ["$agentLogs", []] } },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: "$diffMs" },
          resolvedCount: { $sum: 1 },
          deflectedCount: {
            $sum: {
              $cond: [{ $lte: ["$agentLogsSize", 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    const topIntents = await Ticket.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const resolved = resolvedStats[0] || {
      avgResolutionMs: null,
      resolvedCount: 0,
      deflectedCount: 0,
    };

    const averageResolutionHours = resolved.avgResolutionMs
      ? resolved.avgResolutionMs / (1000 * 60 * 60)
      : null;
    const deflectionRate = resolved.resolvedCount
      ? resolved.deflectedCount / resolved.resolvedCount
      : null;

    res.json({
      success: true,
      totals: {
        byStatus: statusCounts.map((s) => ({ status: s._id, count: s.count })),
        byPriority: priorityCounts.map((p) => ({ priority: p._id, count: p.count })),
      },
      metrics: {
        averageResolutionHours,
        deflectionRate,
      },
      topIntents: topIntents.map((i) => ({ intent: i._id, count: i.count })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
