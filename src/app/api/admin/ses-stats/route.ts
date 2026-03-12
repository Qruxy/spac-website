import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { SESClient, GetSendStatisticsCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [statsRes, quotaRes] = await Promise.all([
      sesClient.send(new GetSendStatisticsCommand({})),
      sesClient.send(new GetSendQuotaCommand({})),
    ]);

    // SendDataPoints are in 15-min intervals, last 2 weeks
    const points = statsRes.SendDataPoints || [];
    // Sort by timestamp ascending
    points.sort((a, b) => (a.Timestamp?.getTime() || 0) - (b.Timestamp?.getTime() || 0));

    // Last 14 days aggregated by day
    const dayMap = new Map<string, { sent: number; bounced: number; complaints: number; rejects: number }>();
    for (const pt of points) {
      if (!pt.Timestamp) continue;
      const day = pt.Timestamp.toISOString().slice(0, 10);
      const existing = dayMap.get(day) || { sent: 0, bounced: 0, complaints: 0, rejects: 0 };
      existing.sent += pt.DeliveryAttempts || 0;
      existing.bounced += pt.Bounces || 0;
      existing.complaints += pt.Complaints || 0;
      existing.rejects += pt.Rejects || 0;
      dayMap.set(day, existing);
    }

    const dailyStats = Array.from(dayMap.entries())
      .slice(-14)
      .map(([date, d]) => ({
        date,
        sent: d.sent,
        bounced: d.bounced,
        complaints: d.complaints,
        rejects: d.rejects,
        bounceRate: d.sent > 0 ? (d.bounced / d.sent) * 100 : 0,
        complaintRate: d.sent > 0 ? (d.complaints / d.sent) * 100 : 0,
      }));

    // Overall totals from all points
    const totals = points.reduce(
      (acc, pt) => {
        acc.sent += pt.DeliveryAttempts || 0;
        acc.bounced += pt.Bounces || 0;
        acc.complaints += pt.Complaints || 0;
        acc.rejects += pt.Rejects || 0;
        return acc;
      },
      { sent: 0, bounced: 0, complaints: 0, rejects: 0 }
    );

    return NextResponse.json({
      quota: {
        max24HourSend: quotaRes.Max24HourSend,
        sentLast24Hours: quotaRes.SentLast24Hours,
        maxSendRate: quotaRes.MaxSendRate,
      },
      totals: {
        ...totals,
        bounceRate: totals.sent > 0 ? ((totals.bounced / totals.sent) * 100).toFixed(2) : '0.00',
        complaintRate: totals.sent > 0 ? ((totals.complaints / totals.sent) * 100).toFixed(2) : '0.00',
      },
      dailyStats,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'SES error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
