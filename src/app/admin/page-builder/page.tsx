'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Users, Calendar, Image as ImageIcon, CreditCard, Mail,
  Phone, BookOpen, Star, ShoppingBag, Heart, Telescope, Eye, Zap,
  MessageSquare, Upload, Check, AlertCircle, Loader2,
  Type, AlignLeft, FileText, ChevronDown, ChevronUp, ExternalLink,
  Sparkles, X,
} from 'lucide-react';
import { PageContentEditor } from '@/components/admin/page-content-editor';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'select';

interface FieldDef {
  key: string;
  label: string;
  hint: string;
  type: FieldType;
  placeholder?: string;
  maxLength?: number;
  section?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

interface PageDef {
  key: string;
  label: string;
  href: string;
  description: string;
  icon: React.ElementType;
  fields: FieldDef[];
}

// ─── Page Config (do not modify) ─────────────────────────────────────────────

const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Home Page',
    href: '/',
    description: 'The first page visitors see when they come to the site.',
    icon: Home,
    fields: [
      { key: 'hero_title', label: 'Main Headline', hint: 'The big bold text front and center — the first thing everyone reads.', type: 'text', placeholder: 'e.g. St. Petersburg Astronomy Club', maxLength: 80, section: 'Hero Section', defaultValue: 'St. Petersburg Astronomy Club' },
      { key: 'hero_subtitle', label: 'Tagline / Subheading', hint: 'A short sentence below the headline that describes the club.', type: 'textarea', placeholder: 'e.g. Exploring the universe together since 1975', maxLength: 200, section: 'Hero Section', defaultValue: "Tampa Bay's home for stargazers, educators, and night sky enthusiasts since 1927." },
      { key: 'hero_image', label: 'Hero Background Photo', hint: 'The full-width background image behind the headline. Use a high-quality astronomy or night sky photo.', type: 'image', section: 'Hero Section' },
      { key: 'cta_primary_text', label: 'Join Button Text', hint: 'The text on the main call-to-action button.', type: 'text', placeholder: 'Join the Club', maxLength: 40, section: 'Hero Section', defaultValue: 'Join Today' },
      { key: 'feature_star_parties_title', label: 'Feature 1 — Title', hint: 'Title for the Monthly Star Parties card.', type: 'text', placeholder: 'Monthly Star Parties', maxLength: 60, section: 'Activity Cards', defaultValue: 'Monthly Star Parties' },
      { key: 'feature_star_parties_desc', label: 'Feature 1 — Description', hint: 'Short description for the Monthly Star Parties card.', type: 'textarea', placeholder: 'Join us at our dark sky site...', maxLength: 200, section: 'Activity Cards', defaultValue: 'Join us at our dark sky site at Withlacoochee River Park for new moon observing sessions.' },
      { key: 'feature_general_meetings_title', label: 'Feature 2 — Title', hint: 'Title for the General Meetings card.', type: 'text', placeholder: 'General Meetings', maxLength: 60, section: 'Activity Cards', defaultValue: 'General Meetings' },
      { key: 'feature_general_meetings_desc', label: 'Feature 2 — Description', hint: 'Short description for the General Meetings card.', type: 'textarea', placeholder: 'Learn from expert speakers...', maxLength: 200, section: 'Activity Cards', defaultValue: 'Learn from expert speakers and fellow astronomers at our monthly meetings.' },
      { key: 'feature_obs_title', label: 'Feature 3 — Title', hint: 'Title for the Orange Blossom Special card.', type: 'text', placeholder: 'Orange Blossom Special', maxLength: 60, section: 'Activity Cards', defaultValue: 'Orange Blossom Special' },
      { key: 'feature_obs_desc', label: 'Feature 3 — Description', hint: 'Short description for the Orange Blossom Special card.', type: 'textarea', placeholder: 'Our annual multi-day star party...', maxLength: 200, section: 'Activity Cards', defaultValue: 'Our annual multi-day star party featuring camping, observing, and community.' },
      { key: 'feature_mirror_lab_title', label: 'Feature 4 — Title', hint: 'Title for the Mirror Lab card.', type: 'text', placeholder: 'Mirror Lab', maxLength: 60, section: 'Activity Cards', defaultValue: 'Mirror Lab' },
      { key: 'feature_mirror_lab_desc', label: 'Feature 4 — Description', hint: 'Short description for the Mirror Lab card.', type: 'textarea', placeholder: 'Learn to grind your own telescope mirror...', maxLength: 200, section: 'Activity Cards', defaultValue: 'Learn to grind your own telescope mirror with hands-on instruction from experts.' },
      { key: 'feature_outreach_title', label: 'Feature 5 — Title', hint: 'Title for the Public Outreach card.', type: 'text', placeholder: 'Public Outreach', maxLength: 60, section: 'Activity Cards', defaultValue: 'Public Outreach' },
      { key: 'feature_outreach_desc', label: 'Feature 5 — Description', hint: 'Short description for the Public Outreach card.', type: 'textarea', placeholder: 'We bring the stars to schools...', maxLength: 200, section: 'Activity Cards', defaultValue: 'We bring the stars to schools, scout troops, and community organizations.' },
      { key: 'feature_classifieds_title', label: 'Feature 6 — Title', hint: 'Title for the Classifieds card.', type: 'text', placeholder: 'Equipment Classifieds', maxLength: 60, section: 'Activity Cards', defaultValue: 'Equipment Classifieds' },
      { key: 'feature_classifieds_desc', label: 'Feature 6 — Description', hint: 'Short description for the Classifieds card.', type: 'textarea', placeholder: 'Buy, sell, and trade astronomy equipment...', maxLength: 200, section: 'Activity Cards', defaultValue: 'Buy, sell, and trade astronomy equipment with fellow club members.' },
      { key: 'events_heading', label: 'Events Section Heading', hint: 'The title above the upcoming events list.', type: 'text', placeholder: 'Upcoming Events', maxLength: 60, section: 'Events Section', defaultValue: 'Upcoming Events' },
      { key: 'events_subheading', label: 'Events Section Subheading', hint: 'The small line below the events heading.', type: 'text', placeholder: 'Join us for star parties, meetings, and special events', maxLength: 120, section: 'Events Section', defaultValue: 'Join us for star parties, meetings, and special events' },
      { key: 'stat_founded', label: 'Stat: Founded Year', hint: 'The founding year displayed in the stats bar. Default: 1927', type: 'text', placeholder: '1927', maxLength: 10, section: 'Stats Bar', defaultValue: '1927' },
      { key: 'stat_founded_label', label: 'Stat: Founded Label', hint: 'Label under the founding year.', type: 'text', placeholder: 'Founded', maxLength: 30, section: 'Stats Bar', defaultValue: 'Founded' },
      { key: 'stat_members', label: 'Stat: Member Count', hint: 'Number shown in the Members stat. Just the number, e.g. 300', type: 'text', placeholder: '300', maxLength: 10, section: 'Stats Bar', defaultValue: '300' },
      { key: 'stat_members_label', label: 'Stat: Members Label', hint: 'Label under the member count.', type: 'text', placeholder: 'Members', maxLength: 30, section: 'Stats Bar', defaultValue: 'Members' },
      { key: 'stat_members_suffix', label: 'Stat: Members Suffix', hint: 'Character after the member count, usually "+" or "k+".', type: 'text', placeholder: '+', maxLength: 5, section: 'Stats Bar', defaultValue: '+' },
      { key: 'stat_events_per_year', label: 'Stat: Events Per Year', hint: 'Number of events per year shown in the stats bar.', type: 'text', placeholder: '12', maxLength: 10, section: 'Stats Bar', defaultValue: '12' },
      { key: 'stat_events_label', label: 'Stat: Events Label', hint: 'Label under the events count.', type: 'text', placeholder: 'Events/Year', maxLength: 30, section: 'Stats Bar', defaultValue: 'Events/Year' },
      { key: 'stat_years_strong', label: 'Stat: Years Active', hint: 'Number of years the club has been active. Auto-calculated from 1927 if left blank.', type: 'text', placeholder: 'Auto', maxLength: 10, section: 'Stats Bar' },
      { key: 'stat_years_label', label: 'Stat: Years Label', hint: 'Label under the years active count.', type: 'text', placeholder: 'Years Strong', maxLength: 30, section: 'Stats Bar', defaultValue: 'Years Strong' },
      { key: 'cta_heading', label: 'CTA Heading', hint: 'The heading above the "Join Us" call-to-action at the bottom of the page.', type: 'text', placeholder: 'Ready to Explore the Universe?', maxLength: 80, section: 'Call to Action (Bottom)', defaultValue: 'Ready to Explore the Universe?' },
      { key: 'cta_body', label: 'CTA Body Text', hint: 'The paragraph below the CTA heading encouraging visitors to join.', type: 'textarea', placeholder: 'Whether you\'re a seasoned astronomer or just starting out...', maxLength: 300, section: 'Call to Action (Bottom)', defaultValue: "Whether you're a seasoned astronomer or just starting out, there's a place for you at SPAC. Join our community of stargazers today." },
    ],
  },
  {
    key: 'about',
    label: 'About Page',
    href: '/about',
    description: 'Tells visitors who the club is, its history, mission, board, and affiliations.',
    icon: Users,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The large heading at the top of the About page.', type: 'text', placeholder: 'About SPAC', maxLength: 60, section: 'Page Header', defaultValue: 'About SPAC' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown just below the title.', type: 'textarea', placeholder: 'Dedicated to astronomy education and stargazing...', maxLength: 200, section: 'Page Header', defaultValue: "For nearly a century, SPAC has been bringing the wonders of the night sky to Tampa Bay." },
      { key: 'hero_image', label: 'Header Photo', hint: 'Optional: a photo used at the top of the About page.', type: 'image', section: 'Page Header' },
      { key: 'hero_photo_position', label: 'Photo Position', hint: 'Controls which part of the photo is centered in the frame. Useful when the subject is off-center.', type: 'select', section: 'Page Header', defaultValue: 'center center', options: [
        { value: 'center center', label: 'Center (default)' },
        { value: 'top center', label: 'Top' },
        { value: 'bottom center', label: 'Bottom' },
        { value: 'center left', label: 'Left' },
        { value: 'center right', label: 'Right' },
      ]},
      { key: 'about_body', label: 'About Us Body Content', hint: 'An optional extra block of text below the hero. Use this for a custom intro, announcements, or featured content.', type: 'richtext', section: 'Body Content (Optional)' },
      { key: 'mission_heading', label: 'Mission Section Heading', hint: 'The heading above the "Our Mission" section.', type: 'text', placeholder: 'Making Astronomy Accessible to All', maxLength: 80, section: 'Mission Section', defaultValue: 'Making Astronomy Accessible to All' },
      { key: 'mission_body', label: 'Mission Description', hint: 'The text in the Mission section describing what the club is about. Can be 1–3 paragraphs.', type: 'richtext', section: 'Mission Section' },
      { key: 'stat_years', label: 'Stat Card 1 — Years Active', hint: 'Displayed as the big number in the first stat card. Example: 97+', type: 'text', placeholder: '97+', maxLength: 10, section: 'Mission Stats Cards', defaultValue: '97+' },
      { key: 'stat_years_label', label: 'Stat Card 1 — Label', hint: 'Label under the years number.', type: 'text', placeholder: 'Years Active', maxLength: 30, section: 'Mission Stats Cards', defaultValue: 'Years Active' },
      { key: 'stat_members', label: 'Stat Card 2 — Members', hint: 'Member count displayed in the second stat card. Example: 300+', type: 'text', placeholder: '300+', maxLength: 10, section: 'Mission Stats Cards', defaultValue: '300+' },
      { key: 'stat_members_label', label: 'Stat Card 2 — Label', hint: 'Label under the members number.', type: 'text', placeholder: 'Members', maxLength: 30, section: 'Mission Stats Cards', defaultValue: 'Members' },
      { key: 'stat_events', label: 'Stat Card 3 — Annual Events', hint: 'Number of events per year. Example: 12+', type: 'text', placeholder: '12+', maxLength: 10, section: 'Mission Stats Cards', defaultValue: '12+' },
      { key: 'stat_events_label', label: 'Stat Card 3 — Label', hint: 'Label under the events number.', type: 'text', placeholder: 'Annual Events', maxLength: 30, section: 'Mission Stats Cards', defaultValue: 'Annual Events' },
      { key: 'stat_students', label: 'Stat Card 4 — Students Reached', hint: 'Students/people reached. Example: 1000s', type: 'text', placeholder: '1000s', maxLength: 10, section: 'Mission Stats Cards', defaultValue: '1000s' },
      { key: 'stat_students_label', label: 'Stat Card 4 — Label', hint: 'Label under the students number.', type: 'text', placeholder: 'Students Reached', maxLength: 30, section: 'Mission Stats Cards', defaultValue: 'Students Reached' },
      { key: 'history_heading', label: 'History Section Heading', hint: 'The heading above the club history/timeline section.', type: 'text', placeholder: 'A Legacy of Stargazing', maxLength: 80, section: 'History / Timeline', defaultValue: 'A Legacy of Stargazing' },
      { key: 'milestones_body', label: 'History / Timeline Content', hint: 'The full club history. You can use headings for eras, bullet lists for milestones, or any format you like. This replaces the automatic timeline when filled in.', type: 'richtext', section: 'History / Timeline' },
      { key: 'affiliations_heading', label: 'Affiliations Section Heading', hint: 'The heading above the affiliations section.', type: 'text', placeholder: 'Our Partners & Affiliations', maxLength: 80, section: 'Affiliations', defaultValue: 'Our Partners & Affiliations' },
      { key: 'affiliations_body', label: 'Affiliations Content', hint: 'Details about organizations SPAC is affiliated with. Use headings for each org name, followed by a short description and link. This replaces the default ASP + IDA cards when filled in.', type: 'richtext', section: 'Affiliations' },
    ],
  },
  {
    key: 'events',
    label: 'Events Page',
    href: '/events',
    description: 'Lists all upcoming club events and star parties.',
    icon: Calendar,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Events page.', type: 'text', placeholder: 'Upcoming Events', maxLength: 60, section: 'Page Header', defaultValue: 'Upcoming Events' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown below the title.', type: 'textarea', placeholder: 'Join us for star parties, meetings, and more...', maxLength: 200, section: 'Page Header', defaultValue: 'Star parties, general meetings, and special events for members and the public.' },
      { key: 'empty_state_text', label: '"No Events" Message', hint: 'Text shown when there are no upcoming events listed. Example: "Check back soon — new events are coming!"', type: 'text', placeholder: 'No upcoming events at this time. Check back soon!', maxLength: 150, section: 'Page Content', defaultValue: 'No upcoming events at this time. Check back soon!' },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery Page',
    href: '/gallery',
    description: 'Showcases member-submitted astrophotography.',
    icon: ImageIcon,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Gallery page.', type: 'text', placeholder: 'Member Gallery', maxLength: 60, section: 'Page Header', defaultValue: 'Member Gallery' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description below the title.', type: 'textarea', placeholder: 'Beautiful astrophotography by our members...', maxLength: 200, section: 'Page Header', defaultValue: 'Astrophotography submitted by our members.' },
    ],
  },
  {
    key: 'membership',
    label: 'Membership Page',
    href: '/membership',
    description: 'Where visitors sign up and choose a membership plan.',
    icon: CreditCard,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Membership page.', type: 'text', placeholder: 'Join SPAC', maxLength: 60, section: 'Page Header', defaultValue: 'Join SPAC' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short pitch shown below the title.', type: 'textarea', placeholder: 'Become a member and start exploring the stars with us.', maxLength: 200, section: 'Page Header', defaultValue: 'Become a member and start exploring the universe with us.' },
      { key: 'intro_text', label: 'Introduction / Benefits Overview', hint: 'A brief intro explaining what membership includes. This appears before the pricing cards.', type: 'richtext', section: 'Page Content' },
      { key: 'student_price_monthly', label: 'Student — Monthly Price', hint: 'Just the dollar amount, e.g. "5.00"', type: 'text', placeholder: '5.00', maxLength: 10, section: 'Pricing' },
      { key: 'student_price_annual', label: 'Student — Annual Price', hint: 'Just the dollar amount, e.g. "50.00"', type: 'text', placeholder: '50.00', maxLength: 10, section: 'Pricing' },
      { key: 'individual_price_monthly', label: 'Individual/Single — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '10.00', maxLength: 10, section: 'Pricing' },
      { key: 'individual_price_annual', label: 'Individual/Single — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '100.00', maxLength: 10, section: 'Pricing' },
      { key: 'family_price_monthly', label: 'Family — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '15.00', maxLength: 10, section: 'Pricing' },
      { key: 'family_price_annual', label: 'Family — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '150.00', maxLength: 10, section: 'Pricing' },
      { key: 'patron_price_monthly', label: 'Patron — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '25.00', maxLength: 10, section: 'Pricing' },
      { key: 'patron_price_annual', label: 'Patron — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '250.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefactor_price_monthly', label: 'Benefactor — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '50.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefactor_price_annual', label: 'Benefactor — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '500.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefits_text', label: 'Member Benefits Details', hint: 'A full list or description of what members get. Use bullet points for easy reading.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter Page',
    href: '/newsletter',
    description: 'Archive of the club newsletter (The Eyepiece).',
    icon: Mail,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Newsletter page.', type: 'text', placeholder: 'The Eyepiece Newsletter', maxLength: 60, section: 'Page Header', defaultValue: 'The Eyepiece' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown below the title.', type: 'textarea', placeholder: 'Monthly newsletter for SPAC members...', maxLength: 200, section: 'Page Header', defaultValue: 'The official monthly newsletter of the St. Petersburg Astronomy Club.' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact Page',
    href: '/contact',
    description: 'How visitors can get in touch with the club.',
    icon: Phone,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Contact page.', type: 'text', placeholder: 'Contact Us', maxLength: 60, section: 'Page Header', defaultValue: 'Contact Us' },
      { key: 'intro_text', label: 'Introduction', hint: "A friendly opening paragraph inviting visitors to reach out.", type: 'textarea', placeholder: "Have questions? We'd love to hear from you...", maxLength: 300, section: 'Contact Info', defaultValue: "Have questions? We'd love to hear from you." },
      { key: 'email', label: 'Contact Email Address', hint: 'The main email address people should use to contact the club.', type: 'text', placeholder: 'info@stpeteastro.org', maxLength: 100, section: 'Contact Info', defaultValue: 'info@stpeteastro.org' },
      { key: 'phone', label: 'Phone Number', hint: 'Club phone number (leave blank if none).', type: 'text', placeholder: '(727) 555-0000', maxLength: 30, section: 'Contact Info' },
      { key: 'address', label: 'Mailing Address', hint: "The club's mailing address (shown on the contact page).", type: 'textarea', placeholder: 'P.O. Box 12345\nSt. Petersburg, FL 33701', maxLength: 200, section: 'Contact Info' },
    ],
  },
  {
    key: 'history',
    label: 'Club History',
    href: '/history',
    description: 'The history and story of the club.',
    icon: BookOpen,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the History page.', type: 'text', placeholder: 'Our History', maxLength: 60, section: 'Page Header', defaultValue: 'Our History' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short phrase shown below the title.', type: 'textarea', placeholder: 'Over 45 years of exploring the night sky...', maxLength: 200, section: 'Page Header', defaultValue: 'Over 45 years of exploring the night sky together.' },
      { key: 'body', label: 'History Content', hint: 'The full history of the club. You can use headings to break it into time periods, and add photos with the image insert button.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'mirror-lab',
    label: 'Mirror Lab',
    href: '/mirror-lab',
    description: "Information about the club's telescope mirror-making lab.",
    icon: Telescope,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Mirror Lab page.', type: 'text', placeholder: 'Mirror Lab', maxLength: 60, section: 'Page Header', defaultValue: 'Mirror Lab' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short tagline for the mirror lab.', type: 'textarea', placeholder: 'Build your own telescope mirror with guidance from expert club members.', maxLength: 200, section: 'Page Header', defaultValue: 'Build your own telescope mirror with expert guidance from club members.' },
      { key: 'hero_image', label: 'Header Photo', hint: 'A photo for the top of the Mirror Lab page (e.g., someone grinding a mirror).', type: 'image', section: 'Page Header' },
      { key: 'hero_photo_position', label: 'Photo Position', hint: 'Controls which part of the photo is centered in the frame. Useful when the subject is off-center.', type: 'select', section: 'Page Header', defaultValue: 'center center', options: [
        { value: 'center center', label: 'Center (default)' },
        { value: 'top center', label: 'Top' },
        { value: 'bottom center', label: 'Bottom' },
        { value: 'center left', label: 'Left' },
        { value: 'center right', label: 'Right' },
      ]},
      { key: 'body', label: 'Mirror Lab Content', hint: 'All the details about the mirror lab — how it works, how to participate, schedule, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'viewing',
    label: 'Viewing Sites',
    href: '/viewing',
    description: 'List of dark sky viewing locations used by the club.',
    icon: Eye,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Viewing Sites page.', type: 'text', placeholder: 'Viewing Sites', maxLength: 60, section: 'Page Header', defaultValue: 'Viewing Sites' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the viewing sites.', type: 'textarea', placeholder: 'Discover the best dark sky locations in the Tampa Bay area.', maxLength: 200, section: 'Page Header', defaultValue: 'The best dark sky locations in the Tampa Bay area.' },
      { key: 'body', label: 'Viewing Sites Content', hint: 'Details about each viewing location — name, address, directions, what to expect, rules, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'general-meetings',
    label: 'General Meetings',
    href: '/general-meetings',
    description: "Information about the club's regular monthly meetings — schedule, location, contact, and past presentations.",
    icon: MessageSquare,
    fields: [
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'The line below the "General Meetings" heading at the top of the page.', type: 'textarea', placeholder: 'Join us for presentations, discussions, and club news...', maxLength: 200, section: 'Page Header', defaultValue: 'Join fellow astronomers for presentations, discussions, and club news. Free and open to the public.' },
      { key: 'body', label: 'Intro / Announcement Block', hint: 'Optional: an intro paragraph or announcement shown above the schedule card. Leave blank to hide this section.', type: 'richtext', section: 'Intro (Optional)' },
      { key: 'meeting_day', label: 'Meeting Day / Frequency', hint: 'When meetings are held. Example: "Fourth Thursday of each month (except November and December, when the third Thursday is used)"', type: 'textarea', placeholder: 'Fourth Thursday of each month', maxLength: 300, section: 'Meeting Schedule', defaultValue: 'Fourth Thursday of each month (except November and December, when meetings are held on the third Thursday)' },
      { key: 'meeting_time', label: 'Meeting Start Time', hint: 'What time the meeting starts. Example: 7:30 PM', type: 'text', placeholder: '7:30 PM', maxLength: 30, section: 'Meeting Schedule', defaultValue: '7:30 PM' },
      { key: 'meeting_location_name', label: 'Venue / Location Name', hint: 'The name of the building or venue. Example: "St. Petersburg College — Gibbs Campus"', type: 'text', placeholder: 'St. Petersburg College — Gibbs Campus', maxLength: 150, section: 'Meeting Schedule', defaultValue: 'St. Petersburg College — Gibbs Campus' },
      { key: 'meeting_location_address', label: 'Venue Street Address', hint: 'Full street address of the venue. Example: "6605 5th Ave North, Saint Petersburg, FL 33710"', type: 'textarea', placeholder: '6605 5th Ave North, Saint Petersburg, FL 33710', maxLength: 300, section: 'Meeting Schedule', defaultValue: '6605 5th Ave North, Saint Petersburg, FL 33710' },
      { key: 'meeting_room', label: 'Room / Building', hint: 'The specific room or building within the venue. Example: "Natural Sciences Building, Room SC236"', type: 'text', placeholder: 'Natural Sciences Building, Room SC236', maxLength: 150, section: 'Meeting Schedule', defaultValue: 'Natural Sciences Building, Room SC236' },
      { key: 'open_to_public_note', label: 'Open to Public Note', hint: 'A note about whether meetings are open to the public, shown in the schedule card.', type: 'textarea', placeholder: 'Meetings are free and open to the public. Everyone is welcome!', maxLength: 300, section: 'Meeting Schedule', defaultValue: 'Meetings are free and open to the public. Everyone is welcome!' },
      { key: 'social_room', label: 'Parties & Picnics Room', hint: 'The room/location used for special social events like holiday parties. Leave blank to hide this.', type: 'text', placeholder: 'Philip Benjamin Social Arts Building, Room SA114', maxLength: 150, section: 'Meeting Schedule', defaultValue: 'Philip Benjamin Social Arts Building, Room SA114' },
      { key: 'contact_name', label: 'Contact Person Name', hint: "The person's name displayed in the 'Questions? Contact...' line. Leave blank to show just the email.", type: 'text', placeholder: 'Peter McLean', maxLength: 80, section: 'Contact', defaultValue: 'Peter McLean' },
      { key: 'contact_email', label: 'Contact Email Address', hint: 'The email address displayed for meeting questions.', type: 'text', placeholder: 'Info@StPeteAstronomyClub.org', maxLength: 150, section: 'Contact', defaultValue: 'Info@StPeteAstronomyClub.org' },
      { key: 'past_presentations', label: 'Past Presentations Content', hint: 'The full list or table of past presentations. Use a table, bullet list, or any format. When filled in, this replaces the default hardcoded table. TIP: Use a table with columns: Date, Title, Video, PDF — add links using the link button in the toolbar.', type: 'richtext', section: 'Past Presentations' },
    ],
  },
  {
    key: 'classifieds',
    label: 'Classifieds',
    href: '/classifieds',
    description: 'Member telescope and equipment buy/sell listings.',
    icon: ShoppingBag,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Classifieds page.', type: 'text', placeholder: 'Member Classifieds', maxLength: 60, section: 'Page Header', defaultValue: 'Member Classifieds' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the classifieds section.', type: 'textarea', placeholder: 'Buy and sell telescopes, eyepieces, and astronomy gear...', maxLength: 200, section: 'Page Header', defaultValue: 'Buy and sell telescopes, eyepieces, and astronomy gear.' },
      { key: 'rules_text', label: 'Classifieds Rules & Policy', hint: 'The rules and guidelines for posting classifieds ads. Members will read this before posting.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'donations',
    label: 'Donations',
    href: '/donations',
    description: 'Page where visitors can make donations to the club.',
    icon: Heart,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Donations page.', type: 'text', placeholder: 'Support SPAC', maxLength: 60, section: 'Page Header', defaultValue: 'Support SPAC' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short tagline encouraging donations.', type: 'textarea', placeholder: 'Help us keep the stars accessible to everyone.', maxLength: 200, section: 'Page Header', defaultValue: 'Help us keep the stars accessible to everyone.' },
      { key: 'body', label: 'Donation Appeal', hint: 'A heartfelt message about why donations matter and what the money funds (equipment, events, outreach programs, etc.).', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'obs',
    label: 'OBS Event',
    href: '/obs',
    description: 'The public page for the annual Observing Skills event.',
    icon: Star,
    fields: [
      { key: 'hero_title', label: 'Event Title', hint: 'The name of the OBS event shown at the top of the page.', type: 'text', placeholder: 'Observing Skills Event', maxLength: 80, section: 'Page Header', defaultValue: 'Orange Blossom Special' },
      { key: 'hero_subtitle', label: 'Event Tagline', hint: 'A short description of the event shown below the title.', type: 'textarea', placeholder: 'An annual celebration of astronomical observation...', maxLength: 200, section: 'Page Header', defaultValue: "SPAC's annual multi-day star party featuring camping, observing, and community." },
      { key: 'hero_image', label: 'Event Banner Photo', hint: 'A large photo used as the banner for the OBS event page.', type: 'image', section: 'Page Header' },
      { key: 'description', label: 'Event Description', hint: 'Full details about the event — what it is, who can attend, schedule, what to bring, registration info, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'star-party-request',
    label: 'Star Party Request',
    href: '/star-party-request',
    description: 'Form page where schools and groups can request a star party.',
    icon: Zap,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Star Party Request page.', type: 'text', placeholder: 'Request a Star Party', maxLength: 60, section: 'Page Header', defaultValue: 'Request a Star Party' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the program.', type: 'textarea', placeholder: 'Bring the wonders of the universe to your school or group.', maxLength: 200, section: 'Page Header', defaultValue: 'Bring the wonders of the universe to your school or group.' },
      { key: 'intro_text', label: 'Introduction Text', hint: "An explanation of the star party program — what it is, who it's for, what's involved, how to fill out the form.", type: 'textarea', placeholder: 'Our club members love sharing astronomy with the community...', maxLength: 600, section: 'Page Content', defaultValue: "Our club members love sharing astronomy with schools, scout troops, and community organizations. Fill out the form below and we'll be in touch." },
    ],
  },
  {
    key: 'vsa',
    label: 'VSA (Very Small Array)',
    href: '/vsa',
    description: "SPAC's smart telescope loaner program — current targets, how to participate, and program details.",
    icon: Telescope,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The large heading at the top of the VSA page.', type: 'text', placeholder: 'Very Small Array', maxLength: 60, section: 'Page Header', defaultValue: 'Very Small Array' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short tagline describing the VSA program.', type: 'textarea', placeholder: "SPAC's smart telescope loaner program...", maxLength: 200, section: 'Page Header', defaultValue: "SPAC's innovative smart telescope program for all skill levels." },
      { key: 'hero_image', label: 'Header Photo', hint: 'Optional: a photo at the top of the VSA page (e.g. a smart telescope setup or night sky shot).', type: 'image', section: 'Page Header' },
      { key: 'hero_photo_position', label: 'Photo Position', hint: 'Controls which part of the photo is centered in the frame. Useful when the subject is off-center.', type: 'select', section: 'Page Header', defaultValue: 'center center', options: [
        { value: 'center center', label: 'Center (default)' },
        { value: 'top center', label: 'Top' },
        { value: 'bottom center', label: 'Bottom' },
        { value: 'center left', label: 'Left' },
        { value: 'center right', label: 'Right' },
      ]},
      { key: 'what_is_vsa_heading', label: '"What is the VSA?" Heading', hint: 'The heading for the left column of the about section.', type: 'text', placeholder: 'What is the VSA?', maxLength: 80, section: '"What is the VSA?" Section', defaultValue: 'What is the VSA?' },
      { key: 'what_is_vsa_body', label: '"What is the VSA?" Body Text', hint: 'The description of the VSA program — what it is, how it works, who can participate. This replaces the default 3 paragraphs when filled in.', type: 'richtext', section: '"What is the VSA?" Section' },
      { key: 'community_heading', label: '"Join the Community" Heading', hint: 'The heading for the right column of the about section.', type: 'text', placeholder: 'Join the Community', maxLength: 80, section: '"Join the Community" Section', defaultValue: 'Join the Community' },
      { key: 'community_body', label: '"Join the Community" Body Text', hint: 'Text encouraging people to join the VSA community, shown above the Facebook button.', type: 'richtext', section: '"Join the Community" Section' },
      { key: 'facebook_url', label: 'Facebook Group URL', hint: 'The full URL to the VSA Facebook group. Example: https://www.facebook.com/groups/spacvsa', type: 'text', placeholder: 'https://www.facebook.com/groups/spacvsa', maxLength: 300, section: '"Join the Community" Section', defaultValue: 'https://www.facebook.com/groups/spacvsa' },
      { key: 'facebook_button_text', label: 'Facebook Button Label', hint: 'The text shown on the Facebook group button.', type: 'text', placeholder: 'Join VSA Facebook Group', maxLength: 60, section: '"Join the Community" Section', defaultValue: 'Join VSA Facebook Group' },
      { key: 'body', label: 'Current Targets / Additional Content', hint: 'Any additional content shown on the page — current observation targets, schedule, equipment specs, etc.', type: 'richtext', section: 'Additional Content (Optional)' },
    ],
  },
];

