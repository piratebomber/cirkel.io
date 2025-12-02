import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

export interface CollaborativePost {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  collaborators: string[];
  status: 'draft' | 'in_progress' | 'review' | 'published';
  permissions: {
    canEdit: string[];
    canComment: string[];
    canApprove: string[];
  };
  version: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostEdit {
  id: string;
  postId: string;
  userId: string;
  type: 'text' | 'media' | 'structure';
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  previousContent?: string;
  timestamp: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  position?: number;
  resolved: boolean;
  createdAt: string;
}

export class CollaborativePostService extends EventEmitter {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private activeEditors = new Map<string, Set<string>>();
  private postLocks = new Map<string, { userId: string; timestamp: number }>();

  async createCollaborativePost(
    creatorId: string,
    postData: {
      title: string;
      content: string;
      collaborators: string[];
      permissions: CollaborativePost['permissions'];
    }
  ): Promise<string> {
    const postId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const post: CollaborativePost = {
      id: postId,
      creatorId,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...postData
    };

    const { data } = await this.supabase
      .from('collaborative_posts')
      .insert({
        id: postId,
        creator_id: creatorId,
        title: postData.title,
        content: postData.content,
        collaborators: postData.collaborators,
        permissions: postData.permissions,
        status: 'draft',
        version: 1,
        created_at: post.createdAt,
        updated_at: post.updatedAt
      })
      .select()
      .single();

    // Add collaborators
    const collaboratorInserts = postData.collaborators.map(userId => ({
      post_id: postId,
      user_id: userId,
      role: 'collaborator',
      invited_at: new Date().toISOString()
    }));

    if (collaboratorInserts.length > 0) {
      await this.supabase
        .from('post_collaborators')
        .insert(collaboratorInserts);
    }

    this.emit('postCreated', { post });
    return postId;
  }

  async joinEditingSession(postId: string, userId: string): Promise<boolean> {
    const post = await this.getPost(postId);
    if (!post || !this.canUserEdit(post, userId)) {
      return false;
    }

    if (!this.activeEditors.has(postId)) {
      this.activeEditors.set(postId, new Set());
    }

    this.activeEditors.get(postId)!.add(userId);

    // Log editing session
    await this.supabase
      .from('post_editing_sessions')
      .insert({
        post_id: postId,
        user_id: userId,
        started_at: new Date().toISOString()
      });

    this.emit('editorJoined', { postId, userId });
    return true;
  }

