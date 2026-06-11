const CATEGORY_MAP: Record<string, string> = {
  sofa: 'sofa', sofas: 'sofa', 'sectional sofa': 'sofa', 'l-shape sofa': 'sofa', couch: 'sofa',
  loveseat: 'loveseat', 'love seat': 'loveseat',
  chair: 'chair', chairs: 'chair', armchair: 'chair', 'accent chair': 'chair', recliner: 'chair',
  'dining chair': 'chair', 'office chair': 'chair',
  table: 'table', tables: 'table', 'coffee table': 'table', 'side table': 'table',
  'end table': 'table', 'dining table': 'table', 'console table': 'table',
  stool: 'stool', stools: 'stool', ottoman: 'stool', footstool: 'stool', 'bar stool': 'stool',
  lamp: 'lamp', lamps: 'lamp', 'floor lamp': 'lamp', 'table lamp': 'lamp',
  'pendant light': 'lamp', lighting: 'lamp',
  decoration: 'decoration', decorations: 'decoration', decor: 'decoration',
  vase: 'decoration', plant: 'decoration', 'indoor plant': 'decoration',
  cushion: 'decoration', pillow: 'decoration', throw: 'decoration',
  'wall art': 'decoration', frame: 'decoration', mirror: 'mirror',
  cabinet: 'cabinet', cabinets: 'cabinet', bookshelf: 'cabinet', bookcase: 'cabinet',
  wardrobe: 'cabinet', dresser: 'cabinet', 'storage unit': 'cabinet', shelf: 'cabinet',
  rug: 'rug', rugs: 'rug', 'area rug': 'rug', carpet: 'rug',
  bed: 'bed', beds: 'bed', 'bed frame': 'bed', 'platform bed': 'bed',
  nightstand: 'table', 'night stand': 'table', bedside: 'table',
};

/** Maps a product name + DB category to a canonical placement-rule key */
export function getDisplayCategory(productName: string, dbCategory: string): string {
  const nameLower = productName?.toLowerCase() ?? '';
  const catLower  = dbCategory?.toLowerCase() ?? '';

  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (nameLower.includes(key)) return val;
  }
  return CATEGORY_MAP[catLower] ?? catLower;
}
