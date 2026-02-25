export const AUTOMATION_DEFAULTS = {
  WELCOME_REGISTRATION: {
    subject: 'Welcome to SPAC, {{firstName}}!',
    bodyHtml: `<h2>Welcome to the St. Petersburg Astronomy Club!</h2>
<p>Hi {{firstName}},</p>
<p>Your account has been created and you're now part of Tampa Bay's premier astronomy community, founded in 1927.</p>
<p>Here's what you can do next:</p>
<ul>
  <li>Browse upcoming <a href="https://stpeteastro.org/events">events</a></li>
  <li>Explore our <a href="https://stpeteastro.org/membership">membership options</a></li>
  <li>Check out the <a href="https://stpeteastro.org/gallery">member gallery</a></li>
</ul>
<p style="text-align:center"><a href="https://stpeteastro.org/dashboard" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Go to Your Dashboard</a></p>
<p>Clear skies,<br/>The SPAC Team</p>`,
  },
  MEMBERSHIP_ACTIVATED: {
    subject: 'Your SPAC Membership is Active — Welcome, {{firstName}}!',
    bodyHtml: `<h2>Your Membership is Now Active</h2>
<p>Hi {{firstName}},</p>
<p>Your <strong>{{membershipType}}</strong> membership has been activated. You now have full access to all member benefits.</p>
<p style="text-align:center"><a href="https://stpeteastro.org/dashboard/membership-card" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View Your Membership Card</a></p>
<p>Clear skies,<br/>The SPAC Team</p>`,
  },
  EVENT_REGISTRATION: {
    subject: "You're registered for {{eventTitle}}!",
    bodyHtml: `<h2>Registration Confirmed</h2>
<p>Hi {{firstName}},</p>
<p>You're all set for <strong>{{eventTitle}}</strong> on {{eventDate}}.</p>
<p>Your membership card QR code will be used for check-in at the door. You can find it in your dashboard.</p>
<p style="text-align:center"><a href="https://stpeteastro.org/my-events" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View My Events</a></p>
<p>See you there!<br/>The SPAC Team</p>`,
  },
  OBS_REGISTRATION: {
    subject: 'OBS Registration Confirmed — {{firstName}}',
    bodyHtml: `<h2>OBS Registration Confirmed</h2>
<p>Hi {{firstName}},</p>
<p>Your registration for the OBS event has been confirmed and payment received.</p>
<p>We'll send you more details as the event approaches. Check your dashboard for updates.</p>
<p style="text-align:center"><a href="https://stpeteastro.org/obs" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View OBS Details</a></p>
<p>Clear skies,<br/>The SPAC Team</p>`,
  },
  MEMBERSHIP_RENEWAL_REMINDER: {
    subject: 'Your SPAC Membership Renews in 7 Days',
    bodyHtml: `<h2>Membership Renewal Coming Up</h2>
<p>Hi {{firstName}},</p>
<p>Your SPAC membership is set to renew on <strong>{{renewalDate}}</strong>. No action is needed if you'd like to continue — your subscription will renew automatically.</p>
<p>If you'd like to make changes to your membership, visit your billing page before the renewal date.</p>
<p style="text-align:center"><a href="https://stpeteastro.org/billing" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Manage Billing</a></p>
<p>Clear skies,<br/>The SPAC Team</p>`,
  },
} as const;
