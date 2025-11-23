import { IVideogameService, CreateVideogameRequest, UpdateVideogameRequest } from '../../domain/ports/IVideogameService';
import { Videogame } from '../../domain/models/Videogame';
import { axiosInstance } from '../api/axiosInstance';

export class VideogameService implements IVideogameService {
  async getAll(): Promise<Videogame[]> {
    const response = await axiosInstance.get<Videogame[]>('/Videogames');
    return response.data;
  }

  async getById(id: string): Promise<Videogame> {
    const response = await axiosInstance.get<Videogame>(`/Videogames/${id}`);
    return response.data;
  }

  async create(data: CreateVideogameRequest): Promise<Videogame> {
    const response = await axiosInstance.post<Videogame>('/Videogames', data);
    return response.data;
  }

  async update(id: string, data: UpdateVideogameRequest): Promise<Videogame> {
    const response = await axiosInstance.put<Videogame>(`/Videogames/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/Videogames/${id}`);
  }
}
