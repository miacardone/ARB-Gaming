/**
 * WHITE-LABEL CONTROL FILE
 * ========================
 * Everything tenant-specific lives here: palette, wordmark, logo path,
 * currency, locale, timezone, vocabulary, reason codes, entities, queues,
 * due-date offsets and feature flags.
 *
 * THE RULE: no component may hard-code a color, a brand name, or any
 * tenant-specific value. Colors reach the DOM as CSS custom properties written
 * by BrandProvider; nouns reach the JSX through `terms`; the logo reaches the
 * DOM as a *path*, never an import.
 *
 * This rule has been broken before by a lookup table keyed on tenant data — an
 * entity-weight map naming the first tenant's own entity ids, which silently
 * produced entity-less cases the moment a second tenant generated. So: any map,
 * weight table or constant keyed by tenant values belongs in this file and must
 * be derived positionally from the tenant's own lists, never named literally.
 * See ENTITY_WEIGHTS in data/cases.js for how that is done.
 */

/* ------------------------------------------------------------------ *
 * Scheme reason codes — US market, US spelling
 * ------------------------------------------------------------------ *
 * `category` drives the reason-category rollups on Reports center, so every
 * code carries one of: fraud | authorization | processing | consumer.
 *
 * The mix is chosen for a digital-goods merchant under MCC 7995: card-absent
 * fraud and "services not received" dominate, and there is no card-present
 * family here at all.
 */

const VISA_REASON_CODES = [
  { code: '10.4', label: 'Other Fraud — Card Absent Environment', category: 'fraud' },
  { code: '11.2', label: 'Declined Authorization', category: 'authorization' },
  { code: '11.3', label: 'No Authorization', category: 'authorization' },
  { code: '12.5', label: 'Incorrect Amount', category: 'processing' },
  { code: '12.6.2', label: 'Duplicate Processing', category: 'processing' },
  { code: '13.1', label: 'Merchandise/Services Not Received', category: 'consumer' },
  { code: '13.2', label: 'Canceled Recurring Transaction', category: 'consumer' },
  { code: '13.3', label: 'Not as Described or Defective Merchandise', category: 'consumer' },
  { code: '13.6', label: 'Credit Not Processed', category: 'consumer' },
  { code: '13.7', label: 'Canceled Merchandise/Services', category: 'consumer' },
];

const MASTERCARD_REASON_CODES = [
  { code: '4837', label: 'No Cardholder Authorization', category: 'fraud' },
  { code: '4840', label: 'Fraudulent Processing of Transactions', category: 'fraud' },
  { code: '4834', label: 'Point-of-Interaction Error', category: 'processing' },
  { code: '4842', label: 'Late Presentment', category: 'processing' },
  { code: '4853', label: 'Cardholder Dispute — Goods or Services Not as Described', category: 'consumer' },
  { code: '4855', label: 'Goods or Services Not Provided', category: 'consumer' },
  { code: '4860', label: 'Credit Not Processed', category: 'consumer' },
];

const AMEX_REASON_CODES = [
  { code: 'C08', label: 'Goods/Services Not Received or Only Partially Received', category: 'consumer' },
  { code: 'C31', label: 'Goods/Services Not as Described', category: 'consumer' },
  { code: 'F24', label: 'No Cardmember Authorization', category: 'fraud' },
  { code: 'F29', label: 'Card Not Present', category: 'fraud' },
];

export const REASON_CATEGORIES = [
  { id: 'fraud', label: 'Fraud' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'processing', label: 'Processing error' },
  { id: 'consumer', label: 'Consumer dispute' },
];

/* ------------------------------------------------------------------ *
 * Tenant: ARB Gaming
 * ------------------------------------------------------------------ *
 * ARB Gaming (American Real Brands) is a US social+ gaming operator running
 * Modo Casino and the Publishers Clearing House free-to-play games. That shapes
 * every choice below:
 *
 *   · Digital goods, credited instantly — there is no shipment, so the
 *     "delivery" vocabulary is about crediting Gold Coins to an account.
 *   · Free-to-play sweepstakes, not real-money gambling — the second intake
 *     path is Player Protection, not a licensed-operator complaints process.
 *   · US only. USD, en-US, America/New_York, and `markets` holds STATE codes
 *     rather than country codes, because that is the axis an American operator
 *     actually reports on.
 */

