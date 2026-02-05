/**
 * Database Seed Script
 * 
 * Populates the database with realistic test data for:
 * - Gallery/Media (astrophotography)
 * - Listings/Classifieds (equipment for sale)
 * - Club Documents (newsletters)
 * - Additional Events
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient, PhotoCategory, MediaType, MediaStatus, ListingCategory, ListingCondition, ListingStatus, EventStatus, DocumentCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Board member names for photographers
const photographers = [
  'John Smith',
  'Sarah Johnson', 
  'Mike Williams',
  'Emily Davis',
  'Peter McLean',
  'Guy Earle',
];

// ============================================
// GALLERY / MEDIA DATA
// ============================================

const galleryItems = [
  // Deep Sky Objects
  { title: 'M42 Orion Nebula', caption: 'The Great Orion Nebula captured during winter observing session. 4 hours total integration time.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'John Smith' },
  { title: 'M31 Andromeda Galaxy', caption: 'Our neighboring galaxy, 2.5 million light years away. Mosaic of 6 panels.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Sarah Johnson' },
  { title: 'M45 Pleiades Star Cluster', caption: 'The Seven Sisters with surrounding nebulosity. Beautiful blue reflection nebula.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Mike Williams' },
  { title: 'NGC 7000 North America Nebula', caption: 'Emission nebula in Cygnus. HaRGB composition.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Emily Davis' },
  { title: 'M51 Whirlpool Galaxy', caption: 'Classic face-on spiral galaxy with companion NGC 5195.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Peter McLean' },
  { title: 'IC 434 Horsehead Nebula', caption: 'Dark nebula silhouetted against red emission nebula in Orion.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Guy Earle' },
  { title: 'M16 Eagle Nebula - Pillars of Creation', caption: 'Iconic star-forming region in Serpens. Narrowband palette.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'John Smith' },
  { title: 'M101 Pinwheel Galaxy', caption: 'Grand design spiral galaxy in Ursa Major. 8 hours of data.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Sarah Johnson' },
  { title: 'NGC 6992 Eastern Veil Nebula', caption: 'Supernova remnant in Cygnus. Bicolor HOO processing.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Mike Williams' },
  { title: 'M20 Trifid Nebula', caption: 'Emission, reflection, and dark nebula in Sagittarius.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Emily Davis' },
  { title: 'M81 Bode\'s Galaxy', caption: 'Bright spiral galaxy in Ursa Major with M82 nearby.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Peter McLean' },
  { title: 'NGC 2237 Rosette Nebula', caption: 'Massive emission nebula in Monoceros. Hubble palette.', category: 'DEEP_SKY' as PhotoCategory, photographer: 'Guy Earle' },
  
  // Planetary
  { title: 'Saturn Opposition 2025', caption: 'Saturn at its closest approach with rings at 24° tilt. Captured with 14" SCT.', category: 'PLANETS' as PhotoCategory, photographer: 'John Smith' },
  { title: 'Jupiter with Great Red Spot', caption: 'Lucky imaging session capturing GRS transit and moon shadow.', category: 'PLANETS' as PhotoCategory, photographer: 'Sarah Johnson' },
  { title: 'Mars During Opposition', caption: 'Surface details visible including Syrtis Major and polar ice cap.', category: 'PLANETS' as PhotoCategory, photographer: 'Mike Williams' },
  { title: 'Venus Phases', caption: 'Composite showing Venus through its phases over 3 months.', category: 'PLANETS' as PhotoCategory, photographer: 'Emily Davis' },
  { title: 'Jupiter\'s Galilean Moons', caption: 'All four Galilean moons visible with surface features on Ganymede.', category: 'PLANETS' as PhotoCategory, photographer: 'Peter McLean' },
  
  // Lunar
  { title: 'Full Moon HDR', caption: 'High dynamic range composite showing maria and crater detail.', category: 'MOON' as PhotoCategory, photographer: 'Guy Earle' },
  { title: 'Copernicus Crater Close-up', caption: 'Detailed view of crater terraces and central peaks.', category: 'MOON' as PhotoCategory, photographer: 'John Smith' },
  { title: 'Lunar Terminator at First Quarter', caption: 'Shadows reveal dramatic topography along the terminator line.', category: 'MOON' as PhotoCategory, photographer: 'Sarah Johnson' },
  { title: 'Waxing Gibbous Moon', caption: 'Captured with 8" Dobsonian and smartphone.', category: 'MOON' as PhotoCategory, photographer: 'Mike Williams' },
  
  // Solar
  { title: 'Solar Prominences in H-Alpha', caption: 'Active region showing massive prominences. Lunt 60mm solar scope.', category: 'SUN' as PhotoCategory, photographer: 'Emily Davis' },
  { title: 'Sunspot Group AR3664', caption: 'Massive sunspot group visible to naked eye with proper filter.', category: 'SUN' as PhotoCategory, photographer: 'Peter McLean' },
  { title: 'Solar Eclipse 2024 Totality', caption: 'Corona visible during 4 minutes of totality in Texas.', category: 'SUN' as PhotoCategory, photographer: 'Guy Earle' },
  
  // Nightscapes
  { title: 'Milky Way Core Over Florida Keys', caption: 'Bortle 3 skies allow galactic center to shine. Single exposure.', category: 'NIGHTSCAPE' as PhotoCategory, photographer: 'John Smith' },
  { title: 'Star Trails at Starkey Park', caption: '3 hours of 30-second exposures stacked for trails.', category: 'NIGHTSCAPE' as PhotoCategory, photographer: 'Sarah Johnson' },
  { title: 'Perseid Meteor Over Observatory', caption: 'Bright fireball captured during annual meteor shower.', category: 'NIGHTSCAPE' as PhotoCategory, photographer: 'Mike Williams' },
  { title: 'Zodiacal Light at Dawn', caption: 'Rare clear morning showing zodiacal light pyramid.', category: 'NIGHTSCAPE' as PhotoCategory, photographer: 'Emily Davis' },
  
  // Events
  { title: 'SPAC Star Party Group Photo', caption: 'Members gathered at our annual dark sky event.', category: 'EVENTS' as PhotoCategory, photographer: 'Peter McLean' },
  { title: 'Kids Outreach at Library', caption: 'Young astronomers learning about the solar system.', category: 'EVENTS' as PhotoCategory, photographer: 'Guy Earle' },
];

// ============================================
// LISTINGS DATA
// ============================================

const listingsData = [
  {
    title: 'Celestron EdgeHD 8" SCT OTA',
    description: 'Excellent condition Celestron EdgeHD 8" optical tube. Flat-field optics perfect for astrophotography. Includes dust caps, star diagonal, and 25mm eyepiece. Used gently for about 2 years. Selling to upgrade to larger aperture.',
    category: 'TELESCOPE' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 1200,
    brand: 'Celestron',
    model: 'EdgeHD 800',
    yearMade: 2022,
    originalPrice: 2000,
  },
  {
    title: 'Sky-Watcher EQ6-R Pro Mount',
    description: 'Rock solid GoTo equatorial mount. 44lb payload capacity. Belt-driven for smooth tracking. Includes tripod, counterweights, and hand controller. Recently tuned and ready for imaging.',
    category: 'MOUNT' as ListingCategory,
    condition: 'LIKE_NEW' as ListingCondition,
    price: 1500,
    brand: 'Sky-Watcher',
    model: 'EQ6-R Pro',
    yearMade: 2023,
    originalPrice: 1900,
  },
  {
    title: 'ZWO ASI294MC Pro Color Camera',
    description: 'Cooled one-shot color camera. 11.7 megapixels, 4.63μm pixels. Perfect for deep sky with Micro 4/3 sensor. Includes 2" filter drawer and USB 3.0 cable. Low amp glow and excellent sensitivity.',
    category: 'CAMERA' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 800,
    brand: 'ZWO',
    model: 'ASI294MC Pro',
    yearMade: 2021,
    originalPrice: 1200,
  },
  {
    title: 'Tele Vue 13mm Ethos Eyepiece',
    description: 'The legendary 100° apparent field Ethos. Mint condition with original box and caps. Incredible views - selling only because I have too many eyepieces!',
    category: 'EYEPIECE' as ListingCategory,
    condition: 'LIKE_NEW' as ListingCondition,
    price: 500,
    brand: 'Tele Vue',
    model: '13mm Ethos',
    yearMade: 2020,
    originalPrice: 700,
  },
  {
    title: 'Orion 10" Dobsonian Telescope',
    description: 'Great starter scope or grab-and-go for experienced observers. 10" parabolic mirror provides excellent views. Includes base, finder, 2" Crayford focuser, and two eyepieces. Some minor wear on base.',
    category: 'TELESCOPE' as ListingCategory,
    condition: 'GOOD' as ListingCondition,
    price: 400,
    brand: 'Orion',
    model: 'SkyQuest XT10',
    yearMade: 2018,
    originalPrice: 700,
  },
  {
    title: 'William Optics RedCat 51 APO',
    description: 'Petzval astrograph designed for imaging. f/4.9, 250mm focal length. Flat field to the edge. Perfect for wide field nebulae and Milky Way. Includes carrying case.',
    category: 'TELESCOPE' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 1100,
    brand: 'William Optics',
    model: 'RedCat 51',
    yearMade: 2022,
    originalPrice: 1500,
  },
  {
    title: 'Celestron CGEM II Mount - Needs Repair',
    description: 'Mount powers on but RA motor makes grinding noise. Dec works fine. Good project for someone handy. Includes tripod, counterweights, and controller. Sold as-is.',
    category: 'MOUNT' as ListingCategory,
    condition: 'FOR_PARTS' as ListingCondition,
    price: 350,
    brand: 'Celestron',
    model: 'CGEM II',
    yearMade: 2019,
    originalPrice: 1600,
  },
  {
    title: 'Baader Planetarium Filter Set (2")',
    description: 'Complete LRGB filter set plus H-alpha, OIII, and SII. 2" mounted. All in excellent condition with original cases. Parfocal and excellent for narrowband imaging.',
    category: 'ACCESSORY' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 700,
    brand: 'Baader',
    model: 'Planetarium Filter Set',
    yearMade: 2021,
    originalPrice: 1100,
  },
  {
    title: 'Fujinon 16x70 FMT-SX Binoculars',
    description: 'Premium astronomical binoculars. Incredible sharpness and contrast. Individual focus. With tripod adapter and hard case. Perfect for wide field scanning and comet hunting.',
    category: 'BINOCULAR' as ListingCategory,
    condition: 'LIKE_NEW' as ListingCondition,
    price: 900,
    brand: 'Fujinon',
    model: '16x70 FMT-SX',
    yearMade: 2020,
    originalPrice: 1400,
  },
  {
    title: 'Coronado PST Solar Telescope',
    description: 'Personal Solar Telescope for H-alpha viewing. See prominences, filaments, and surface detail safely. Great for outreach. Includes case and eyepiece.',
    category: 'SOLAR' as ListingCategory,
    condition: 'GOOD' as ListingCondition,
    price: 450,
    brand: 'Coronado',
    model: 'PST',
    yearMade: 2017,
    originalPrice: 700,
  },
  {
    title: 'Moonlite CR2 Focuser with Motor',
    description: 'High-precision Crayford focuser with stepper motor kit. 2" capacity with 1.25" adapter. Zero image shift. Includes controller and cables.',
    category: 'FOCUSER' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 350,
    brand: 'Moonlite',
    model: 'CR2',
    yearMade: 2021,
    originalPrice: 500,
  },
  {
    title: 'Telrad Finder with Dew Shield',
    description: 'Classic zero-magnification finder. Essential for star hopping. Includes mounting base, extra batteries, and custom dew shield.',
    category: 'FINDER' as ListingCategory,
    condition: 'EXCELLENT' as ListingCondition,
    price: 35,
    brand: 'Telrad',
    model: 'Reflex Finder',
    yearMade: 2022,
    originalPrice: 55,
  },
  {
    title: 'Turn Left at Orion - 5th Edition (Book)',
    description: 'Essential beginner astronomy book. Excellent condition with no markings. Great gift for new astronomers or keep as reference.',
    category: 'BOOK' as ListingCategory,
    condition: 'LIKE_NEW' as ListingCondition,
    price: 20,
    brand: null,
    model: null,
    yearMade: 2019,
    originalPrice: 30,
  },
];

// ============================================
// NEWSLETTERS DATA
// ============================================

const newslettersData = [
  // 2026
  { title: 'The Eyepiece - January 2026', description: 'New Year Preview: Comet 2025 P1, Club meeting schedule, and OBS 2026 planning begins.', year: 2026, month: 1 },
  
  // 2025
  { title: 'The Eyepiece - December 2025', description: 'Year in Review: Our best astrophotos of 2025, Geminid meteor shower report, and holiday star party.', year: 2025, month: 12 },
  { title: 'The Eyepiece - November 2025', description: 'OBS 2025 Recap: Photos and memories from our annual star party. Leonids preview.', year: 2025, month: 11 },
  { title: 'The Eyepiece - October 2025', description: 'OBS 2025 Guide: Everything you need to know. Halloween sky tour and Jupiter at opposition.', year: 2025, month: 10 },
  { title: 'The Eyepiece - September 2025', description: 'Fall observing season begins! Autumn deep sky targets and outreach event schedule.', year: 2025, month: 9 },
  { title: 'The Eyepiece - August 2025', description: 'Perseid meteor shower photos, Saturn at opposition, and summer star party recap.', year: 2025, month: 8 },
  { title: 'The Eyepiece - July 2025', description: 'Summer Milky Way guide, noctilucent clouds report, and telescope buying guide update.', year: 2025, month: 7 },
  { title: 'The Eyepiece - June 2025', description: 'Summer solstice events, Mars and Jupiter conjunction, and member equipment reviews.', year: 2025, month: 6 },
  { title: 'The Eyepiece - May 2025', description: 'Annual meeting recap, new board members, and spring galaxy season highlights.', year: 2025, month: 5 },
  { title: 'The Eyepiece - April 2025', description: 'Messier Marathon results, Lyrid meteor shower, and beginner astrophotography guide.', year: 2025, month: 4 },
  { title: 'The Eyepiece - March 2025', description: 'Messier Marathon planning, spring equinox events, and Venus evening apparition.', year: 2025, month: 3 },
  { title: 'The Eyepiece - February 2025', description: 'Valentine\'s stargazing ideas, winter deep sky objects, and club anniversary celebration.', year: 2025, month: 2 },
  { title: 'The Eyepiece - January 2025', description: 'New year astronomy preview, winter observing tips, and Quadrantid meteor shower report.', year: 2025, month: 1 },
  
  // 2024
  { title: 'The Eyepiece - December 2024', description: '2024 highlights, Geminid meteor shower guide, and winter constellation tour.', year: 2024, month: 12 },
  { title: 'The Eyepiece - November 2024', description: 'OBS 2024 recap with photos, Leonid meteor preview, and holiday observing schedule.', year: 2024, month: 11 },
  { title: 'The Eyepiece - October 2024', description: 'OBS 2024 information, Halloween sky events, and comet Tsuchinshan-ATLAS coverage.', year: 2024, month: 10 },
  { title: 'The Eyepiece - September 2024', description: 'Fall astronomy season, Neptune at opposition, and school outreach programs.', year: 2024, month: 9 },
  { title: 'The Eyepiece - August 2024', description: 'Perseid meteor shower spectacular, Saturn viewing tips, and summer star party photos.', year: 2024, month: 8 },
  { title: 'The Eyepiece - July 2024', description: 'Independence Day star party, summer Milky Way photography, and equipment care in humidity.', year: 2024, month: 7 },
  { title: 'The Eyepiece - June 2024', description: 'Summer solstice events, planetary parade of 2024, and member spotlight: John Smith.', year: 2024, month: 6 },
  { title: 'The Eyepiece - May 2024', description: 'Annual meeting and elections, spring galaxy hunting wrap-up, and Eta Aquarid report.', year: 2024, month: 5 },
  { title: 'The Eyepiece - April 2024', description: 'SPECIAL EDITION: Total Solar Eclipse 2024! Member reports from the path of totality.', year: 2024, month: 4 },
  { title: 'The Eyepiece - March 2024', description: 'Eclipse preparation guide, spring equinox events, and galaxy season preview.', year: 2024, month: 3 },
  { title: 'The Eyepiece - February 2024', description: 'Eclipse planning special, winter observing report, and beginner telescope guide.', year: 2024, month: 2 },
  { title: 'The Eyepiece - January 2024', description: '2024 astronomy preview, winter star party photos, and Quadrantid meteor report.', year: 2024, month: 1 },
];

// ============================================
// ADDITIONAL EVENTS DATA
// ============================================

const additionalEvents = [
  {
    title: 'Winter Star Party at Starkey Park',
    slug: 'winter-star-party-2026',
    description: 'Join us for a night of winter deep sky observing at Starkey Wilderness Park. Orion, the winter Milky Way, and dozens of galaxies await! Bring your scope or use club equipment. Beginners welcome.',
    type: 'STAR_PARTY',
    locationName: 'Starkey Wilderness Park',
    locationAddress: '10500 Wilderness Park Blvd, New Port Richey, FL 34655',
    startDate: new Date('2026-02-14T19:00:00'),
    endDate: new Date('2026-02-14T23:59:00'),
    memberPrice: 0,
    guestPrice: 0,
  },
  {
    title: 'Beginner Telescope Workshop',
    slug: 'beginner-telescope-workshop-feb-2026',
    description: 'Learn how to set up and use your telescope! This hands-on workshop covers assembly, alignment, finding objects, and basic maintenance. Perfect for new telescope owners or those considering a purchase.',
    type: 'WORKSHOP',
    locationName: 'SPAC Observatory',
    locationAddress: '6601 Pinellas Point Dr S, St. Petersburg, FL 33705',
    startDate: new Date('2026-02-22T14:00:00'),
    endDate: new Date('2026-02-22T17:00:00'),
    memberPrice: 0,
    guestPrice: 10,
  },
  {
    title: 'Public Sidewalk Astronomy Night',
    slug: 'sidewalk-astronomy-march-2026',
    description: 'Help us share the wonder of the night sky with the public! We\'ll set up telescopes at the St. Pete Pier for free public viewing. Volunteers needed to operate scopes and answer questions.',
    type: 'OUTREACH',
    locationName: 'St. Pete Pier',
    locationAddress: '600 2nd Ave NE, St. Petersburg, FL 33701',
    startDate: new Date('2026-03-07T19:00:00'),
    endDate: new Date('2026-03-07T22:00:00'),
    memberPrice: 0,
    guestPrice: 0,
  },
  {
    title: 'Astrophotography Processing Workshop',
    slug: 'astrophoto-processing-march-2026',
    description: 'Take your astrophotography to the next level! Learn to process deep sky images using PixInsight and Photoshop. Bring your laptop with software installed. Sample data provided.',
    type: 'WORKSHOP',
    locationName: 'St. Petersburg Main Library',
    locationAddress: '3745 9th Ave N, St. Petersburg, FL 33713',
    startDate: new Date('2026-03-15T10:00:00'),
    endDate: new Date('2026-03-15T15:00:00'),
    memberPrice: 0,
    guestPrice: 15,
  },
  {
    title: 'Spring Messier Marathon',
    slug: 'messier-marathon-2026',
    description: 'Can you observe all 110 Messier objects in one night? Join us for our annual Messier Marathon challenge! We\'ll gather at a dark site and attempt to log as many Messier objects as possible from dusk to dawn.',
    type: 'STAR_PARTY',
    locationName: 'Three Lakes Wildlife Management Area',
    locationAddress: 'Three Lakes WMA, Kenansville, FL 34739',
    startDate: new Date('2026-03-21T18:00:00'),
    endDate: new Date('2026-03-22T06:00:00'),
    memberPrice: 10,
    guestPrice: 20,
    campingAvailable: true,
    campingPrice: 15,
  },
  {
    title: 'Solar Observing Day',
    slug: 'solar-observing-april-2026',
    description: 'Safe daytime astronomy! View the Sun through special hydrogen-alpha and white light solar telescopes. See sunspots, prominences, and solar flares. Great for families!',
    type: 'OUTREACH',
    locationName: 'Boyd Hill Nature Preserve',
    locationAddress: '1101 Country Club Way S, St. Petersburg, FL 33705',
    startDate: new Date('2026-04-04T10:00:00'),
    endDate: new Date('2026-04-04T14:00:00'),
    memberPrice: 0,
    guestPrice: 0,
  },
  {
    title: 'Spring Star Party',
    slug: 'spring-star-party-2026',
    description: 'Galaxy season is here! Join us for a night of galaxy hunting in Leo, Virgo, and Coma Berenices. The spring sky offers hundreds of galaxies for observers.',
    type: 'STAR_PARTY',
    locationName: 'Starkey Wilderness Park',
    locationAddress: '10500 Wilderness Park Blvd, New Port Richey, FL 34655',
    startDate: new Date('2026-04-11T19:30:00'),
    endDate: new Date('2026-04-12T00:00:00'),
    memberPrice: 0,
    guestPrice: 5,
  },
  {
    title: 'School Outreach: Pinellas Elementary',
    slug: 'pinellas-elementary-outreach-2026',
    description: 'Volunteers needed to bring astronomy to local students! We\'ll present classroom activities during the day and offer telescope viewing in the evening for students and families.',
    type: 'OUTREACH',
    locationName: 'Pinellas Elementary School',
    locationAddress: '1401 119th St N, Largo, FL 33778',
    startDate: new Date('2026-04-17T18:00:00'),
    endDate: new Date('2026-04-17T21:00:00'),
    memberPrice: 0,
    guestPrice: 0,
  },
  {
    title: 'Club Equipment Training',
    slug: 'equipment-training-may-2026',
    description: 'Learn to use the club\'s telescopes and equipment! Qualified members can check out club scopes for star parties and personal use. Required training session.',
    type: 'WORKSHOP',
    locationName: 'SPAC Observatory',
    locationAddress: '6601 Pinellas Point Dr S, St. Petersburg, FL 33705',
    startDate: new Date('2026-05-02T14:00:00'),
    endDate: new Date('2026-05-02T17:00:00'),
    memberPrice: 0,
    guestPrice: 0,
  },
  {
    title: 'Summer Kickoff Star Party',
    slug: 'summer-kickoff-2026',
    description: 'Welcome summer with a night under the stars! The summer Milky Way rises in the east, bringing globular clusters, nebulae, and the galactic center into view.',
    type: 'STAR_PARTY',
    locationName: 'Starkey Wilderness Park',
    locationAddress: '10500 Wilderness Park Blvd, New Port Richey, FL 34655',
    startDate: new Date('2026-06-13T20:00:00'),
    endDate: new Date('2026-06-14T00:00:00'),
    memberPrice: 0,
    guestPrice: 5,
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedGallery(userId: string) {
  console.log('🌌 Seeding gallery/media...');
  
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < galleryItems.length; i++) {
    const item = galleryItems[i];
    
    // Check if similar item exists
    const existing = await prisma.media.findFirst({
      where: { 
        alt: item.title,
        type: 'IMAGE',
      }
    });
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Generate placeholder image URL with unique seed
    const seed = item.title.replace(/\s+/g, '-').toLowerCase();
    const width = 1200;
    const height = 800;
    
    await prisma.media.create({
      data: {
        type: 'IMAGE' as MediaType,
        status: 'APPROVED' as MediaStatus,
        category: item.category,
        url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        thumbnailUrl: `https://picsum.photos/seed/${seed}/400/267`,
        filename: `${seed}.jpg`,
        mimeType: 'image/jpeg',
        size: Math.floor(Math.random() * 3000000) + 500000, // 500KB - 3.5MB
        width: width,
        height: height,
        alt: item.title,
        caption: `${item.caption}\n\nPhotographer: ${item.photographer}`,
        uploaded_by_id: userId,
        viewCount: Math.floor(Math.random() * 500) + 50,
        likeCount: Math.floor(Math.random() * 100) + 5,
      }
    });
    created++;
  }
  
  console.log(`✅ Gallery: Created ${created}, skipped ${skipped} existing`);
}

async function seedListings(userId: string) {
  console.log('🔭 Seeding listings/classifieds...');
  
  let created = 0;
  let skipped = 0;
  
  for (const listing of listingsData) {
    const slug = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if exists
    const existing = await prisma.listing.findUnique({
      where: { slug }
    });
    
    if (existing) {
      skipped++;
      continue;
    }
    
    await prisma.listing.create({
      data: {
        slug,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        condition: listing.condition,
        price: listing.price,
        is_negotiable: true,
        status: 'ACTIVE' as ListingStatus,
        sellerId: userId,
        brand: listing.brand,
        model: listing.model,
        yearMade: listing.yearMade,
        originalPrice: listing.originalPrice,
        location: 'St. Petersburg, FL',
        localPickupOnly: true,
        shippingAvailable: listing.price > 500,
        viewCount: Math.floor(Math.random() * 200) + 20,
      }
    });
    created++;
  }
  
  console.log(`✅ Listings: Created ${created}, skipped ${skipped} existing`);
}

async function seedNewsletters(userId: string) {
  console.log('📰 Seeding newsletters...');
  
  let created = 0;
  let skipped = 0;
  
  for (const newsletter of newslettersData) {
    // Check if exists
    const existing = await prisma.clubDocument.findFirst({
      where: {
        category: 'NEWSLETTER',
        year: newsletter.year,
        month: newsletter.month,
      }
    });
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const monthStr = String(newsletter.month).padStart(2, '0');
    const filename = `the-eyepiece-${newsletter.year}-${monthStr}.pdf`;
    
    await prisma.clubDocument.create({
      data: {
        title: newsletter.title,
        description: newsletter.description,
        category: 'NEWSLETTER' as DocumentCategory,
        fileUrl: `/documents/newsletters/${newsletter.year}/${filename}`,
        filename: filename,
        mimeType: 'application/pdf',
        size: Math.floor(Math.random() * 3000000) + 800000, // 800KB - 3.8MB
        year: newsletter.year,
        month: newsletter.month,
        isPublic: true,
        uploadedById: userId,
      }
    });
    created++;
  }
  
  console.log(`✅ Newsletters: Created ${created}, skipped ${skipped} existing`);
}

async function seedEvents(userId: string) {
  console.log('📅 Seeding additional events...');
  
  let created = 0;
  let skipped = 0;
  
  for (const event of additionalEvents) {
    // Check if exists
    const existing = await prisma.event.findUnique({
      where: { slug: event.slug }
    });
    
    if (existing) {
      skipped++;
      continue;
    }
    
    await prisma.event.create({
      data: {
        slug: event.slug,
        title: event.title,
        description: event.description,
        type: event.type,
        status: 'PUBLISHED' as EventStatus,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: 'America/New_York',
        locationName: event.locationName,
        locationAddress: event.locationAddress,
        memberPrice: event.memberPrice,
        guest_price: event.guestPrice,
        campingAvailable: event.campingAvailable || false,
        camping_price: event.campingPrice || 0,
        createdById: userId,
      }
    });
    created++;
  }
  
  console.log(`✅ Events: Created ${created}, skipped ${skipped} existing`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🚀 Starting database seed...\n');
  
  // Get admin user for foreign key references
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });
  
  if (!adminUser) {
    console.error('❌ No admin user found! Please create a user first.');
    console.log('   Run: npx prisma db seed after creating an admin user.');
    process.exit(1);
  }
  
  console.log(`📌 Using admin user: ${adminUser.email}\n`);
  
  // Run all seed functions
  await seedGallery(adminUser.id);
  await seedListings(adminUser.id);
  await seedNewsletters(adminUser.id);
  await seedEvents(adminUser.id);
  
  console.log('\n✨ Database seed complete!');
  
  // Print summary
  const counts = {
    media: await prisma.media.count(),
    listings: await prisma.listing.count(),
    documents: await prisma.clubDocument.count(),
    events: await prisma.event.count(),
  };
  
  console.log('\n📊 Current database counts:');
  console.log(`   Gallery/Media: ${counts.media}`);
  console.log(`   Listings: ${counts.listings}`);
  console.log(`   Club Documents: ${counts.documents}`);
  console.log(`   Events: ${counts.events}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
