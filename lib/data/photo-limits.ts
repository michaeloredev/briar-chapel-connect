/**
 * Photos allowed on one news post, comment/reply or marketplace listing.
 * Shared so the site has one limit and a form can never disagree with its
 * route: the news, comment and listing composers and /api/news-posts,
 * /api/comments and /api/marketplace-items all read it.
 */
export const MAX_POST_PHOTOS = 4;