export const arbBrand = {
  id: 'arb',
  name: 'ARB Gaming',
  productName: 'Dispute Console',
  legalName: 'ARB Gaming, LLC',
  shortName: 'ARB',
  tagline: 'Card chargebacks and player claims in one operational queue.',
  supportEmail: 'disputes@arbgaming.example',
  emailDomain: 'arbgaming.example',
  /** HQ is Miami — this tenant's due-date timezone, locale and demo staff all key off it. */
  address: '78 SW 7th Street, Miami, FL 33130',
  hqCity: 'Miami',
  department: 'Payments Risk & Dispute Resolution',

  /** Path only — never imported into a component. Served from /public. */
  logo: '/tenant-arb.svg',

  /** Full lockup (symbol + wordtype baked into one asset), white-on-transparent
   * — used in place of the icon+text combo wherever the surface is dark, which
   * for this build is the nav rail and the sign-in panel. This is the client's
   * own artwork, unmodified apart from a viewBox trim; see the comment at the
   * top of the SVG. */
  wordmarkImage: '/arb-wordmark.svg',
  wordmarkImageRatio: 263.3 / 42.2,

  wordmark: { text: 'ARB', accent: 'Gaming', weight: 700 },

  /* --- Palette ---------------------------------------------------------- *
   * `primary` and `navActive` are SAMPLED from ARB's own published assets, not
   * invented: #5C1BF9 is the flat violet of their app webclip, #3A11B0 and
   * #8A5EFF are the deep purple and violet accent from arbinteractive.com. The
   * app tile in /public carries the same #5C1BF9, so the favicon and the
   * document letterhead can never disagree with the UI around them.
   *
   * Checked: #5C1BF9 gives 7.05:1 against white, so button and pill labels pass
   * AA; #8A5EFF gives 4.63:1 on the rail.
   *
   * The near-black surface below is an interpretation rather than a sampled
   * value — social+ gaming sits closer to entertainment software than to a
   * sportsbook, and the palette says so, rather than reaching for casino red. */
  colors: {
    primary: '#5C1BF9',
    primaryDeep: '#3A11B0',
    primaryTint: '#E7E0FE',
    primaryWash: '#F6F3FF',

    /* Nav rail is its own token pair: dark for this tenant, but a light-chrome
       tenant swaps these without touching a component. #231839 is the exact
       surface arbinteractive.com sits on. */
    navRail: '#231839',
    navRailDeep: '#180F28',
    navActive: '#8A5EFF',
    navInk: '#E9E4F2',
    navInkMuted: '#9C8FB4',

    ink: '#171223',
    inkMuted: '#5F5674',
    inkSubtle: '#8C849E',
    canvas: '#F7F5FB',
    surface: '#FFFFFF',
    surfaceSunken: '#FBFAFD',
    line: '#E6E2EF',
    lineStrong: '#CFC8DD',

    success: '#1F7A4D',
    successTint: '#E3F3EA',
    warning: '#8A5D00',
    warningTint: '#FBF0DC',
    danger: '#B3261E',
    dangerTint: '#FBE9E7',
    info: '#3B5FA5',
    infoTint: '#EAEFF8',


    schemeVisa: '#1A1F71',
    schemeMastercard: '#C8102E',
    schemeAmex: '#016FD0',
  },

  /* --- Chart ramp ------------------------------------------------------- *
   * ONE HUE PLUS TINTS, not a rainbow. Five steps of the brand violet from the
   * deep rail color to a pale tint, plus a single contrast color reserved for
   * the "other" bucket and for negative series (rejected, lost, failed).
   *
   * Separation here comes from LIGHTNESS rather than hue, which is why a
   * single-hue ramp survives color-vision deficiency and greyscale printing at
   * least as well as the multi-hue ramp it replaced — the steps stay
   * distinguishable when hue information is removed entirely. Measured L* on
   * this ramp: 37.7 / 52.5 / 69.7 / 86.9 — even steps of 15-17.
   *
   * Assign in fixed order and never cycle. A sixth category folds into
   * "Other" and takes chartContrast. */
  chartSeries: ['#5C1BF9', '#8A5EFF', '#B49BFF', '#DED4FE', '#171223'],
  chartContrast: '#B3261E',
  chartNeutral: '#847C93',

  /* --- Two-way split ------------------------------------------------------ *
   * A single-hue ramp is right for ordered many-category data, where the
   * reader is comparing magnitudes down a legend. It is WRONG for a two-way
   * split — chargeback vs claim — because the two series land on adjacent
   * steps of one hue and collapse into each other. Measured on the ramp's own
   * first two steps: CIEDE2000 of 15 under normal vision and 15 again under
   * every simulated colour-vision deficiency. That is not a distinction.
   *
   * So a binary split gets HUE separation, and it comes from ARB's own two
   * brand hues: violet against the CTA cyan. The cyan is darkened from
   * #28E0E0 to #169898 because the published value is 1.64:1 on white — right
   * on their dark site, invisible on a white card. #169898 keeps the hue and
   * clears 3.51:1, the WCAG floor for a graphical object.
   *
   * Against the violet it measures CIEDE2000 42 normal / 37 protanopia /
   * 29 deuteranopia. Tritanopia is the weak axis at 17, because violet and
   * cyan both collapse toward blue there — so LineChart dashes the second
   * series as well as recolouring it, and colour is never the only cue. */
  chartDuo: ['#5C1BF9', '#169898'],

  /* --- Money, locale, markets ------------------------------------------- *
   * `markets` are US STATE codes. The list is the sweepstakes-eligible spread
   * an operator like this actually runs in — WA, ID, MI and NV are absent on
   * purpose, because promotional-sweepstakes play is not offered there. */
  currency: 'USD',
  locale: 'en-US',
  timezone: 'America/New_York',
  markets: ['FL', 'TX', 'CA', 'NY', 'GA', 'NC', 'OH', 'PA', 'IL', 'AZ', 'CO', 'NJ'],

  /* --- What System preferences may be switched to ------------------------ *
   * TENANT LEAK CONVERTED: the reference baked a European currency, locale and
   * timezone list into the page component, so a US tenant could not find its
   * own timezone in its own dropdown. The offer list belongs to the tenant. */
  preferenceOptions: {
    currencies: ['USD', 'CAD'],
    locales: ['en-US', 'es-US', 'en-CA'],
    timezones: [
      { value: 'America/New_York', label: 'America/New_York (ET, HQ)' },
      { value: 'America/Chicago', label: 'America/Chicago (CT)' },
      { value: 'America/Denver', label: 'America/Denver (MT)' },
      { value: 'America/Phoenix', label: 'America/Phoenix (MST, no DST)' },
      { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
      { value: 'UTC', label: 'UTC' },
    ],
  },

  /* --- Vocabulary -------------------------------------------------------- *
   * ARB is a social casino, not a peer marketplace, so the marketplace-shaped
   * nouns are remapped the same way the PCH tenant remaps them for a
   * sweepstakes property: same domain model, different words.
   *
   * The three "fulfillment" labels at the bottom exist because a digital-goods
   * merchant has no shipment. A physical tenant reads them as Carrier /
   * Tracking / Condition; this tenant reads them as how and whether coins
   * reached the account. Components render the label, never the noun. */
  terms: {
    case: 'case',
    cases: 'cases',
    chargeback: 'chargeback',
    chargebacks: 'chargebacks',
    claim: 'player claim',
    claims: 'player claims',
    claimProgram: 'Player Protection',
    buyer: 'player',
    buyers: 'players',
    seller: 'game studio',
    sellers: 'game studios',
    order: 'purchase',
    item: 'game',
    entity: 'brand',
    analyst: 'Dispute Specialist',
    analysts: 'Dispute Specialists',
    queue: 'queue',
    marketplace: 'platform',

    /* Fulfillment vocabulary — see note above. */
    marketLabel: 'State',
    itemPriceLabel: 'Purchase value',
    conditionLabel: 'Coin credit state',
    deliveryLabel: 'Credit method',
    deliveryRefLabel: 'Credit reference',
    feeLabel: 'Processing fee',
  },

  /** Case-ID numbering, editable from System preferences. `orderPrefix` is the
   *  tenant's own reference for the thing that was bought — PUR for a coin
   *  purchase, TOK for a token bundle — so the book never shows a generic
   *  "ORD-" that belongs to nobody. */
  numbering: { prefix: 'ARB', separator: '-', digits: 6, nextSequence: 620000, orderPrefix: 'PUR' },

  /* --- Entities ----------------------------------------------------------- *
   * The three consumer-facing properties ARB runs. Each has its own MID because
   * each settles separately, which is what makes the entity rollups on Alerts
   * and Reports mean anything. */
  entities: [
    { id: 'modo', label: 'Modo Casino', descriptor: 'Social casino — Gold Coin purchases', mid: '7995100024' },
    { id: 'modo_live', label: 'Modo Live', descriptor: 'Live dealer studio', mid: '7995100081' },
    { id: 'pch_games', label: 'PCH Games', descriptor: 'Publishers Clearing House free-to-play', mid: '7995100147' },
  ],

  /* --- Card schemes -------------------------------------------------------- */
  schemes: [
    { id: 'visa', label: 'Visa', short: 'VI', colorKey: 'schemeVisa', binPrefix: '4', reasonCodes: VISA_REASON_CODES },
    { id: 'mastercard', label: 'Mastercard', short: 'MC', colorKey: 'schemeMastercard', binPrefix: '5', reasonCodes: MASTERCARD_REASON_CODES },
    { id: 'amex', label: 'Amex', short: 'AX', colorKey: 'schemeAmex', binPrefix: '3', reasonCodes: AMEX_REASON_CODES },
  ],

  cardTypes: ['Credit', 'Debit', 'Prepaid', 'Corporate'],

  cycles: [
    { id: 'first_cb', label: '1st Chargeback', short: '1st CB' },
    { id: 'second_cb', label: '2nd Chargeback', short: '2nd CB' },
    { id: 'pre_arb', label: 'Pre-Arbitration', short: 'Pre-Arb' },
    { id: 'retrieval', label: 'Retrieval', short: 'Retr' },
    { id: 'rfi', label: 'RFI', short: 'RFI' },
  ],

  /** Player Protection claim reasons — the non-card intake path.
   *  These are the five things players actually escalate on a social casino:
   *  coins that never landed, a round that voided mid-spin, a disputed outcome,
   *  someone else in the account, and a charge that cleared after the player
   *  self-excluded — the last of which is a responsible-gaming matter, not a
   *  payments one, and routes accordingly. */
  claimReasons: [
    { id: 'not_as_described', label: 'Game outcome disputed', category: 'consumer' },
    { id: 'never_arrived', label: 'Gold Coins not credited', category: 'consumer' },
    { id: 'counterfeit', label: 'Unauthorized account access', category: 'fraud' },
    { id: 'damaged', label: 'Game malfunction — round voided', category: 'consumer' },
    { id: 'wrong_item', label: 'Charged after self-exclusion', category: 'consumer' },
  ],

  paymentMethods: ['Card', 'Apple Pay', 'Google Pay', 'PayPal', 'ACH Bank Transfer', 'Trustly', 'Venmo'],

  mccs: [
    { code: '7995', label: 'Betting, Casino Gaming Chips and Lottery Tickets' },
    { code: '7994', label: 'Video Game Arcades and Establishments' },
    { code: '5816', label: 'Digital Goods — Games' },
    { code: '5815', label: 'Digital Goods — Media, Books, Movies, Music' },
    { code: '7999', label: 'Recreation Services — Not Elsewhere Classified' },
  ],

  acquirers: ['Nuvei', 'Worldpay', 'Fiserv'],

  /* --- Queues -------------------------------------------------------------- *
   * Queue ids are shared across tenants by design (data/cases.js routes into
   * them by id) — only the label and description change here. */
  queues: [
    { id: 'all_chargebacks', label: 'All Chargebacks', description: 'Landing queue for every inbound chargeback.', sla: 24 },
    { id: 'buyer_protection', label: 'Player Protection', description: 'In-platform player claims with no card leg.', sla: 72 },
    { id: 'second_cycle', label: '2nd Cycle Chargeback', description: 'Second presentments and pre-arbitration.', sla: 16 },
    { id: 'high_value', label: 'High Value Disputes', description: 'Cases above the configured risk amount.', sla: 24 },
    { id: 'counterfeit', label: 'Unauthorized Account Use', description: 'Account-takeover and unauthorized-purchase escalations.', sla: 36 },
    { id: 'not_received', label: 'Coins Not Credited', description: 'Purchases that never reached the player balance.', sla: 48 },
    { id: 'logistics', label: 'Responsible Gaming Review', description: 'Self-exclusion, spend-limit and age-verification evidence.', sla: 48 },
    { id: 'supervisor', label: 'Supervisor', description: 'Cases escalated to a supervisor.', sla: 12 },
    { id: 'no_docs', label: 'No Documents Available', description: 'Cases where evidence was never delivered.', sla: 48 },
  ],

  assignmentReasons: [
    { id: 'review_resolve', label: 'Review and Resolve Dispute', description: 'Standard review of an inbound dispute.' },
    { id: 'merchant_docs', label: 'Studio Evidence Received', description: 'Game-session evidence has arrived and needs assessment.' },
    { id: 'timeframe', label: 'Potential Timeframe Breach', description: 'Approaching or past the scheme deadline.' },
    { id: 'inbound', label: 'Inbound Correspondence', description: 'New correspondence attached to the case.' },
    { id: 'zero_doc', label: '1st CB with 0 Doc Indicator', description: 'First chargeback arrived with no documents.' },
    { id: 'high_value', label: 'High Value — Manual Review', description: 'Above the risk amount, needs a senior decision.' },
    { id: 'consolidation', label: 'Consolidation', description: 'Grouped with linked cases for one decision.' },
    { id: 'duplicate', label: 'Duplicate Item — Existing in Open', description: 'A matching case already exists.' },
  ],

  /* --- Due-date offsets ---------------------------------------------------- *
   * Network windows are fixed by the schemes; the internal buffer is ours and
   * is what analysts actually work to. Editable from System preferences. */
  dueDateOffsets: {
    schemeDays: { visa: 30, mastercard: 45, amex: 20 },
    cycleDays: { first_cb: 0, second_cb: -8, pre_arb: -14, retrieval: -10, rfi: -18 },
    claimDays: 21,
    internalBufferDays: 4,
  },

  /* --- Thresholds ----------------------------------------------------------- *
   * Coin packages top out around $499.99, so a $500 routing threshold is
   * effectively "the largest package a player can buy" — the right place for a
   * senior reviewer to be involved. */
  thresholds: {
    minimumProcessingAmount: 5,
    riskAmount: 250,
    autoAssign: true,
    routingHighValue: 500,
    defaultReviewer: 'marcus.whitfield',
  },

  /* --- Consolidation ------------------------------------------------------- *
   * Minimums are deliberately asymmetric. Two disputes on one card is already
   * a signal; two against one studio is just a studio with volume — hence
   * three, open-only, inside 30 days. Tuned loosely this flagged 60% then 28%
   * of the book, at which point the flag carries no information. Target 10-15%.
   *
   * The studio rule is the one that earns its keep here: three open disputes
   * against one studio inside a month is usually a broken game, not three
   * unlucky players. */
  consolidation: {
    rules: [
      { id: 'same_card', label: 'Same card', minSize: 2, windowDays: 90, openOnly: false, description: 'Multiple disputes presented on one PAN.' },
      { id: 'same_order', label: 'Same purchase', minSize: 2, windowDays: 120, openOnly: false, description: 'One coin purchase disputed more than once, including across intake paths.' },
      { id: 'same_seller', label: 'Same game studio', minSize: 3, windowDays: 30, openOnly: true, description: 'A cluster of open disputes against one studio inside 30 days.' },
    ],
  },

  features: {
    bulkActions: true,
    ruleCheck: true,
    consolidation: true,
    customReports: true,
    monitoring: true,
    uploadCases: true,
    webhooks: true,
    apiDocs: true,
    help: true,
  },

  demoCredentials: { username: 'ARBGamingDemo', password: 'Changeme123' },
};

/* ------------------------------------------------------------------ *
 * Tenant: PCH Games — proof the swap is real
 * ------------------------------------------------------------------ *
 * Publishers Clearing House is a second ARB property with a genuinely
 * different personality: seventy years old, blue-and-orange, token-based
 * rather than coin-based, and its users are "entrants" in a sweepstakes
 * rather than "players" in a casino. Swapping to it changes the palette, the
 * vocabulary, the entities and the case-ID prefix — and nothing else.
 */

export const pchBrand = {
  ...arbBrand,
  id: 'pch',
  name: 'PCH Games',
  legalName: 'Publishers Clearing House LLC',
  shortName: 'PCH',
  tagline: 'Card chargebacks and entrant claims in one operational queue.',
  supportEmail: 'disputes@pchgames.example',
  emailDomain: 'pchgames.example',
  address: '101 Channel Drive, Port Washington, NY 11050',
  hqCity: 'Port Washington',
  department: 'Payments Risk & Dispute Resolution',
  logo: '/tenant-pch.svg',
  wordmarkImage: null,
  wordmark: { text: 'PCH', accent: 'Games', weight: 700 },

  colors: {
    ...arbBrand.colors,
    primary: '#12539E',
    primaryDeep: '#0C3E79',
    primaryTint: '#E5EEF8',
    primaryWash: '#F4F8FC',
    navRail: '#0A1E38',
    navRailDeep: '#061428',
    navActive: '#4A93DE',
    navInk: '#DCE6F2',
    navInkMuted: '#8398B4',
    ink: '#0F1B2B',
    inkMuted: '#546477',
    inkSubtle: '#8594A5',
    canvas: '#F3F6F9',
    surfaceSunken: '#F9FBFC',
    line: '#DDE4EC',
    lineStrong: '#C2CDD9',
  },

  /** Same single-hue-plus-tints rule, in this tenant's own blue. */
  chartSeries: ['#12539E', '#4A93DE', '#8ABAEC', '#CBDFF6', '#0A1E38'],
  chartContrast: '#C2410C',
  chartNeutral: '#6D7C8C',
  chartDuo: ['#12539E', '#166F98'],

  terms: {
    ...arbBrand.terms,
    claim: 'entrant claim',
    claims: 'entrant claims',
    claimProgram: 'Entrant Protection',
    buyer: 'entrant',
    buyers: 'entrants',
    order: 'token purchase',
    itemPriceLabel: 'Token purchase value',
    conditionLabel: 'Token credit state',
  },

  numbering: { ...arbBrand.numbering, prefix: 'PCH', nextSequence: 310000, orderPrefix: 'TOK' },

  entities: [
    { id: 'pch_games', label: 'PCH Games', descriptor: 'Free-to-play games portal', mid: '7994200013' },
    { id: 'pch_slots', label: 'PCH Slots', descriptor: 'Token-based slot titles', mid: '7994200055' },
    { id: 'pch_lotto', label: 'PCH Lotto', descriptor: 'Daily sweepstakes entries', mid: '7994200104' },
  ],

  claimReasons: [
    { id: 'not_as_described', label: 'Sweepstakes entry not registered', category: 'consumer' },
    { id: 'never_arrived', label: 'Tokens not credited', category: 'consumer' },
    { id: 'counterfeit', label: 'Unauthorized account access', category: 'fraud' },
    { id: 'damaged', label: 'Game malfunction — round voided', category: 'consumer' },
    { id: 'wrong_item', label: 'Charged after account closure', category: 'consumer' },
  ],

  paymentMethods: ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'ACH Bank Transfer', 'Check by mail'],

  mccs: [
    { code: '7994', label: 'Video Game Arcades and Establishments' },
    { code: '5816', label: 'Digital Goods — Games' },
    { code: '7999', label: 'Recreation Services — Not Elsewhere Classified' },
    { code: '5968', label: 'Direct Marketing — Continuity/Subscription Merchant' },
    { code: '5969', label: 'Direct Marketing — Other' },
  ],

  acquirers: ['Chase Paymentech', 'Worldpay', 'Fiserv'],

  queues: [
    { id: 'all_chargebacks', label: 'All Chargebacks', description: 'Landing queue for every inbound chargeback.', sla: 24 },
    { id: 'buyer_protection', label: 'Entrant Protection', description: 'In-platform entrant claims with no card leg.', sla: 72 },
    { id: 'second_cycle', label: '2nd Cycle Chargeback', description: 'Second presentments and pre-arbitration.', sla: 16 },
    { id: 'high_value', label: 'High Value Disputes', description: 'Cases above the configured risk amount.', sla: 24 },
    { id: 'counterfeit', label: 'Unauthorized Account Use', description: 'Account-takeover and unauthorized-purchase escalations.', sla: 36 },
    { id: 'not_received', label: 'Tokens Not Credited', description: 'Purchases that never reached the entrant balance.', sla: 48 },
    { id: 'logistics', label: 'Sweepstakes Compliance', description: 'Entry-eligibility and prize-notification evidence.', sla: 48 },
    { id: 'supervisor', label: 'Supervisor', description: 'Cases escalated to a supervisor.', sla: 12 },
    { id: 'no_docs', label: 'No Documents Available', description: 'Cases where evidence was never delivered.', sla: 48 },
  ],

  thresholds: { ...arbBrand.thresholds, minimumProcessingAmount: 3, riskAmount: 120, routingHighValue: 250 },

  /** Its own, so the second tenant never shows the first tenant's username. */
  demoCredentials: { username: 'PCHGamesDemo', password: 'Changeme123' },
};

