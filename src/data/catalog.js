/**
 * Fixture vocabulary — the raw material the generator draws from.
 *
 * Deliberately plausible rather than random: American names, the US state
 * spread a sweepstakes operator actually runs in, and Gold Coin package price
 * bands that land on real price points ($4.99 … $499.99) so the amounts in the
 * book look like a payments export rather than a random-number generator.
 * Nothing here names a tenant.
 */

export const FIRST_NAMES = [
  'Jordan', 'Ashley', 'Marcus', 'Brittany', 'Tyler', 'Destiny', 'Cody', 'Latoya',
  'Hunter', 'Amber', 'Devin', 'Shannon', 'Travis', 'Kayla', 'Brandon', 'Megan',
  'Dustin', 'Crystal', 'Chase', 'Vanessa', 'Garrett', 'Monique', 'Colton', 'Heather',
  'Andre', 'Tiffany', 'Blake', 'Jasmine', 'Wyatt', 'Nicole', 'Trevor', 'Alicia',
  'Jared', 'Danielle', 'Brett', 'Erica', 'Shane', 'Courtney', 'Logan', 'Rebecca',
  'Miguel', 'Sierra', 'Derrick', 'Kelsey', 'Preston', 'Whitney', 'Darius', 'Paige',
];

export const LAST_NAMES = [
  'Mitchell', 'Ramirez', 'Whitfield', 'Delgado', 'Vasquez', 'Kowalski',
  'Broussard', 'Nguyen', 'Castellano', 'Pritchard', 'Okafor', 'Blackwell',
  'Sandoval', 'Hollis', 'Bergeron', 'Cavanaugh', 'Ferraro', 'Hutchins',
  'Landry', 'McAllister', 'Ochoa', 'Pennington', 'Quintero', 'Rockwell',
  'Saunders', 'Tillman', 'Underwood', 'Vandenberg', 'Whitaker', 'Youngblood',
  'Alvarado', 'Beckett', 'Chandler', 'Dougherty', 'Escobar', 'Fitzgerald',
  'Gallagher', 'Hammond', 'Jarrett', 'Kirkland', 'Lockhart', 'Mercer',
  'Nakamura', 'Osborne', 'Reyes', 'Sutton', 'Thibodeaux', 'Winslow',
];

/**
 * Game-studio handles. Invented rather than borrowed: naming a real content
 * supplier in a demo book implies a commercial relationship that may not exist,
 * and the dispute data attached to them is fabricated.
 */
export const SELLER_HANDLES = [
  'goldspire_studios', 'rivet_gaming', 'nine_lantern', 'crownfall_studios',
  'bright_anvil', 'tumbleweed_games', 'static_orbit', 'saltwater_slots',
  'high_desert_interactive', 'pixel_foundry_labs', 'copperhead_studios', 'lucky_lattice',
  'northgate_interactive', 'vault_and_vine', 'triple_crown_labs', 'neon_prairie',
  'ironwood_gaming', 'starcove_studios', 'red_river_reels', 'brass_monkey_games',
  'driftwood_interactive', 'moonshot_reels', 'glasshouse_gaming', 'wildfern_studios',
  'quicksilver_labs', 'harborline_games', 'sunspot_interactive', 'deepwell_studios',
];

/**
 * The game a dispute is raised against, and the Gold Coin purchase value tied
 * to that session. Bands straddle the real package ladder — $4.99 / $9.99 /
 * $19.99 / $49.99 / $99.99 / $199.99 / $499.99 — so live-dealer and jackpot
 * titles sit at the top of the book and instant-win sits at the bottom, which
 * is what the value distribution looks like in practice.
 */
