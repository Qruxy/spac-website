'use client';

/**
 * OBS Registration Form
 *
 * Public registration form for the Orange Blossom Special.
 * Handles form submission and PayPal checkout.
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Tent, 
  Utensils, 
  Shirt,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
// Direct imports to avoid barrel export bundle bloat
import { FadeIn } from '@/components/animated/fade-in';
import { StarBorder } from '@/components/animated/star-border';

interface OBSConfig {
  id: string;
  year: number;
  eventName: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  earlyBirdDeadline: string | null;
  location: string;
  memberPrice: number;
  nonMemberPrice: number;
  earlyBirdDiscount: number;
  campingPrice: number;
  mealPrice: number;
  capacity: number;
}

interface OBSRegistrationFormProps {
  config: OBSConfig;
  isMember: boolean;
  isLoggedIn: boolean;
  userInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  registrationCount: number;
}

type RegistrationType = 'ATTENDEE' | 'SPEAKER' | 'VENDOR';
type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export function OBSRegistrationForm({ 
  config, 
  isMember, 
  isLoggedIn,
  userInfo,
  registrationCount
}: OBSRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [registrationType, setRegistrationType] = useState<RegistrationType>('ATTENDEE');
  const [firstName, setFirstName] = useState(userInfo?.firstName || '');
  const [lastName, setLastName] = useState(userInfo?.lastName || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [campingRequested, setCampingRequested] = useState(false);
  const [mealRequested, setMealRequested] = useState(false);
  const [tShirtSize, setTShirtSize] = useState<TShirtSize | ''>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate pricing
  const isEarlyBird = config.earlyBirdDeadline 
    ? new Date() < new Date(config.earlyBirdDeadline)
    : false;

  const pricing = useMemo(() => {
    const basePrice = isMember ? config.memberPrice : config.nonMemberPrice;
    const discount = isEarlyBird ? config.earlyBirdDiscount : 0;
    const registrationPrice = Math.max(0, basePrice - discount);
    const campingTotal = campingRequested ? config.campingPrice : 0;
    const mealTotal = mealRequested ? config.mealPrice : 0;
    const total = registrationPrice + campingTotal + mealTotal;
    
    return {
      basePrice,
      discount,
      registrationPrice,
      campingTotal,
      mealTotal,
      total
    };
  }, [isMember, isEarlyBird, campingRequested, mealRequested, config]);

  const isRegistrationOpen = useMemo(() => {
    const now = new Date();
    return now >= new Date(config.registrationOpens) && now <= new Date(config.registrationCloses);
  }, [config]);

  const isFull = registrationCount >= config.capacity;
  const spotsRemaining = config.capacity - registrationCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/obs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obsConfigId: config.id,
          registrationType,
          firstName,
          lastName,
          email,
          phone,
          campingRequested,
          mealRequested,
          tShirtSize: tShirtSize || null,
          dietaryRestrictions: dietaryRestrictions || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to PayPal checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        // Free registration - redirect to success
        window.location.href = '/obs/success';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isRegistrationOpen) {
    const opensDate = new Date(config.registrationOpens);
    const closesDate = new Date(config.registrationCloses);
    const now = new Date();
    
    return (
      <section className="py-16 px-4 bg-slate-900/50" id="register">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Registration Closed</h2>
              {now < opensDate ? (
                <p className="text-slate-300">
                  Registration opens on{' '}
                  <span className="text-amber-400 font-semibold">
                    {opensDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              ) : (
                <p className="text-slate-300">
                  Registration closed on{' '}
                  <span className="text-amber-400 font-semibold">
                    {closesDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              )}
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }

  if (isFull) {
    return (
      <section className="py-16 px-4 bg-slate-900/50" id="register">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Event Full</h2>
              <p className="text-slate-300">
                We&apos;ve reached capacity for OBS {config.year}. Please check back later 
                for possible waitlist availability.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-slate-900/50" id="register">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            <CreditCard className="inline-block w-8 h-8 text-amber-400 mr-2 mb-1" />
            Register for OBS {config.year}
          </h2>
          <p className="text-slate-400 text-center mb-4">
            Secure your spot at this year&apos;s star party
          </p>
          {spotsRemaining <= 50 && (
            <p className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                <Users className="w-4 h-4" />
                Only {spotsRemaining} spots remaining!
              </span>
            </p>
          )}
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <FadeIn delay={0.1} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Registration Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['ATTENDEE', 'SPEAKER', 'VENDOR'] as RegistrationType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRegistrationType(type)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        registrationType === type
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Personal Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="inline w-4 h-4 mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Add-ons</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={campingRequested}
                      onChange={(e) => setCampingRequested(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-500 text-amber-500 focus:ring-amber-500"
                    />
                    <Tent className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <span className="text-white font-medium">Camping</span>
                      <p className="text-sm text-slate-400">On-site camping for the duration of the event</p>
                    </div>
                    <span className="text-amber-400 font-semibold">+${config.campingPrice}</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={mealRequested}
                      onChange={(e) => setMealRequested(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-500 text-amber-500 focus:ring-amber-500"
                    />
                    <Utensils className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <span className="text-white font-medium">Meal Package</span>
                      <p className="text-sm text-slate-400">All meals included during the event</p>
                    </div>
                    <span className="text-amber-400 font-semibold">+${config.mealPrice}</span>
                  </label>
                </div>
              </div>

              {/* T-Shirt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Shirt className="inline w-4 h-4 mr-1" />
                  T-Shirt Size (Optional)
                </label>
                <select
                  value={tShirtSize}
                  onChange={(e) => setTShirtSize(e.target.value as TShirtSize)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                >
                  <option value="">No t-shirt needed</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="2XL">2XL</option>
                  <option value="3XL">3XL</option>
                </select>
              </div>

              {/* Dietary Restrictions */}
              {mealRequested && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dietary Restrictions
                  </label>
                  <input
                    type="text"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    placeholder="e.g., Vegetarian, Gluten-free, Allergies..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              )}

              {/* Special Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Special Requirements or Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special accommodations or information we should know..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <StarBorder
                as="button"
                type="submit"
                disabled={loading}
                color="#f59e0b"
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2 font-semibold text-lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Continue to Payment - ${pricing.total.toFixed(2)}
                    </>
                  )}
                </span>
              </StarBorder>
            </form>
          </FadeIn>

          {/* Pricing Summary */}
          <FadeIn delay={0.2}>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              
              {/* Member status */}
              <div className="mb-4 p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2">
                  {isMember ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Member Pricing</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Non-Member Pricing</span>
                    </>
                  )}
                </div>
                {!isMember && !isLoggedIn && (
                  <p className="text-xs text-slate-400 mt-1">
                    <a href="/login" className="text-amber-400 hover:underline">Log in</a> to get member pricing
                  </p>
                )}
              </div>

              {/* Early bird badge */}
              {isEarlyBird && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🎉</span>
                    <span className="text-green-400 font-medium">Early Bird Pricing!</span>
                  </div>
                  <p className="text-xs text-green-300 mt-1">
                    Save ${config.earlyBirdDiscount} - expires {new Date(config.earlyBirdDeadline!).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-300">
                  <span>Registration ({isMember ? 'Member' : 'Non-Member'})</span>
                  <span>${pricing.basePrice.toFixed(2)}</span>
                </div>
                
                {isEarlyBird && (
                  <div className="flex justify-between text-green-400">
                    <span>Early Bird Discount</span>
                    <span>-${pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                
                {campingRequested && (
                  <div className="flex justify-between text-slate-300">
                    <span>Camping</span>
                    <span>${pricing.campingTotal.toFixed(2)}</span>
                  </div>
                )}
                
                {mealRequested && (
                  <div className="flex justify-between text-slate-300">
                    <span>Meal Package</span>
                    <span>${pricing.mealTotal.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-slate-600 pt-3">
                  <div className="flex justify-between text-white font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-amber-400">${pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pricing info */}
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Member: ${config.memberPrice} / Non-Member: ${config.nonMemberPrice}</p>
                {config.earlyBirdDeadline && (
                  <p>• Early Bird Discount: ${config.earlyBirdDiscount} off</p>
                )}
                <p>• Camping: ${config.campingPrice} per person</p>
                <p>• Meals: ${config.mealPrice} per person</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

export default OBSRegistrationForm;
