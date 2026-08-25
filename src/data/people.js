/**
 * People, roles, groups and skills.
 *
 * TENANT LEAK CONVERTED: the reference hard-coded real-looking addresses at
 * external domains and role names including "Chargeback Analyst". Here every
 * address is built from `brand.emailDomain` and the analyst role label comes
 * from `brand.terms.analyst`, so a tenant swap renames the whole directory.
 *
 * `market` holds a US state code, matching `brand.markets` — the demo team is
 * distributed the way an American operator's dispute team actually is, with the
 * bench concentrated in the HQ state.
 */

import brand from '@/brand/brand.config';
import { titleCase } from '@/utils/format';

const email = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${brand.emailDomain}`;
const initialsOf = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const ROLES = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrator role with full access and elevated capabilities.',
    dateCreated: '2023-04-11',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage users, queues and reporting across the team.',
    dateCreated: '2023-01-15',
  },
  {
    id: 'analyst',
    name: brand.terms.analyst,
    description: `Work and respond to disputes assigned by skill.`,
    dateCreated: '2023-06-30',
  },
];

export const GROUPS = [
  { id: 'g1', name: 'Main Group', description: 'Primary dispute operations team.', dateCreated: '2023-03-30' },
  { id: 'g2', name: 'Escalations', description: 'Handles supervisor and high-value escalations.', dateCreated: '2023-07-06' },
  { id: 'g3', name: 'Account Integrity', description: 'Account-takeover escalations and device-fraud referrals.', dateCreated: '2024-02-15' },
  { id: 'g4', name: 'Weekend Cover', description: 'Analysts covering weekend reply-by deadlines.', dateCreated: '2024-05-02' },
];

export const SKILLS = [
  {
    id: 's1',
    name: 'All Dispute Response',
    criteria: 'Card Scheme is not [blank]',
    description: 'Allows all analysts to respond to disputes in due-date order.',
  },
  {
    id: 's2',
    name: `${brand.terms.claimProgram} Response`,
    criteria: `Queue is ${brand.terms.claimProgram}`,
    description: `${titleCase(brand.terms.claim)}s with no card leg.`,
  },
  {
    id: 's3',
    name: 'High Value Access',
    criteria: 'Queue is High Value Disputes',
    description: 'For analysts allowed to work disputes above the risk amount.',
  },
  {
    id: 's4',
    name: 'Pre-Arbitration',
    criteria: 'Dispute Cycle is Pre-Arbitration or 2nd Chargeback',
    description: 'Authorized to file second presentments and pre-arb responses.',
  },
  {
    id: 's5',
    name: 'Account Takeover Review',
    criteria: 'Claim Reason is Unauthorized account access',
    description: 'Trained to read device, geo and session evidence on ATO claims.',
  },
];

export const SKILL_OPTIONS = SKILLS.map((s) => s.name);

const SEED = [
  { id: 'u1', name: 'Monica Baker', roleId: 'admin', group: '-', status: 'Active', confirmation: 'Confirmed', startDate: '2022-04-11', market: 'FL' },
  { id: 'u2', name: 'Marcus Whitfield', roleId: 'admin', group: 'Main Group', status: 'Active', confirmation: 'Confirmed', startDate: '2022-10-17', market: 'FL' },
  { id: 'u3', name: 'Danielle Okafor', roleId: 'manager', group: 'Main Group', status: 'Active', confirmation: 'Confirmed', startDate: '2023-04-07', market: 'GA' },
  { id: 'u4', name: 'Travis Bergeron', roleId: 'manager', group: 'Escalations', status: 'Active', confirmation: 'Confirmed', startDate: '2023-06-30', market: 'TX' },
  { id: 'u5', name: 'Sierra Delgado', roleId: 'analyst', group: 'Main Group', status: 'Active', confirmation: 'Confirmed', startDate: '2023-06-22', market: 'FL' },
  { id: 'u6', name: 'Brandon Hollis', roleId: 'analyst', group: 'Main Group', status: 'Active', confirmation: 'Force Change Password', startDate: '2023-06-23', market: 'NC' },
  { id: 'u7', name: 'Jasmine Pritchard', roleId: 'analyst', group: 'Account Integrity', status: 'Active', confirmation: 'Confirmed', startDate: '2023-06-23', market: 'FL' },
  { id: 'u8', name: 'Cody Vandenberg', roleId: 'analyst', group: 'Account Integrity', status: 'Inactive', confirmation: 'Confirmed', startDate: '2023-08-26', market: 'AZ' },
  { id: 'u9', name: 'Alicia Reyes', roleId: 'analyst', group: 'Escalations', status: 'Active', confirmation: 'Confirmed', startDate: '2023-06-23', market: 'TX' },
  { id: 'u10', name: 'Devin Blackwell', roleId: 'analyst', group: 'Main Group', status: 'Active', confirmation: 'Confirmed', startDate: '2023-06-23', market: 'OH' },
  { id: 'u11', name: 'Kelsey Nakamura', roleId: 'analyst', group: 'Weekend Cover', status: 'Active', confirmation: 'Confirmed', startDate: '2024-02-15', market: 'CA' },
  { id: 'u12', name: 'Andre Tillman', roleId: 'analyst', group: 'Weekend Cover', status: 'Active', confirmation: 'Confirmed', startDate: '2024-09-01', market: 'IL' },
  /* Leadership — ARB's actual executive team, seated as admins.
   *
   * They deliberately carry roleId 'admin' with group '-', which keeps them out
   * of the case-queue rotation (see ASSIGNABLE below). That matters: it means
   * no fabricated handle time, case count or win rate is ever attributed to a
   * named real person. The operational staff above, who do carry those numbers,
   * are invented.
   *
   * Start dates track the company: founded 2022, PCH brought in later. */
  { id: 'u13', name: 'Junwei Ye', roleId: 'admin', group: '-', status: 'Active', confirmation: 'Confirmed', startDate: '2022-01-15', market: 'FL' },
  { id: 'u14', name: 'Patrick Fechtmeyer', roleId: 'admin', group: '-', status: 'Active', confirmation: 'Confirmed', startDate: '2022-01-15', market: 'FL' },
  { id: 'u15', name: 'Dan Marks', roleId: 'admin', group: '-', status: 'Active', confirmation: 'Confirmed', startDate: '2022-06-01', market: 'NY' },
  { id: 'u16', name: 'David Jumper', roleId: 'admin', group: '-', status: 'Active', confirmation: 'Confirmed', startDate: '2023-01-15', market: 'FL' },
];

export const USERS = SEED.map((u, i) => ({
  ...u,
  email: email(u.name),
  initials: initialsOf(u.name),
  role: ROLES.find((r) => r.id === u.roleId)?.name ?? u.roleId,
  lockStatus: i === 7 ? 'Locked' : 'Unlocked',
  skills:
    u.roleId === 'admin'
      ? SKILL_OPTIONS
      : u.roleId === 'manager'
        ? [SKILL_OPTIONS[0], SKILL_OPTIONS[2], SKILL_OPTIONS[3]]
        : [SKILL_OPTIONS[0], SKILL_OPTIONS[1]],
}));

/** Only active analysts and managers take case assignments. */
export const ASSIGNABLE = USERS.filter((u) => u.status === 'Active' && u.roleId !== 'admin');

export const WORKER_OPTIONS = ASSIGNABLE.map((u) => u.email);
export const REVIEWER_OPTIONS = USERS.filter((u) => u.roleId !== 'analyst').map((u) => u.email);

export const getUser = (id) => USERS.find((u) => u.id === id) ?? null;
export const userByEmail = (e) => USERS.find((u) => u.email === e) ?? null;

/** The signed-in demo operator. */
export const CURRENT_USER = {
  ...USERS[1],
  roleLabel: 'Admin',
};

export const USER_GROUPS = ['-', ...GROUPS.map((g) => g.name)];
export const USER_STATUSES = ['Active', 'Inactive'];
