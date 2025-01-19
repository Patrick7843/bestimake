import { useState, useEffect } from 'react';

interface Model {
  id: string;
  created: number;
  owned_by: string;
}

interface ModelsResponse {
  data: Model[];
  object: string;
}

class APIService {
  private baseURL: string | null = null;
  private apiKey: string | null = null;
  private models: Model[] = [];

  setConfig(baseURL: string, apiKey: string) {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.apiKey = apiKey;
  }

  getConfig() {
    return {
      baseURL: this.baseURL,
      apiKey: this.apiKey
    };
  }

  async fetchModels(): Promise<Model[]> {
    if (!this.baseURL || !this.apiKey) {
      throw new Error('API configuration not set');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ModelsResponse = await response.json();
      this.models = data.data;
      return this.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async generateChatCompletion(messages: any[], model: string) {
    if (!this.baseURL || !this.apiKey) {
      throw new Error('API configuration not set');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw error;
    }
  }

  async generateCompletion(prompt: string, model: string) {
    if (!this.baseURL || !this.apiKey) {
      throw new Error('API configuration not set');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }
}

export const apiService = new APIService();

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedModels = await apiService.fetchModels();
      setModels(fetchedModels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  return { models, loading, error, loadModels };
}