/* ------------------------------------------------------------------ *
 * Registry + lookups
 * ------------------------------------------------------------------ */

export const TENANTS = { arb: arbBrand, pch: pchBrand };

export const brand = TENANTS[import.meta.env?.VITE_TENANT] ?? arbBrand;

export const allReasonCodes = (b = brand) =>
  b.schemes.flatMap((s) => s.reasonCodes.map((rc) => ({ ...rc, schemeId: s.id, schemeLabel: s.label })));

export const findReasonCode = (code, b = brand) =>
  allReasonCodes(b).find((rc) => rc.code === code) ?? null;

export const findScheme = (id, b = brand) => b.schemes.find((s) => s.id === id) ?? null;
export const findQueue = (id, b = brand) => b.queues.find((q) => q.id === id) ?? null;
export const findEntity = (id, b = brand) => b.entities.find((e) => e.id === id) ?? null;
export const findCycle = (id, b = brand) => b.cycles.find((c) => c.id === id) ?? null;
export const findClaimReason = (id, b = brand) => b.claimReasons.find((r) => r.id === id) ?? null;
export const categoryLabel = (id) => REASON_CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** Reason label for either intake path — claims have no scheme code. */
export const reasonLabelFor = (code, b = brand) =>
  findReasonCode(code, b)?.label ?? findClaimReason(code, b)?.label ?? code;

export default brand;
