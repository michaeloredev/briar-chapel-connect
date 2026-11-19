/**
 * Photos allowed on one news post or one comment/reply. Shared so a post and
 * the replies under it can never disagree; both composers and both API
 * routes (/api/news-posts, /api/comments) read it. Marketplace listings have
 * their own limit in AddMarketplaceItem and /api/marketplace-items.
 */
export const MAX_POST_PHOTOS = 4;
