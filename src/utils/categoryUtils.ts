// Maps raw product name / DB category to a canonical placement-rule key.
// Lamp sub-types are detected from the product name:
//   floor-lamp  → floor lamp, arc lamp, tripod lamp, scandinavian floor
//   table-lamp  → table lamp, desk lamp, ceramic lamp, marble base lamp, cone lamp, geometric lamp
//   pendant     → pendant lamp, chandelier, crystal lamp, ceiling lamp, cone shade (hanging)
// Everything else falls through to the generic category key.

const CATEGORY_MAP: Record<string, string> = {
  // ── Sofa / seating ──────────────────────────────────────────────────────────
  sofa: 'sofa', sofas: 'sofa', 'sectional sofa': 'sofa', 'l-shape sofa': 'sofa', couch: 'sofa',
  loveseat: 'loveseat', 'love seat': 'loveseat',

  // ── Chair ────────────────────────────────────────────────────────────────────
  chair: 'chair', chairs: 'chair', armchair: 'chair', 'accent chair': 'chair',
  recliner: 'chair', 'dining chair': 'chair', 'office chair': 'chair',
  'lounge chair': 'chair', 'club chair': 'chair', 'slipper chair': 'chair',
  'papasan': 'chair', 'wingback': 'chair', 'barcelona': 'chair',

  // ── Table / desk ─────────────────────────────────────────────────────────────
  table: 'table', tables: 'table', 'coffee table': 'table', 'side table': 'table',
  'end table': 'table', 'dining table': 'table', 'console table': 'table',
  nightstand: 'table', 'night stand': 'table', bedside: 'table',
  desk: 'table', 'writing desk': 'table', 'office desk': 'table',
  'study desk': 'table', 'standing desk': 'table', 'corner desk': 'table',

  // ── Lamp sub-types (order matters — more specific first) ─────────────────────
  'arc floor':         'floor-lamp',
  'floor lamp':        'floor-lamp',
  'arc lamp':          'floor-lamp',
  'tripod':            'floor-lamp',
  'scandinavian floor':'floor-lamp',
  'industrial tripod': 'floor-lamp',

  'table lamp':        'table-lamp',
  'desk lamp':         'table-lamp',
  'marble base':       'table-lamp',
  'ceramic table':     'table-lamp',
  'swing-arm':         'table-lamp',
  'adjustable swing':  'table-lamp',
  'vintage edison':    'table-lamp',
  'cone shade':        'table-lamp',
  'geometric metal':   'table-lamp',
  'minimalist cone':   'table-lamp',
  'edison table':      'table-lamp',

  'pendant':           'pendant',
  'chandelier':        'pendant',
  'crystal':           'pendant',
  'ceiling':           'pendant',
  'modern pendant':    'pendant',

  // Generic lamp fallback → floor lamp
  lamp: 'floor-lamp', lamps: 'floor-lamp', 'floor lamp ': 'floor-lamp',
  'pendant light': 'pendant', lighting: 'floor-lamp',

  // ── Stool / ottoman ──────────────────────────────────────────────────────────
  stool: 'stool', stools: 'stool', ottoman: 'stool', footstool: 'stool',
  'bar stool': 'stool', bench: 'stool', 'entryway bench': 'stool',

  // ── Cabinet / storage ────────────────────────────────────────────────────────
  cabinet: 'cabinet', cabinets: 'cabinet', bookshelf: 'cabinet', bookcase: 'cabinet',
  wardrobe: 'cabinet', dresser: 'cabinet', 'storage unit': 'cabinet', shelf: 'cabinet',
  sideboard: 'cabinet', armoire: 'cabinet', closet: 'cabinet', 'chest of': 'cabinet',
  'highboy': 'cabinet', 'media cabinet': 'cabinet', 'tv cabinet': 'cabinet',

  // ── Bed ──────────────────────────────────────────────────────────────────────
  bed: 'bed', beds: 'bed', 'bed frame': 'bed', 'platform bed': 'bed',
  'sleigh bed': 'bed', 'canopy bed': 'bed', 'bunk bed': 'bed', daybed: 'bed',

  // ── Decorative ───────────────────────────────────────────────────────────────
  decoration: 'decoration', decorations: 'decoration', decor: 'decoration',
  vase: 'decoration', plant: 'decoration', 'indoor plant': 'decoration',
  cushion: 'decoration', pillow: 'decoration', throw: 'decoration',
  frame: 'decoration',

  // ── Wall decor (placed on walls, above floor line) ──────────────────────────
  'wall decor': 'mirror', 'wall art': 'mirror', 'wall clock': 'mirror',
  'wall mirror': 'mirror', 'wall shelf': 'mirror', 'floating shelf': 'mirror',
  'wall hanging': 'mirror', 'wall sculpture': 'mirror', scenery: 'mirror',
  'canvas art': 'mirror', 'canvas print': 'mirror', 'wall panel': 'mirror',
  'macrame': 'mirror', 'tapestry': 'mirror',

  // ── Other ────────────────────────────────────────────────────────────────────
  mirror: 'mirror',
  rug: 'rug', rugs: 'rug', 'area rug': 'rug', carpet: 'rug',
};

/** Maps a product name + DB category to a canonical placement-rule key */
export function getDisplayCategory(productName: string, dbCategory: string): string {
  const nameLower = productName?.toLowerCase() ?? '';
  const catLower  = dbCategory?.toLowerCase()  ?? '';

  // Check product name first (more specific), longest match wins
  const nameKeys = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const key of nameKeys) {
    if (nameLower.includes(key)) return CATEGORY_MAP[key];
  }

  // Fall back to DB category
  return CATEGORY_MAP[catLower] ?? catLower;
}
