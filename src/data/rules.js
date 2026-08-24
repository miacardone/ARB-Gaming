/**
 * Rule groups, rules and rule history.
 *
 * Criteria use the keys from domain/criteria.js, so the same rule that renders
 * here can be executed by Rule check and counted by Bulk actions.
 *
 * Sub-rules carry a `parentId` and sort within their parent only — the
 * reordering logic in lib/reorderRules.js enforces that.
 */

import brand from '@/brand/brand.config';
import { CURRENT_USER } from '@/data/people';

const NOW = Date.now();
const DAY = 86_400_000;
const ago = (d, h = 0) => new Date(NOW - d * DAY - h * 3_600_000).toISOString();

export const RULE_TRIGGERS = ['Case Import', 'Out of Pend', 'Rule Action', 'Inbound Correspondence', 'Document Received'];

export const RULE_GROUPS = [
  { id: 'rg1', name: 'Due Dates Rule Group', triggeredBy: 'Case Import', enabled: true, description: 'Sets internal due dates by scheme and cycle as cases are imported.', updatedAt: ago(3), updatedBy: CURRENT_USER.email },
  { id: 'rg2', name: '00_Case Creation', triggeredBy: 'Case Import', enabled: true, description: 'Initial routing and enrichment applied as cases are created.', updatedAt: ago(1, 4), updatedBy: CURRENT_USER.email },
  { id: 'rg3', name: '00_Queue Rules', triggeredBy: 'Rule Action', enabled: true, description: 'Assigns cases to queues by scheme, value and reason code.', updatedAt: ago(6), updatedBy: CURRENT_USER.email },
  { id: 'rg4', name: '01_Incoming Documents', triggeredBy: 'Inbound Correspondence', enabled: true, description: `Matches and routes inbound issuer memos and ${brand.terms.seller} session logs.`, updatedAt: ago(11), updatedBy: CURRENT_USER.email },
  { id: 'rg5', name: '01_Out Of Pend', triggeredBy: 'Out of Pend', enabled: false, description: 'Re-evaluates cases as they come out of a pend state.', updatedAt: ago(48), updatedBy: CURRENT_USER.email },
];

/**
 * `sortOrder` is the display order within a group. Sub-rules use decimal
 * numbering derived at render time from their parent's position.
 */
