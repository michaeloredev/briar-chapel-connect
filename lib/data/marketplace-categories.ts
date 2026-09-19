export const MARKETPLACE_CATEGORY_VALUES = [
  'furniture',
  'electronics',
  'appliances',
  'home_garden',
  'clothing',
  'kids',
  'toys_games',
  'sports_outdoors',
  'tools',
  'vehicles',
  'pets',
  'free',
  'general',
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORY_VALUES)[number];

export const MARKETPLACE_CATEGORIES: { value: MarketplaceCategory; label: string }[] = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'clothing', label: 'Clothing & Accessories' },
  { value: 'kids', label: 'Kids & Baby' },
  { value: 'toys_games', label: 'Toys & Games' },
  { value: 'sports_outdoors', label: 'Sports & Outdoors' },
  { value: 'tools', label: 'Tools & Hardware' },
  { value: 'vehicles', label: 'Vehicles & Parts' },
  { value: 'pets', label: 'Pet Supplies' },
  { value: 'free', label: 'Free' },
  { value: 'general', label: 'Other' },
];

export function isMarketplaceCategory(value: string): value is MarketplaceCategory {
  return (MARKETPLACE_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function marketplaceListHref(params: {
  q?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.category) sp.set('category', params.category);
  if (params.condition) sp.set('condition', params.condition);
  if (params.min) sp.set('min', params.min);
  if (params.max) sp.set('max', params.max);
  const qs = sp.toString();
  return qs ? `/marketplace?${qs}` : '/marketplace';
}
