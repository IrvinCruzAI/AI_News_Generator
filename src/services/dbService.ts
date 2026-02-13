import { supabase } from '../lib/supabase';
import type { GeneratedArticle } from '../types';

export const dbService = {
  async getArticles(userId: string): Promise<GeneratedArticle[]> {
    const { data, error } = await supabase
      .from('generated_articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return [];
    }

    return data.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      sourceUrl: article.source_url,
      generatedAt: article.created_at,
      status: article.status as 'generating' | 'ready' | 'error',
      errorMessage: article.error_message,
      requestedAt: new Date(article.created_at).getTime(),
      completedAt: article.completed_at ? new Date(article.completed_at).getTime() : undefined,
    }));
  },

  async createArticle(
    userId: string,
    article: { title: string; sourceUrl: string }
  ): Promise<string> {
    const { data, error } = await supabase
      .from('generated_articles')
      .insert({
        user_id: userId,
        title: article.title,
        source_url: article.sourceUrl,
        status: 'generating',
        content: '',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating article:', error);
      throw error;
    }

    return data.id;
  },

  async updateArticle(
    articleId: string,
    updates: {
      content?: string;
      status?: 'generating' | 'ready' | 'error';
      errorMessage?: string;
      completedAt?: number;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, any> = {};

    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = new Date(updates.completedAt).toISOString();

    const { error } = await supabase
      .from('generated_articles')
      .update(dbUpdates)
      .eq('id', articleId);

    if (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  async deleteArticle(articleId: string): Promise<void> {
    const { error } = await supabase
      .from('generated_articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  },

  async addSearchHistory(userId: string, query: string, resultsCount: number): Promise<void> {
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        query,
        results_count: resultsCount,
      });

    if (error) {
      console.error('Error adding search history:', error);
    }
  },

  async getSearchHistory(userId: string, limit: number = 10): Promise<string[]> {
    const { data, error } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }

    const uniqueQueries = Array.from(new Set(data.map(item => item.query)));
    return uniqueQueries;
  },

  async clearSearchHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  },
};