// ─── Field type metadata ──────────────────────────────────────────────────────

const FIELD_TYPE_META: Record<FieldType, { label: string; pillClass: string; dotClass: string }> = {
  text:     { label: 'Short Text',   pillClass: 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/20',     dotClass: 'bg-teal-400'   },
  textarea: { label: 'Paragraph',    pillClass: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20',      dotClass: 'bg-blue-400'   },
  richtext: { label: 'Rich Content', pillClass: 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/20', dotClass: 'bg-purple-400' },
  image:    { label: 'Image',        pillClass: 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/20', dotClass: 'bg-orange-400' },
  select:   { label: 'Select',       pillClass: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20',       dotClass: 'bg-cyan-400'   },
};

// Section accent colors (cycles through a palette)
const SECTION_ACCENTS = [
  'bg-indigo-400',
  'bg-teal-400',
  'bg-purple-400',
  'bg-blue-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-emerald-400',
  'bg-cyan-400',
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── Root component ───────────────────────────────────────────────────────────

export default function PageBuilderPage() {
  const [selectedPage, setSelectedPage] = useState<PageDef>(PAGES[0]);
  const [contentMap, setContentMap] = useState<Record<string, Record<string, string>>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load all page content on mount
  useEffect(() => {
    fetch('/api/admin/page-builder')
      .then(r => r.ok ? r.json() : {})
      .then(data => setContentMap(data))
      .finally(() => setLoading(false));
  }, []);

  // Ctrl+S: save all dirty fields for current page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Flush all pending save timers for the current page
        Object.entries(saveTimers.current).forEach(([k, timer]) => {
          if (k.startsWith(`${selectedPage.key}:`)) {
            clearTimeout(timer);
            const fieldKey = k.split(':')[1];
            const value = contentMap[selectedPage.key]?.[fieldKey] ?? '';
            triggerSave(selectedPage.key, fieldKey, value);
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPage.key, contentMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Immediate API call (used by Ctrl+S flush)
  const triggerSave = useCallback(async (pageKey: string, fieldKey: string, value: string) => {
    const k = `${pageKey}:${fieldKey}`;
    setSaveStatus(prev => ({ ...prev, [k]: 'saving' }));
    try {
      const res = await fetch('/api/admin/page-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, fieldKey, value }),
      });
      const next = res.ok ? 'saved' : 'error';
      setSaveStatus(prev => ({ ...prev, [k]: next }));
      if (next === 'saved') setTimeout(() => setSaveStatus(prev => ({ ...prev, [k]: 'idle' })), 2000);
    } catch {
      setSaveStatus(prev => ({ ...prev, [k]: 'error' }));
    }
  }, []);

  // Get current value for a field (db value or default)
  const val = (fieldKey: string) => {
    const dbValue = contentMap[selectedPage.key]?.[fieldKey];
    if (dbValue !== undefined && dbValue !== '') return dbValue;
    const field = selectedPage.fields.find(f => f.key === fieldKey);
    return field?.defaultValue ?? '';
  };

  // Debounced save on change
  const save = useCallback((fieldKey: string, value: string) => {
    const pageKey = selectedPage.key;
    setContentMap(prev => ({ ...prev, [pageKey]: { ...(prev[pageKey] || {}), [fieldKey]: value } }));
    const k = `${pageKey}:${fieldKey}`;
    setSaveStatus(prev => ({ ...prev, [k]: 'saving' }));
    clearTimeout(saveTimers.current[k]);
    saveTimers.current[k] = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/page-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageKey, fieldKey, value }),
        });
        const next = res.ok ? 'saved' : 'error';
        setSaveStatus(prev => ({ ...prev, [k]: next }));
        if (next === 'saved') setTimeout(() => setSaveStatus(prev => ({ ...prev, [k]: 'idle' })), 2000);
      } catch {
        setSaveStatus(prev => ({ ...prev, [k]: 'error' }));
      }
    }, 500);
  }, [selectedPage.key]);

  // Image upload
  const uploadImage = useCallback(async (fieldKey: string, file: File) => {
    const k = `${selectedPage.key}:${fieldKey}`;
    setUploadingField(k);
    try {
      const { uploadFile } = await import('@/lib/upload-file');
      const url = await uploadFile(file, selectedPage.key, fieldKey);
      save(fieldKey, url);
    } catch {
      setSaveStatus(prev => ({ ...prev, [k]: 'error' }));
    } finally {
      setUploadingField(null);
    }
  }, [selectedPage.key, save]);

  // Toggle section collapse
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Group fields by section
  const sections = selectedPage.fields.reduce<Record<string, FieldDef[]>>((acc, f) => {
    const s = f.section || 'General';
    if (!acc[s]) acc[s] = [];
    acc[s].push(f);
    return acc;
  }, {});

  // Derive overall save status for the top bar chip
  const allStatuses = Object.values(saveStatus);
  const hasError = allStatuses.some(s => s === 'error');
  const hasSaving = allStatuses.some(s => s === 'saving');
  const hasSaved = allStatuses.some(s => s === 'saved');

  return (
    <div className="flex h-[calc(100vh-7rem)] -mx-4 md:-mx-6 bg-[#08090d]">

      {/* ── Left Sidebar: Page List ─────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#06060f] border-r border-white/[0.06] overflow-y-auto">
        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Page Builder</p>
          </div>
          <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed">Click a page to edit its content</p>
        </div>

        {/* Page list */}
        <nav className="flex-1 py-2 px-2">
          {PAGES.map(page => {
            const Icon = page.icon;
            const active = selectedPage.key === page.key;
            return (
              <button
                key={page.key}
                onClick={() => setSelectedPage(page)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all group ${
                  active
                    ? 'bg-indigo-500/15 ring-1 ring-indigo-400/25 text-indigo-200'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`shrink-0 p-1.5 rounded-lg transition-all ${
                  active ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/[0.06] text-white/30 group-hover:bg-white/[0.1] group-hover:text-white/50'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-medium leading-tight truncate">{page.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Keyboard hint */}
        <div className="px-4 py-3 border-t border-white/[0.05]">
          <p className="text-[10px] text-white/20 leading-relaxed">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/40 font-mono text-[9px]">⌘S</kbd>
            {' '}saves all pending changes
          </p>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-[#08090d]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20 shrink-0">
              <selectedPage.icon className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-none truncate">{selectedPage.label}</h1>
              <p className="text-[11px] text-white/35 mt-0.5 truncate">{selectedPage.description}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {/* Global save status chip */}
            {hasError && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 ring-1 ring-red-400/25 text-red-300 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                Error saving
              </span>
            )}
            {hasSaving && !hasError && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] text-white/50 text-xs font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </span>
            )}
            {hasSaved && !hasSaving && !hasError && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25 text-emerald-300 text-xs font-semibold">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}

            {/* Preview link */}
            <a
              href={selectedPage.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 ring-1 ring-indigo-400/25 hover:ring-indigo-400/40 text-indigo-300 hover:text-indigo-200 rounded-xl text-sm font-semibold transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview Page
            </a>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-3 text-white/40">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading page content…</span>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8 pb-20 space-y-6">

              {/* Auto-save notice banner */}
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <p className="text-xs text-white/40 leading-relaxed">
                  Changes save automatically as you type. Visitors will see updates within a few seconds.
                  Use <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white/50 font-mono text-[10px]">Ctrl+S</kbd> to save immediately.
                </p>
              </div>

              {/* Sections */}
              {Object.entries(sections).map(([sectionName, fields], sectionIdx) => {
                const accentClass = SECTION_ACCENTS[sectionIdx % SECTION_ACCENTS.length];
                const isCollapsed = collapsedSections[sectionName] === true;
                const sectionKey = `${selectedPage.key}:${sectionName}`;

                return (
                  <section key={sectionName}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(sectionName)}
                      className="w-full flex items-center gap-3 mb-4 group"
                    >
                      {/* Colored accent bar */}
                      <div className={`w-1 h-5 rounded-full shrink-0 ${accentClass}`} />

                      {/* Section name */}
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60 group-hover:text-white/80 transition-colors">
                        {sectionName}
                      </span>

                      {/* Field count badge */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.07] text-white/35">
                        {fields.length}
                      </span>

                      {/* Divider line */}
                      <div className="flex-1 h-px bg-white/[0.05]" />

                      {/* Collapse toggle */}
                      <div className="shrink-0 opacity-40 group-hover:opacity-70 transition-opacity">
                        {isCollapsed
                          ? <ChevronDown className="h-4 w-4 text-white" />
                          : <ChevronUp className="h-4 w-4 text-white" />
                        }
                      </div>
                    </button>

                    {/* Fields grid */}
                    {!isCollapsed && (
                      <div className="space-y-3">
                        {fields.map(field => (
                          <FieldCard
                            key={`${sectionKey}:${field.key}`}
                            field={field}
                            value={val(field.key)}
                            isDefault={
                              (field.type === 'text' || field.type === 'textarea') &&
                              field.defaultValue !== undefined &&
                              val(field.key) === field.defaultValue &&
                              !contentMap[selectedPage.key]?.[field.key]
                            }
                            saveStatus={saveStatus[`${selectedPage.key}:${field.key}`] || 'idle'}
                            isUploading={uploadingField === `${selectedPage.key}:${field.key}`}
                            isDragOver={dragOver === `${selectedPage.key}:${field.key}`}
                            onSave={(v) => save(field.key, v)}
                            onUploadImage={(file) => uploadImage(field.key, file)}
                            onDragOver={() => setDragOver(`${selectedPage.key}:${field.key}`)}
                            onDragLeave={() => setDragOver(null)}
                            onDropImage={(file) => {
                              setDragOver(null);
                              uploadImage(field.key, file);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Field Card Component ─────────────────────────────────────────────────────

interface FieldCardProps {
  field: FieldDef;
  value: string;
  isDefault: boolean;
  saveStatus: SaveStatus;
  isUploading: boolean;
  isDragOver: boolean;
  onSave: (v: string) => void;
  onUploadImage: (file: File) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDropImage: (file: File) => void;
}

function FieldCard({
  field, value, isDefault, saveStatus, isUploading, isDragOver,
  onSave, onUploadImage, onDragOver, onDragLeave, onDropImage,
}: FieldCardProps) {
  const meta = FIELD_TYPE_META[field.type];
  const hasError = saveStatus === 'error';

  return (
    <div className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all ${
      hasError
        ? 'border-red-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]'
        : 'border-white/[0.07] hover:border-white/[0.11]'
    }`}>
      {/* Card header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-white/[0.05]">
        <div className="flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[13px] font-semibold text-white leading-none">{field.label}</span>
            {/* Type badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.pillClass}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotClass} mr-1.5 align-middle`} />
              {meta.label}
            </span>
            {isDefault && saveStatus === 'idle' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.07] text-white/35 font-medium">
                Default
              </span>
            )}
          </div>
          {/* Hint text */}
          <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{field.hint}</p>
        </div>

        {/* Save status indicator */}
        <div className="shrink-0 mt-0.5">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Field input area */}
      <div className="p-5">
        {field.type === 'text' && (
          <TextInput
            value={value}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            onChange={onSave}
          />
        )}

        {field.type === 'textarea' && (
          <TextareaInput
            value={value}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            onChange={onSave}
          />
        )}

        {field.type === 'richtext' && (
          <PageContentEditor
            value={value}
            onChange={onSave}
            placeholder={field.placeholder || `Write ${field.label.toLowerCase()} here…`}
          />
        )}

        {field.type === 'image' && (
          <ImageInput
            value={value}
            isUploading={isUploading}
            isDragOver={isDragOver}
            onUpload={onUploadImage}
            onRemove={() => onSave('')}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDropImage}
          />
        )}

        {field.type === 'select' && (
          <SelectInput
            value={value}
            options={field.options || []}
            onChange={onSave}
          />
        )}

        {hasError && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Failed to save — please try again.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────

function TextInput({
  value, placeholder, maxLength, onChange,
}: {
  value: string; placeholder?: string; maxLength?: number; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center bg-black/30 border border-white/[0.09] rounded-xl focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
        <Type className="h-3.5 w-3.5 text-white/20 ml-3.5 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 px-3 py-2.5 bg-transparent text-white/90 placeholder-white/20 text-sm focus:outline-none"
        />
      </div>
      {maxLength && (
        <p className="text-[10px] text-white/25 mt-1.5 text-right tabular-nums">
          <span className={value.length > maxLength * 0.9 ? 'text-amber-400' : ''}>{value.length}</span>
          {' / '}{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── Textarea Input ───────────────────────────────────────────────────────────

function TextareaInput({
  value, placeholder, maxLength, onChange,
}: {
  value: string; placeholder?: string; maxLength?: number; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="bg-black/30 border border-white/[0.09] rounded-xl focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
        <div className="flex items-start gap-2 px-3.5 pt-3 pb-1 border-b border-white/[0.05]">
          <AlignLeft className="h-3.5 w-3.5 text-white/20 mt-0.5 shrink-0" />
          <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wide">Paragraph</span>
        </div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full px-4 py-3 bg-transparent text-white/90 placeholder-white/20 text-sm focus:outline-none resize-y min-h-[72px]"
        />
      </div>
      {maxLength && (
        <p className="text-[10px] text-white/25 mt-1.5 text-right tabular-nums">
          <span className={value.length > maxLength * 0.9 ? 'text-amber-400' : ''}>{value.length}</span>
          {' / '}{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── Select Input ─────────────────────────────────────────────────────────────

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center bg-black/30 border border-white/[0.09] rounded-xl focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all px-3.5">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 py-2.5 bg-transparent text-white/90 text-sm focus:outline-none appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#0d1117', color: '#e2e8f0' }}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg className="h-4 w-4 text-white/30 shrink-0 pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 10.94L2.53 5.47l1.06-1.06L8 8.82l4.41-4.41 1.06 1.06z"/>
      </svg>
    </div>
  );
}

// ─── Image Input ──────────────────────────────────────────────────────────────

function ImageInput({
  value, isUploading, isDragOver,
  onUpload, onRemove, onDragOver, onDragLeave, onDrop,
}: {
  value: string;
  isUploading: boolean;
  isDragOver: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEvent = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onDrop(file);
    else onDragLeave();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  if (value && !isUploading) {
    // Preview state
    return (
      <div className="relative rounded-xl overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Current image"
          className="w-full max-h-48 object-cover rounded-xl"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all ring-1 ring-white/20">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Upload className="h-4 w-4" />
            Replace Photo
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/70 hover:bg-red-500 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all ring-1 ring-red-400/30"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    );
  }

  // Drop zone (empty or uploading)
  return (
    <div
      onDragOver={handleDragEvent}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
        isDragOver
          ? 'border-indigo-400/60 bg-indigo-500/10'
          : 'border-white/[0.12] hover:border-white/25 hover:bg-white/[0.02]'
      }`}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
        {isUploading ? (
          <>
            {/* Upload shimmer */}
            <div className="relative w-12 h-12 rounded-2xl bg-white/[0.08] flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="h-full w-[200%] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-[shimmer_1.5s_linear_infinite] -translate-x-full" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/70">Uploading photo…</p>
              <p className="text-xs text-white/30 mt-1">Please wait</p>
            </div>
          </>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isDragOver ? 'bg-indigo-500/25' : 'bg-white/[0.07]'
            }`}>
              <ImageIcon className={`h-6 w-6 transition-colors ${isDragOver ? 'text-indigo-300' : 'text-white/40'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/70">
                {isDragOver ? 'Drop to upload' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-white/30 mt-1">JPG, PNG, WEBP — max 10 MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
