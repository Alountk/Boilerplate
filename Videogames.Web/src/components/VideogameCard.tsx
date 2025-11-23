import { Videogame } from '../domain/models/Videogame';

interface VideogameCardProps {
  videogame: Videogame;
  onDelete?: (id: string) => void;
  isAuthenticated: boolean;
}

export default function VideogameCard({ videogame, onDelete, isAuthenticated }: VideogameCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-md bg-white">
      <h3 className="text-xl font-bold mb-2">{videogame.englishName}</h3>
      <p className="text-gray-600 mb-2">Console: {videogame.console}</p>
      <p className="text-gray-600 mb-2">Release Date: {new Date(videogame.releaseDate).toLocaleDateString()}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-sm ${videogame.state === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {videogame.state === 0 ? 'Sealed' : 'Opened'} 
        </span>
        {isAuthenticated && onDelete && (
          <button 
            onClick={() => onDelete(videogame.id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
