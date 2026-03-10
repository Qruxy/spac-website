'use client';

/**
 * Star Party Request Page
 *
 * Public form for organizations to request a star party event from SPAC.
 */

import { useState } from 'react';
import { Telescope, CheckCircle, AlertCircle } from 'lucide-react';

export default function StarPartyRequestPage() {
  const [form, setForm] = useState({
    eventDate: '',
    startTime: '',
    expectedAttendees: '',
    organization: '',
    locationStreet: '',
    locationCity: '',
    locationZip: '',
    yourName: '',
    mobilePhone: '',
    emailAddress: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/star-party-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-slate-900 px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Telescope className="h-4 w-4" />
              Outreach Program
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
              Request a{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Star Party
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Our members set up their telescopes to introduce and share the night sky with various
              organizations throughout the year. Most events are conducted when Eastern Standard Time
              is in effect as the sunset is a little late during Daylight Savings Time. A
              first-quarter moon provides interesting viewing and is the best week for star parties.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          {status === 'success' ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your star party request. A SPAC member will be in touch with you
                soon to confirm details and availability.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-border bg-card/50 p-6 md:p-8 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">Event Details</h2>

              {/* Event Date + Start Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="eventDate" className={labelClass}>
                    Event Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className={labelClass}>
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    required
                    value={form.startTime}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Expected Attendees + Organization */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="expectedAttendees" className={labelClass}>
                    Expected Attendees <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="expectedAttendees"
                    name="expectedAttendees"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 30"
                    value={form.expectedAttendees}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="organization" className={labelClass}>
                    Organization <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    required
                    placeholder="School, Scout troop, etc."
                    value={form.organization}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Event Location */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Event Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="locationStreet" className={labelClass}>
                      Street Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="locationStreet"
                      name="locationStreet"
                      type="text"
                      required
                      placeholder="123 Main St"
                      value={form.locationStreet}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="locationCity" className={labelClass}>
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="locationCity"
                        name="locationCity"
                        type="text"
                        required
                        placeholder="St. Petersburg"
                        value={form.locationCity}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="locationZip" className={labelClass}>
                        ZIP Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="locationZip"
                        name="locationZip"
                        type="text"
                        required
                        pattern="\d{5}(-\d{4})?"
                        placeholder="33701"
                        value={form.locationZip}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Your Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="yourName" className={labelClass}>
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="yourName"
                      name="yourName"
                      type="text"
                      required
                      placeholder="Full name"
                      value={form.yourName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="mobilePhone" className={labelClass}>
                        Mobile Phone <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="mobilePhone"
                        name="mobilePhone"
                        type="tel"
                        required
                        placeholder="(727) 555-1234"
                        value={form.mobilePhone}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="emailAddress" className={labelClass}>
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="emailAddress"
                        name="emailAddress"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={form.emailAddress}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error state */}
              {status === 'error' && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Submitting…' : 'Submit Star Party Request'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
