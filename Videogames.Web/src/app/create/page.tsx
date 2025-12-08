'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideogameService } from '../../infrastructure/services/VideogameService';
import { GameState } from '../../domain/models/Videogame';

export default function CreateVideogamePage() {
  const [formData, setFormData] = useState({
    englishName: '',
    qr: '',
    codebar: '',
    console: '',
    state: GameState.Sealed,
    releaseDate: '',
    versionGame: '',
  });
  const router = useRouter();
  const videogameService = new VideogameService();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await videogameService.create({
        ...formData,
        names: [], // Add logic for localized names if needed
        assets: [],
        images: [],
        state: Number(formData.state),
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to create videogame', error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-10">
      <div className="bg-slate-700 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Videogame</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white">English Name</label>
            <input name="englishName" onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-white">Console</label>
            <input name="console" onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-white">QR Code</label>
              <input name="qr" onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-white">Barcode</label>
              <input name="codebar" onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-white">State</label>
            <select name="state" onChange={handleChange} className="w-full border p-2 rounded">
              <option value={GameState.Sealed}>Sealed</option>
              <option value={GameState.Opened}>Opened</option>
              <option value={GameState.Damaged}>Damaged</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-white">Release Date</label>
            <input name="releaseDate" type="date" onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div className="mb-6">
            <label className="block text-white">Version</label>
            <input name="versionGame" onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Create Videogame
          </button>
        </form>
      </div>
    </div>
  );
}
