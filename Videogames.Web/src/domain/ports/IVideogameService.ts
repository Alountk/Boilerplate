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