export const RULES = [
  /* --- rg2 Case Creation ------------------------------------------------ */
  {
    id: 'r1', groupId: 'rg2', parentId: null, sortOrder: 1, enabled: true,
    name: 'Route non-receipt disputes',
    description: 'Non-receipt reason codes across both intake paths land in one queue.',
    criteria: [{ key: 'reasonCodes', values: ['13.1', '4855', 'C08', 'never_arrived'] }],
    actions: [{ key: 'route_queue', value: 'not_received' }],
    impact: 0, runCount: 4120, lastRunAt: ago(0, 2),
  },
  {
    id: 'r2', groupId: 'rg2', parentId: null, sortOrder: 2, enabled: true,
    name: 'High value to senior queue',
    description: 'Anything at or above the routing threshold gets a senior reviewer.',
    criteria: [{ key: 'transactionAmount', operator: 'is greater than', value: String(brand.thresholds.routingHighValue) }],
    actions: [{ key: 'route_queue', value: 'high_value' }, { key: 'assign_reviewer', value: CURRENT_USER.email }],
    impact: 0, runCount: 1880, lastRunAt: ago(0, 1),
  },
  {
    id: 'r2a', groupId: 'rg2', parentId: 'r2', sortOrder: 1, enabled: true,
    name: 'Confirmed fraud sub-rule',
    description: 'High-value cases with a confirmed fraud marker also notify fraud ops.',
    criteria: [{ key: 'fraud', values: ['Confirmed Fraud'] }],
    actions: [{ key: 'notify', value: null }],
    impact: 0, runCount: 310, lastRunAt: ago(1),
  },
  {
    id: 'r3', groupId: 'rg2', parentId: null, sortOrder: 3, enabled: true,
    name: 'Unauthorized access to account integrity',
    description: 'Account-takeover claims need a reviewer trained on device and session evidence, not the general queue.',
    criteria: [{ key: 'reasonCodes', values: ['counterfeit'] }],
    actions: [{ key: 'route_queue', value: 'counterfeit' }, { key: 'assign_skill', value: 'Account Takeover Review' }],
    impact: 0, runCount: 640, lastRunAt: ago(0, 6),
  },
  {
    id: 'r4', groupId: 'rg2', parentId: null, sortOrder: 4, enabled: false,
    name: 'Post-restriction charges to compliance',
    description: 'Paused pending the self-exclusion register feed.',
    criteria: [{ key: 'reasonCodes', values: ['wrong_item'] }],
    actions: [{ key: 'route_queue', value: 'logistics' }],
    impact: 0, runCount: 0, lastRunAt: null,
  },

  /* --- rg1 Due dates ----------------------------------------------------- */
  {
    id: 'r5', groupId: 'rg1', parentId: null, sortOrder: 1, enabled: true,
    name: 'Scheme response window',
    description: 'Applies the network window minus the internal buffer.',
    criteria: [{ key: 'cardScheme', values: brand.schemes.map((s) => s.id) }],
    actions: [{ key: 'notify', value: null }],
    impact: 0, runCount: 8800, lastRunAt: ago(0, 1),
  },
  {
    id: 'r6', groupId: 'rg1', parentId: null, sortOrder: 2, enabled: true,
    name: 'Compress pre-arbitration clock',
    description: 'Pre-arb and second cycle get a tighter internal deadline.',
    criteria: [{ key: 'reasonCodes', values: ['13.3', '4853'] }],
    actions: [{ key: 'route_queue', value: 'second_cycle' }],
    impact: 0, runCount: 1210, lastRunAt: ago(0, 3),
  },

  /* --- rg3 Queue rules ---------------------------------------------------- */
  {
    id: 'r7', groupId: 'rg3', parentId: null, sortOrder: 1, enabled: true,
    name: 'Missing documents holding queue',
    description: 'Cases with no evidence wait where they can be chased.',
    criteria: [{ key: 'documentFields', values: ['missing'] }],
    actions: [{ key: 'route_queue', value: 'no_docs' }],
    impact: 0, runCount: 2260, lastRunAt: ago(0, 5),
  },
  {
    id: 'r8', groupId: 'rg3', parentId: null, sortOrder: 2, enabled: true,
    name: 'Auto represent low value with evidence',
    description: 'Small, well-evidenced cases are submitted without an analyst — below this line the handling cost exceeds the recovery.',
    criteria: [
      { key: 'transactionAmount', operator: 'is less than', value: '40' },
      { key: 'documentFields', values: ['received'] },
    ],
    actions: [{ key: 'auto_represent', value: null }],
    impact: 0, runCount: 705, lastRunAt: ago(1, 2),
  },
  {
    id: 'r9', groupId: 'rg3', parentId: null, sortOrder: 3, enabled: true,
    name: 'Ageing cases to supervisor',
    description: 'Anything older than 21 days goes up a level.',
    criteria: [{ key: 'caseAge', operator: 'is greater than', value: '21' }],
    actions: [{ key: 'route_queue', value: 'supervisor' }],
    impact: 0, runCount: 990, lastRunAt: ago(0, 8),
  },

  /* --- rg4 Documents ------------------------------------------------------ */
  {
    id: 'r10', groupId: 'rg4', parentId: null, sortOrder: 1, enabled: true,
    name: 'Match inbound documents',
    description: 'Attaches inbound issuer correspondence and studio session logs to an open case.',
    criteria: [{ key: 'documentFields', values: ['pending'] }],
    actions: [{ key: 'notify', value: null }],
    impact: 0, runCount: 3400, lastRunAt: ago(0, 1),
  },
  {
    id: 'r11', groupId: 'rg4', parentId: null, sortOrder: 2, enabled: true,
    name: `Notify on ${brand.terms.seller} evidence`,
    description: `Tells the owner when ${brand.terms.seller} evidence lands.`,
    criteria: [{ key: 'documentFields', values: ['received'] }],
    actions: [{ key: 'email_seller', value: null }],
    impact: 0, runCount: 1580, lastRunAt: ago(0, 4),
  },

  /* --- rg5 Retired -------------------------------------------------------- */
  {
    id: 'r12', groupId: 'rg5', parentId: null, sortOrder: 1, enabled: false,
    name: 'Legacy acquirer mapping',
    description: 'Superseded by the acquirer feed change.',
    criteria: [{ key: 'cardScheme', values: ['visa'] }],
    actions: [{ key: 'notify', value: null }],
    impact: 0, runCount: 0, lastRunAt: null,
  },
];

export const RULE_HISTORY = [
  { id: 'h1', ruleId: 'r2', type: 'Criteria changed', detail: `Threshold raised to ${brand.thresholds.routingHighValue}.`, user: CURRENT_USER.email, timestamp: ago(6) },
  { id: 'h2', ruleId: 'r2', type: 'Action added', detail: 'Added "Assign Reviewer".', user: CURRENT_USER.email, timestamp: ago(20) },
  { id: 'h3', ruleId: 'r2', type: 'Rule created', detail: 'Created in group "00_Case Creation".', user: CURRENT_USER.email, timestamp: ago(64) },
  { id: 'h4', ruleId: 'r1', type: 'Criteria changed', detail: `Added the ${brand.terms.marketplace} claim reason so both paths route together.`, user: CURRENT_USER.email, timestamp: ago(9) },
  { id: 'h5', ruleId: 'r1', type: 'Rule created', detail: 'Created in group "00_Case Creation".', user: CURRENT_USER.email, timestamp: ago(70) },
  { id: 'h6', ruleId: 'r4', type: 'Rule disabled', detail: 'Paused pending the self-exclusion register feed.', user: CURRENT_USER.email, timestamp: ago(48) },
  { id: 'h7', ruleId: 'r8', type: 'Criteria changed', detail: 'Now requires documents received before auto-representing.', user: CURRENT_USER.email, timestamp: ago(14) },
  { id: 'h8', ruleId: 'r3', type: 'Action added', detail: 'Added "Assign to User With Skill".', user: CURRENT_USER.email, timestamp: ago(30) },
];

export const rulesForGroup = (groupId) => RULES.filter((r) => r.groupId === groupId);
export const historyForRule = (ruleId) =>
  RULE_HISTORY.filter((h) => h.ruleId === ruleId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
