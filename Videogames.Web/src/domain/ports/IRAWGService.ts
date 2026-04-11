export interface RAWGPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RAWGGame {
  id: number;
  slug: string;
  name: string;
  released: string;
  tba: boolean;
  background_image: string;
  rating: number;
  metacritic: number;
  platforms: RAWGPlatform[];
  description_raw?: string;
}

export interface IRAWGService {
  searchGames(query: string): Promise<RAWGGame[]>;
  getGameDetails(id: number | string): Promise<RAWGGame>;
}
