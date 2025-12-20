import { Videogame } from "../models/Videogame";

export interface CreateVideogameRequest {
  englishName: string;
  names: { language: string; name: string }[];
  qr: string;
  codebar: string;
  console: string;
  assets: string[];
  images: string[];
  state: number;
  releaseDate: string;
  versionGame: string;
  description: string;
  urlImg: string;
  generalState: number;
  averagePrice: number;
  ownPrice: number;
  acceptOffersRange: number;
  score: number;
  category: number;
  contents: {
    frontalUrl: string;
    backUrl: string;
    rightSideUrl: string;
    leftSideUrl: string;
    topSideUrl: string;
    bottomSideUrl: string;
  }[];
}

export interface UpdateVideogameRequest extends Partial<CreateVideogameRequest> {
  id: string;
}

export interface IVideogameService {
  getAll(): Promise<Videogame[]>;
  getById(id: string): Promise<Videogame>;
  create(data: CreateVideogameRequest): Promise<Videogame>;
  update(id: string, data: UpdateVideogameRequest): Promise<Videogame>;
  delete(id: string): Promise<void>;
}
