-- Restrict marketplace_items.category to the shared dropdown values
-- so listings can be filtered and sorted by type.

ALTER TABLE marketplace_items
  DROP CONSTRAINT IF EXISTS marketplace_items_category_check;

ALTER TABLE marketplace_items
  ADD CONSTRAINT marketplace_items_category_check
  CHECK (category IN (
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
    'general'
  ));
