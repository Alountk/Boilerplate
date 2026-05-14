import { resolveFrontendAssetSrc } from "../utils/videogameImages";

export const CATEGORIES = [
  {
    id: "ps",
    name: "PlayStation",
    color: "bg-blue-600",
    img: resolveFrontendAssetSrc("assets/categories/playstation.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 0, // Maps to backend Category enum/int
  },
  {
    id: "xbox",
    name: "Xbox",
    color: "bg-green-600",
    img: resolveFrontendAssetSrc("assets/categories/xbox.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 1,
  },
  {
    id: "nintendo",
    name: "Nintendo",
    color: "bg-red-600",
    img: resolveFrontendAssetSrc("assets/categories/nintendo.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 2,
  },
  {
    id: "pc",
    name: "PC Gaming",
    color: "bg-gray-800",
    img: resolveFrontendAssetSrc("assets/categories/pc-gaming.jpg"),
    subcategories: ["Hardware", "Games", "Peripherals"],
    categoryId: 4,
  },
  {
    id: "retro",
    name: "Retro Gaming",
    color: "bg-yellow-600",
    img: resolveFrontendAssetSrc("assets/categories/retro-gaming.jpg"),
    subcategories: ["Consoles", "Arcade", "Collectibles"],
    categoryId: 5,
  },
];
