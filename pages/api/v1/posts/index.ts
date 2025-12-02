import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetPosts(req, res);
      case 'POST':
        return handleCreatePost(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function handleGetPosts(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  const {
    page = '1',
    limit = '20',
    userId,
    communityId,
    hashtag,
    sort = 'latest'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 100);
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      media_urls,
      hashtags,
      like_count,
      repost_count,
      reply_count,
      created_at,
      users!posts_user_id_fkey (
        username,
        display_name,
        avatar_url,
        verified
      )
    `)
    .eq('deleted', false)
    .range(offset, offset + limitNum - 1);

  if (userId) query = query.eq('user_id', userId);
  if (communityId) query = query.eq('community_id', communityId);
  if (hashtag) query = query.contains('hashtags', [hashtag]);

  switch (sort) {
    case 'popular':
      query = query.order('like_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: posts, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }

  return res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: posts?.length || 0,
      hasNext: (posts?.length || 0) === limitNum
    }
  });
}

async function handleCreatePost(req: NextApiRequest, res: NextApiResponse<APIResponse>) {
  const {
    content,
    mediaUrls = [],
    hashtags = [],
    mentions = [],
    communityId,
    visibility = 'public'
  } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Content is required'
    });
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      content,
      media_urls: mediaUrls,
      hashtags,
      mentions,
      community_id: communityId,
      visibility,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }

  return res.status(201).json({
    success: true,
    data: post,
    message: 'Post created successfully'
  });
}