export const ITEMS = [
  { title: 'Gates of Goldspire', category: 'Slots — Megaways', low: 9.99, high: 49.99 },
  { title: 'Copperhead Cash Collect', category: 'Slots — Megaways', low: 9.99, high: 99.99 },
  { title: 'Neon Prairie Nights', category: 'Slots — Megaways', low: 19.99, high: 99.99 },
  { title: 'Lucky Lattice 7s', category: 'Slots — Classic', low: 4.99, high: 19.99 },
  { title: 'Brass Monkey Bar', category: 'Slots — Classic', low: 4.99, high: 19.99 },
  { title: 'Red River Reels', category: 'Slots — Classic', low: 4.99, high: 29.99 },
  { title: 'Tumbleweed Treasure', category: 'Slots — Classic', low: 4.99, high: 24.99 },
  { title: 'Crownfall Mega Jackpot', category: 'Slots — Jackpot', low: 49.99, high: 199.99 },
  { title: 'Vault & Vine Jackpot King', category: 'Slots — Jackpot', low: 49.99, high: 299.99 },
  { title: 'Ironwood Fortune Grand', category: 'Slots — Jackpot', low: 99.99, high: 499.99 },
  { title: 'Starcove Progressive', category: 'Slots — Jackpot', low: 99.99, high: 399.99 },
  { title: 'Modo Live Blackjack, Table 3', category: 'Live Dealer — Blackjack', low: 49.99, high: 199.99 },
  { title: 'Modo Live Blackjack VIP', category: 'Live Dealer — Blackjack', low: 99.99, high: 499.99 },
  { title: 'Modo Live Roulette, Studio A', category: 'Live Dealer — Roulette', low: 19.99, high: 99.99 },
  { title: 'Modo Lightning Roulette', category: 'Live Dealer — Roulette', low: 49.99, high: 199.99 },
  { title: 'Modo Live Baccarat Speed', category: 'Live Dealer — Baccarat', low: 49.99, high: 299.99 },
  { title: 'Harborline Hold’em', category: 'Table Games', low: 9.99, high: 99.99 },
  { title: 'Deepwell Video Poker', category: 'Table Games', low: 4.99, high: 49.99 },
  { title: 'Quicksilver Craps', category: 'Table Games', low: 9.99, high: 99.99 },
  { title: 'Static Orbit Crash', category: 'Crash & Instant Win', low: 4.99, high: 49.99 },
  { title: 'Moonshot Multiplier', category: 'Crash & Instant Win', low: 4.99, high: 39.99 },
  { title: 'Saltwater Scratch', category: 'Crash & Instant Win', low: 4.99, high: 14.99 },
  { title: 'Nine Lantern Plinko', category: 'Crash & Instant Win', low: 4.99, high: 29.99 },
  { title: 'Sunspot Bingo Hall', category: 'Bingo & Keno', low: 4.99, high: 24.99 },
  { title: 'High Desert Keno', category: 'Bingo & Keno', low: 4.99, high: 19.99 },
  { title: 'Glasshouse Game Show Live', category: 'Game Shows', low: 19.99, high: 149.99 },
  { title: 'Wildfern Wheel of Fortune Live', category: 'Game Shows', low: 19.99, high: 199.99 },
  { title: 'PCH Daily Sweepstakes Entry', category: 'Sweepstakes Entries', low: 4.99, high: 39.99 },
  { title: 'PCH SuperPrize Token Bundle', category: 'Sweepstakes Entries', low: 9.99, high: 99.99 },
];

/**
 * Coin credit state — the digital-goods equivalent of "condition". Whether the
 * Gold Coins the player paid for actually reached the balance is the single
 * most load-bearing fact in a "services not received" defense, so it is a first
 * class field rather than a note.
 */
export const CONDITIONS = [
  'Credited in full',
  'Partially credited',
  'Not credited',
  'Credited then reversed',
  'Credit pending review',
];

/** Cities keyed by US state code — `markets` in brand.config holds state codes. */
export const MARKET_CITIES = {
  FL: ['Miami', 'Tampa', 'Orlando', 'Jacksonville'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
  CA: ['Los Angeles', 'San Diego', 'Sacramento', 'Fresno'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Syracuse'],
  GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Peoria'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Boulder'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Trenton'],
  TN: ['Nashville', 'Memphis', 'Knoxville'],
  VA: ['Virginia Beach', 'Richmond', 'Norfolk'],
  MA: ['Boston', 'Worcester', 'Springfield'],
};

/**
 * Credit methods — how the coins were delivered. There is no carrier here; the
 * question a dispute turns on is whether the credit was instant, batched, or
 * applied by hand after a failure.
 */
export const CARRIERS = [
  'Instant account credit',
  'Delayed batch credit',
  'Manual ops credit',
  'Wallet re-sync credit',
  'Promo engine credit',
];

export const LAST_NOTES = [
  'Awaiting game-session logs from the studio',
  'Represented — pending scheme response',
  'Escalated to supervisor',
  'Docs received, in review',
  'Player contacted issuer directly',
  'Partial coin credit reversed',
  'Session logs confirm coins credited and played',
  'Account flagged for device mismatch',
  'Self-exclusion date requested from RG team',
  'Below write-off threshold',
  '—',
];

export const TRANSACTION_TYPES = ['Sale', 'Refund', 'Authorization', 'Recurring'];
export const SALES_METHODS = ['Ecommerce', 'Mobile App', 'MOTO', 'Recurring Billing'];
export const FRAUD_MARKERS = ['Confirmed Fraud', 'Suspected Fraud', 'No Fraud Marker', 'Fraud Reported by Issuer'];
