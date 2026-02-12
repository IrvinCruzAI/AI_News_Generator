/**
 * Rate limiter to prevent abuse and control costs
 * FREE tier limits:
 * - 25 searches per day
 * - 10 articles per day
 * - Max 3 concurrent generations
 */

interface UsageData {
  date: string;
  searches: number;
  articles: number;
  lastReset: number;
}

const LIMITS = {
  FREE: {
    searchesPerDay: 25,
    articlesPerDay: 10,
    maxConcurrent: 3
  }
};

class RateLimiter {
  private storageKey = 'newsgen_usage';

  private getUsage(): UsageData {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(this.storageKey);
    
    if (!stored) {
      return this.resetUsage();
    }

    const usage: UsageData = JSON.parse(stored);
    
    // Reset if different day
    if (usage.date !== today) {
      return this.resetUsage();
    }

    return usage;
  }

  private resetUsage(): UsageData {
    const usage: UsageData = {
      date: new Date().toDateString(),
      searches: 0,
      articles: 0,
      lastReset: Date.now()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
    return usage;
  }

  private saveUsage(usage: UsageData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(usage));
  }

  canSearch(): { allowed: boolean; remaining: number; message?: string } {
    const usage = this.getUsage();
    const remaining = LIMITS.FREE.searchesPerDay - usage.searches;

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        message: `Daily search limit reached (${LIMITS.FREE.searchesPerDay}/day). Resets at midnight.`
      };
    }

    return { allowed: true, remaining };
  }

  canGenerateArticle(currentGenerating: number): { 
    allowed: boolean; 
    remaining: number; 
    message?: string 
  } {
    const usage = this.getUsage();
    const articlesRemaining = LIMITS.FREE.articlesPerDay - usage.articles;

    // Check daily limit
    if (articlesRemaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        message: `Daily article limit reached (${LIMITS.FREE.articlesPerDay}/day). Resets at midnight.`
      };
    }

    // Check concurrent limit
    if (currentGenerating >= LIMITS.FREE.maxConcurrent) {
      return {
        allowed: false,
        remaining: articlesRemaining,
        message: `Maximum ${LIMITS.FREE.maxConcurrent} articles can generate at once. Please wait.`
      };
    }

    return { allowed: true, remaining: articlesRemaining };
  }

  recordSearch(): void {
    const usage = this.getUsage();
    usage.searches++;
    this.saveUsage(usage);
  }

  recordArticle(): void {
    const usage = this.getUsage();
    usage.articles++;
    this.saveUsage(usage);
  }

  getStats(): {
    searchesUsed: number;
    searchesRemaining: number;
    articlesUsed: number;
    articlesRemaining: number;
    resetsAt: string;
  } {
    const usage = this.getUsage();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      searchesUsed: usage.searches,
      searchesRemaining: LIMITS.FREE.searchesPerDay - usage.searches,
      articlesUsed: usage.articles,
      articlesRemaining: LIMITS.FREE.articlesPerDay - usage.articles,
      resetsAt: tomorrow.toLocaleTimeString()
    };
  }
}

export const rateLimiter = new RateLimiter();
