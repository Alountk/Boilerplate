import axios from 'axios';
import { IRAWGService, RAWGGame } from '../../domain/ports/IRAWGService';

export class RAWGService implements IRAWGService {
  private readonly baseUrl = 'https://api.rawg.io/api';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_RAWG_API_KEY || '';
    if (!this.apiKey) {
      console.warn('RAWG API Key is missing. Please set NEXT_PUBLIC_RAWG_API_KEY in your .env file.');
    }
  }

  async searchGames(query: string): Promise<RAWGGame[]> {
    if (!query || query.length < 3) return [];
    
    try {
      const response = await axios.get(`${this.baseUrl}/games`, {
        params: {
          key: this.apiKey,
          search: query,
          page_size: 10,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching games in RAWG:', error);
      return [];
    }
  }

  async getGameDetails(id: number | string): Promise<RAWGGame> {
    try {
      const response = await axios.get(`${this.baseUrl}/games/${id}`, {
        params: {
          key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching game details from RAWG:', error);
      throw error;
    }
  }
}
