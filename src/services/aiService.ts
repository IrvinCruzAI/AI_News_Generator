/**
 * AI Service - Supports multiple free/paid providers
 * Priority: Gemini (free) → Groq (free) → OpenAI (paid)
 */

interface ArticleRequest {
  title: string;
  description: string;
  sourceUrl: string;
  source: string;
}

interface AIProvider {
  name: string;
  generate: (request: ArticleRequest) => Promise<string>;
  isConfigured: () => boolean;
}

// Google Gemini (FREE - 15 req/min, 1M req/day)
const geminiProvider: AIProvider = {
  name: 'Gemini',
  
  async generate(request: ArticleRequest): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    const prompt = `Write a comprehensive, well-researched article based on this news headline.

Title: ${request.title}
Description: ${request.description}
Source: ${request.source}

Requirements:
- Write 500-800 words
- Include an engaging introduction
- Present factual information from the context
- Use clear, professional journalism style
- Include relevant background context
- End with implications or future outlook
- Format in clean paragraphs (no markdown headers)

Write the article now:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  isConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }
};

// Groq (FREE - fast inference, rate limited)
const groqProvider: AIProvider = {
  name: 'Groq',
  
  async generate(request: ArticleRequest): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a professional news writer. Write comprehensive, factual articles based on headlines.'
          },
          {
            role: 'user',
            content: `Write a 500-800 word article about: ${request.title}\n\nContext: ${request.description}\n\nSource: ${request.source}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  isConfigured(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY;
  }
};

// OpenAI (PAID - fallback)
const openaiProvider: AIProvider = {
  name: 'OpenAI',
  
  async generate(request: ArticleRequest): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper than GPT-4
        messages: [
          {
            role: 'system',
            content: 'You are a professional news writer. Write comprehensive, factual articles based on headlines.'
          },
          {
            role: 'user',
            content: `Write a 500-800 word article about: ${request.title}\n\nContext: ${request.description}\n\nSource: ${request.source}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }
};

// Provider priority (free first)
const providers = [geminiProvider, groqProvider, openaiProvider];

/**
 * Generate article using first available provider
 */
export async function generateArticle(request: ArticleRequest): Promise<{
  content: string;
  provider: string;
}> {
  // Try each provider in order
  for (const provider of providers) {
    if (provider.isConfigured()) {
      try {
        console.log(`[AI Service] Trying ${provider.name}...`);
        const content = await provider.generate(request);
        console.log(`[AI Service] Success with ${provider.name}`);
        return { content, provider: provider.name };
      } catch (error) {
        console.error(`[AI Service] ${provider.name} failed:`, error);
        // Try next provider
        continue;
      }
    }
  }

  throw new Error('No AI provider configured. Please add VITE_GEMINI_API_KEY (free) or VITE_OPENAI_API_KEY to .env');
}

/**
 * Get currently configured providers
 */
export function getConfiguredProviders(): string[] {
  return providers
    .filter(p => p.isConfigured())
    .map(p => p.name);
}
