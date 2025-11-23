'use client';

import { useEffect, useState } from 'react';
import { Videogame } from '../domain/models/Videogame';
import { VideogameService } from '../infrastructure/services/VideogameService';
import VideogameCard from '../components/VideogameCard';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const [videogames, setVideogames] = useState<Videogame[]>([]);
  const { isAuthenticated } = useAuth();
  const videogameService = new VideogameService();

  useEffect(() => {
    loadVideogames();
  }, []);

  const loadVideogames = async () => {
    try {
      const data = await videogameService.getAll();
      setVideogames(data);
    } catch (error) {
      console.error('Failed to load videogames', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      try {
        await videogameService.delete(id);
        loadVideogames();
      } catch (error) {
        console.error('Failed to delete videogame', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Videogames</h1>
        {isAuthenticated && (
          <Link href="/create" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Add New Game
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videogames.map((game) => (
          <VideogameCard 
            key={game.id} 
            videogame={game} 
            isAuthenticated={isAuthenticated}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {videogames.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No videogames found.</p>
      )}
    </div>
  );
}
