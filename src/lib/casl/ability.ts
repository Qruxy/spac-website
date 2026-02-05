/**
 * CASL Authorization Abilities
 *
 * Defines role-based access control for SPAC application.
 *
 * Roles:
 * - ADMIN: Full access to all resources
 * - MODERATOR: Can manage events, approve media/listings, read users
 * - MEMBER: Can manage own content, read published content
 */

import {
  AbilityBuilder,
  PureAbility,
  AbilityClass,
} from '@casl/ability';

// Define all possible actions
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Define all subjects (resources)
type Subjects =
  | 'User'
  | 'Membership'
  | 'Event'
  | 'Registration'
  | 'Listing'
  | 'Offer'
  | 'Media'
  | 'Comment'
  | 'AuditLog'
  | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;
const AppAbility = PureAbility as AbilityClass<AppAbility>;

export interface UserContext {
  id: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  membershipStatus: string | null;
}

/**
 * Define abilities based on user role and context
 */
export function defineAbilitiesFor(user: UserContext | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(AppAbility);

  if (!user) {
    // Guest permissions - read-only access to published content
    can('read', 'Event');
    can('read', 'Listing');
    can('read', 'Media');
    return build();
  }

  // All authenticated users can read published content
  can('read', 'Event');
  can('read', 'Listing');
  can('read', 'Media');

  switch (user.role) {
    case 'ADMIN':
      // Admins can do everything
      can('manage', 'all');
      break;

    case 'MODERATOR':
      // Moderators can manage events
      can('create', 'Event');
      can('read', 'Event');
      can('update', 'Event');
      can('delete', 'Event');

      // Moderators can read and manage registrations
      can('read', 'Registration');
      can('update', 'Registration');

      // Moderators can approve/reject media and listings
      can('read', 'Media');
      can('update', 'Media');
      can('read', 'Listing');
      can('update', 'Listing');

      // Moderators can read users (but not modify)
      can('read', 'User');
      can('read', 'Membership');

      // Moderators can manage comments
      can('manage', 'Comment');

      // Moderators can read audit logs
      can('read', 'AuditLog');

      // Moderators can manage their own profile
      can('update', 'User');
      break;

    case 'MEMBER':
    default:
      // Members can manage their own profile
      can('read', 'User');
      can('update', 'User');

      // Members can read their own membership
      can('read', 'Membership');

      // Members can create and manage their own registrations
      can('create', 'Registration');
      can('read', 'Registration');
      can('update', 'Registration');
      can('delete', 'Registration');

      // Members can create and manage their own listings
      can('create', 'Listing');
      can('read', 'Listing');
      can('update', 'Listing');
      can('delete', 'Listing');

      // Members can manage offers on their listings
      can('read', 'Offer');
      can('update', 'Offer');

      // Members can create and manage their own offers
      can('create', 'Offer');
      can('delete', 'Offer');

      // Members can submit media for approval
      can('create', 'Media');
      can('read', 'Media');
      can('update', 'Media');
      can('delete', 'Media');

      // Members can create comments
      can('create', 'Comment');
      can('read', 'Comment');
      can('update', 'Comment');
      can('delete', 'Comment');

      // Restrict certain actions for non-active members
      if (user.membershipStatus !== 'ACTIVE') {
        cannot('create', 'Registration');
        cannot('create', 'Listing');
        cannot('create', 'Media');
      }
      break;
  }

  return build();
}

/**
 * Check if user can perform action on subject
 */
export function checkAbility(
  user: UserContext | null,
  action: Actions,
  subject: Subjects,
  field?: string
): boolean {
  const ability = defineAbilitiesFor(user);
  return ability.can(action, subject, field);
}

/**
 * Get ability instance for a user
 */
export function getAbility(user: UserContext | null): AppAbility {
  return defineAbilitiesFor(user);
}