  async leaveEditingSession(postId: string, userId: string): Promise<void> {
    const editors = this.activeEditors.get(postId);
    if (editors) {
      editors.delete(userId);
      
      if (editors.size === 0) {
        this.activeEditors.delete(postId);
      }
    }

    // Release any locks held by this user
    const lock = this.postLocks.get(postId);
    if (lock && lock.userId === userId) {
      this.postLocks.delete(postId);
      this.emit('lockReleased', { postId, userId });
    }

    // Update editing session
    await this.supabase
      .from('post_editing_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('post_id', postId)
      .eq('user_id', userId)
      .is('ended_at', null);

    this.emit('editorLeft', { postId, userId });
  }

  async applyEdit(
    postId: string,
    userId: string,
    edit: Omit<PostEdit, 'id' | 'postId' | 'userId' | 'timestamp'>
  ): Promise<string> {
    const post = await this.getPost(postId);
    if (!post || !this.canUserEdit(post, userId)) {
      throw new Error('User cannot edit this post');
    }

    // Check for conflicts
    const hasConflict = await this.checkForConflicts(postId, edit);
    if (hasConflict) {
      throw new Error('Edit conflict detected');
    }

    const editId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const postEdit: PostEdit = {
      id: editId,
      postId,
      userId,
      timestamp,
      ...edit
    };

    // Apply edit to content
    const newContent = this.applyEditToContent(post.content, edit);
    
    // Save edit and update post
    await Promise.all([
      this.supabase
        .from('post_edits')
        .insert({
          id: editId,
          post_id: postId,
          user_id: userId,
          type: edit.type,
          operation: edit.operation,
          position: edit.position,
          content: edit.content,
          previous_content: edit.previousContent,
          timestamp
        }),
      
      this.supabase
        .from('collaborative_posts')
        .update({
          content: newContent,
          version: post.version + 1,
          updated_at: timestamp
        })
        .eq('id', postId)
    ]);

    this.emit('editApplied', { postId, edit: postEdit });
    return editId;
  }

  async addComment(
    postId: string,
    userId: string,
    content: string,
    position?: number
  ): Promise<string> {
    const post = await this.getPost(postId);
    if (!post || !this.canUserComment(post, userId)) {
      throw new Error('User cannot comment on this post');
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const comment: PostComment = {
      id: commentId,
      postId,
      userId,
      content,
      position,
      resolved: false,
      createdAt: new Date().toISOString()
    };

    await this.supabase
      .from('post_comments')
      .insert({
        id: commentId,
        post_id: postId,
        user_id: userId,
        content,
        position,
        resolved: false,
        created_at: comment.createdAt
      });

    this.emit('commentAdded', { postId, comment });
    return commentId;
  }

  async resolveComment(commentId: string, userId: string): Promise<void> {
    const { data: comment } = await this.supabase
      .from('post_comments')
      .select('*, collaborative_posts!post_id(*)')
      .eq('id', commentId)
      .single();

    if (!comment || !this.canUserEdit(comment.collaborative_posts, userId)) {
      throw new Error('Cannot resolve comment');
    }

    await this.supabase
      .from('post_comments')
      .update({ 
        resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', commentId);

    this.emit('commentResolved', { commentId, userId });
  }

  async requestReview(postId: string, userId: string): Promise<void> {
    const post = await this.getPost(postId);
    if (!post || post.creatorId !== userId) {
      throw new Error('Only creator can request review');
    }

    await this.supabase
      .from('collaborative_posts')
      .update({ 
        status: 'review',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    // Notify reviewers
    const reviewers = post.permissions.canApprove;
    for (const reviewerId of reviewers) {
      await this.supabase
        .from('post_review_requests')
        .insert({
          post_id: postId,
          reviewer_id: reviewerId,
          requested_by: userId,
          created_at: new Date().toISOString()
        });
    }

    this.emit('reviewRequested', { postId, userId });
  }

  async approvePost(postId: string, reviewerId: string): Promise<void> {
    const post = await this.getPost(postId);
    if (!post || !post.permissions.canApprove.includes(reviewerId)) {
      throw new Error('User cannot approve this post');
    }

    await Promise.all([
      this.supabase
        .from('collaborative_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId),
      
      this.supabase
        .from('post_approvals')
        .insert({
          post_id: postId,
          reviewer_id: reviewerId,
          approved: true,
          created_at: new Date().toISOString()
        })
    ]);

    this.emit('postApproved', { postId, reviewerId });
  }

  async rejectPost(postId: string, reviewerId: string, reason: string): Promise<void> {
    const post = await this.getPost(postId);
    if (!post || !post.permissions.canApprove.includes(reviewerId)) {
      throw new Error('User cannot reject this post');
    }

    await Promise.all([
      this.supabase
        .from('collaborative_posts')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId),
      
      this.supabase
        .from('post_approvals')
        .insert({
          post_id: postId,
          reviewer_id: reviewerId,
          approved: false,
          rejection_reason: reason,
          created_at: new Date().toISOString()
        })
    ]);

    this.emit('postRejected', { postId, reviewerId, reason });
  }

  async getPostHistory(postId: string): Promise<PostEdit[]> {
    const { data } = await this.supabase
      .from('post_edits')
      .select(`
        *,
        users(username, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('timestamp', { ascending: true });

    return data || [];
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    const { data } = await this.supabase
      .from('post_comments')
      .select(`
        *,
        users(username, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('resolved', false)
      .order('created_at', { ascending: true });

    return data || [];
  }

  async getActiveEditors(postId: string): Promise<string[]> {
    const editors = this.activeEditors.get(postId);
    return editors ? Array.from(editors) : [];
  }

  async acquireLock(postId: string, userId: string): Promise<boolean> {
    const existingLock = this.postLocks.get(postId);
    
    // Check if lock is expired (5 minutes)
    if (existingLock && Date.now() - existingLock.timestamp > 5 * 60 * 1000) {
      this.postLocks.delete(postId);
    }

    if (this.postLocks.has(postId)) {
      return false;
    }

    this.postLocks.set(postId, {
      userId,
      timestamp: Date.now()
    });

    this.emit('lockAcquired', { postId, userId });
    return true;
  }

  async releaseLock(postId: string, userId: string): Promise<void> {
    const lock = this.postLocks.get(postId);
    if (lock && lock.userId === userId) {
      this.postLocks.delete(postId);
      this.emit('lockReleased', { postId, userId });
    }
  }

  private async getPost(postId: string): Promise<CollaborativePost | null> {
    const { data } = await this.supabase
      .from('collaborative_posts')
      .select('*')
      .eq('id', postId)
      .single();

    return data ? {
      id: data.id,
      title: data.title,
      content: data.content,
      creatorId: data.creator_id,
      collaborators: data.collaborators,
      status: data.status,
      permissions: data.permissions,
      version: data.version,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  }

  private canUserEdit(post: CollaborativePost, userId: string): boolean {
    return post.creatorId === userId || 
           post.collaborators.includes(userId) || 
           post.permissions.canEdit.includes(userId);
  }

  private canUserComment(post: CollaborativePost, userId: string): boolean {
    return post.creatorId === userId || 
           post.collaborators.includes(userId) || 
           post.permissions.canComment.includes(userId);
  }

  private async checkForConflicts(postId: string, edit: Omit<PostEdit, 'id' | 'postId' | 'userId' | 'timestamp'>): Promise<boolean> {
    const { data: recentEdits } = await this.supabase
      .from('post_edits')
      .select('*')
      .eq('post_id', postId)
      .gte('timestamp', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
      .neq('user_id', edit.operation); // Exclude current user

    if (!recentEdits) return false;

    // Check for overlapping edits
    return recentEdits.some(recentEdit => {
      const editStart = edit.position;
      const editEnd = edit.position + (edit.content?.length || 0);
      const recentStart = recentEdit.position;
      const recentEnd = recentEdit.position + (recentEdit.content?.length || 0);

      return (editStart < recentEnd && editEnd > recentStart);
    });
  }

  private applyEditToContent(content: string, edit: Omit<PostEdit, 'id' | 'postId' | 'userId' | 'timestamp'>): string {
    switch (edit.operation) {
      case 'insert':
        return content.slice(0, edit.position) + edit.content + content.slice(edit.position);
      
      case 'delete':
        const deleteEnd = edit.position + (edit.previousContent?.length || 0);
        return content.slice(0, edit.position) + content.slice(deleteEnd);
      
      case 'replace':
        const replaceEnd = edit.position + (edit.previousContent?.length || 0);
        return content.slice(0, edit.position) + edit.content + content.slice(replaceEnd);
      
      default:
        return content;
    }
  }
}

export const collaborativePostService = new CollaborativePostService();