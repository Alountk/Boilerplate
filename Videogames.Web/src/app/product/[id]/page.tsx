"use client";

import { useEffect, useState, use } from "react";
import { Videogame } from "../../../domain/models/Videogame";
import { VideogameService } from "../../../infrastructure/services/VideogameService";
import { ChatService } from "../../../infrastructure/services/ChatService";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { 
  ChatBubbleLeftRightIcon, 
  ChevronLeftIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StarIcon as StarIconSolid 
} from "@heroicons/react/24/solid";
import { 
  StarIcon as StarIconOutline,
  CalendarIcon,
  CpuChipIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [videogame, setVideogame] = useState<Videogame | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const videogameService = new VideogameService();
  const chatService = new ChatService();

  useEffect(() => {
    videogameService.getById(id).then((data) => {
      setVideogame(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!videogame) return;

    setStartingChat(true);
    try {
      const conv = await chatService.startConversation(videogame.id);
      router.push(`/messages?conv=${conv.id}`);
    } catch (err) {
      console.error("Failed to start conversation", err);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!videogame) return (
    <div className="min-h-screen flex flex-col items-center justify-center dark:text-white">
      <h2 className="text-2xl font-bold mb-4">Product not found</h2>
      <button onClick={() => router.back()} className="text-blue-600 font-bold hover:underline flex items-center gap-2">
        <ChevronLeftIcon className="h-5 w-5" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images Column */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={videogame.urlImg || "/placeholder-game.jpg"} 
                alt={videogame.englishName}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full shadow-lg">
                  {videogame.state === 0 ? 'Sealed' : 'Used'}
                </span>
              </div>
            </div>

            {/* Thumbnail Grid for other sides */}
            <div className="grid grid-cols-6 gap-2">
               {videogame.images?.map((img, i) => (
                  <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Side ${i}`} className="w-full h-full object-cover" />
                  </div>
               ))}
            </div>
          </div>

          {/* Right: Info Column */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                  {videogame.console}
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-bold dark:text-white">{videogame.score.toFixed(1)}</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {videogame.englishName}
              </h1>
              
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  ${videogame.ownPrice.toFixed(2)}
                </span>
                {videogame.averagePrice > videogame.ownPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ${videogame.averagePrice.toFixed(2)}
                  </span>
                )}
                <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  {Math.round((1 - videogame.ownPrice / videogame.averagePrice) * 100)}% Savings
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all active:scale-95">
                <ShoppingBagIcon className="h-6 w-6" /> Buy Now
              </button>
              <button 
                onClick={handleContactSeller}
                disabled={startingChat}
                className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-400 text-gray-900 dark:text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all active:scale-95"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                {startingChat ? 'Connecting...' : 'Contact Seller'}
              </button>
            </div>

            {/* Small badges/features */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8">
              <div className="flex flex-col items-center text-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 mb-1" />
                <span className="text-[10px] font-bold dark:text-gray-300 uppercase tracking-tight">Purchase Protection</span>
              </div>
               <div className="flex flex-col items-center text-center">
                <CalendarIcon className="h-6 w-6 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold dark:text-gray-300 uppercase tracking-tight">Released {new Date(videogame.releaseDate).getFullYear()}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <CheckBadgeIcon className="h-6 w-6 text-indigo-600 mb-1" />
                <span className="text-[10px] font-bold dark:text-gray-300 uppercase tracking-tight">Verified Seller</span>
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-8">
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Product Description</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {videogame.description || "No description provided by the seller."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CpuChipIcon className="h-4 w-4 text-blue-600" /> Console & Region
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{videogame.console} ({videogame.versionGame || 'Unknown Region'})</p>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <StarIconOutline className="h-4 w-4 text-blue-600" /> Condition Detail
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{videogame.generalState}/10 General State</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
