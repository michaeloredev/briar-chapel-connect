import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, hasRole, requireRole } from '@/lib/auth/roles';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { ownImageUrls, removeStorageObjects, storageObjectPath } from '@/lib/api/upload';
import { deleteEntityComments } from '@/lib/api/comments';
import { findProfaneField, profanityMessage } from '@/lib/moderation/profanity';
import { isNewsCategory, MAX_NEWS_POST_LENGTH } from '@/lib/data/news-categories';
import { MAX_POST_PHOTOS } from '@/lib/data/photo-limits';

/** The R2 folder news photos are uploaded to (see app/api/uploads/news-image). */
const IMAGE_FOLDER = 'general-images';

type Row = Database['public']['Tables']['news_posts']['Row'];

type PostBody = {
  category?: string;
  content?: string;
  images?: string[];
};

export async function POST(req: Request) {
  try {
    const body: PostBody = await req.json();
    const content = (body.content || '').trim();
    const category = (body.category || 'chatter').trim();

    if (!content) return apiBadRequest('Write something to post');
    if (content.length > MAX_NEWS_POST_LENGTH) {
      return apiBadRequest(`Posts are limited to ${MAX_NEWS_POST_LENGTH} characters`);
    }
    if (!isNewsCategory(category)) return apiBadRequest('Invalid category');
    if (findProfaneField({ post: content })) return apiBadRequest(profanityMessage('post'));

    const { userId } = await requireAuthSupabase();
    const images = ownImageUrls(body.images, IMAGE_FOLDER, userId, MAX_POST_PHOTOS);
    if (!images) return apiBadRequest('invalid images');

    type Insert = Database['public']['Tables']['news_posts']['Insert'];
    const insert: Insert = { user_id: userId, category, content, images };

    // Written through the service role: there is no insert policy, so the
    // checks above cannot be skipped by writing to the table directly.
    const { data, error } = await createAdminClient()
      .from('news_posts')
      .insert(insert)
      .select('*')
      .single<Row>();

    if (error) {
      console.error('[NewsPosts][POST] insert error:', error.message);
      return apiError(error, 'Failed to create post');
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create post');
  }
}

/** Pin or unpin a post. Admins only: pinning is for announcements. */
export async function PATCH(req: Request) {
  try {
    const body: { id?: string; pinned?: boolean } = await req.json();
    const id = (body.id || '').trim();
    if (!id) return apiBadRequest('Missing id');
    if (typeof body.pinned !== 'boolean') return apiBadRequest('Missing pinned');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');

    const { data, error } = await createAdminClient()
      .from('news_posts')
      .update({ pinned_at: body.pinned ? new Date().toISOString() : null })
      .eq('id', id)
      .select('*')
      .maybeSingle<Row>();

    if (error) {
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[NewsPosts][PATCH] error:', error.message);
      return apiError(error, 'Failed to update post');
    }
    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to update post');
  }
}

/** Delete a post: its author, or an admin moderating. Takes its replies and photos with it. */
export async function DELETE(req: Request) {
  try {
    const id = (new URL(req.url).searchParams.get('id') || '').trim();
    if (!id) return apiBadRequest('Missing id');

    const { supabase, userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const { data: post, error: fetchError } = await admin
      .from('news_posts')
      .select('id, user_id, images')
      .eq('id', id)
      .maybeSingle<Pick<Row, 'id' | 'user_id' | 'images'>>();

    if (fetchError) {
      if (fetchError.code === '22P02') return apiBadRequest('invalid id');
      console.error('[NewsPosts][DELETE] fetch error:', fetchError.message);
      return apiError(fetchError, 'Failed to delete post');
    }
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const isAuthor = post.user_id === userId;
    if (!isAuthor && !hasRole(await getUserRole(userId), 'admin')) {
      throw new Error('Forbidden');
    }

    // The author deletes with their own token, so the owner-only RLS policy
    // still applies; moderation needs the service role.
    const { data: deleted, error } = isAuthor
      ? await supabase.from('news_posts').delete().eq('id', id).eq('user_id', userId).select('id')
      : await admin.from('news_posts').delete().eq('id', id).select('id');

    if (error) {
      console.error('[NewsPosts][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete post');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await deleteEntityComments(admin, 'news_post', id);
    const imagePaths = (post.images ?? [])
      .map((ref) => storageObjectPath(String(ref), IMAGE_FOLDER))
      .filter((path): path is string => Boolean(path && path.startsWith(`${post.user_id}/`)));
    await removeStorageObjects(IMAGE_FOLDER, imagePaths);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete post');
  }
}
