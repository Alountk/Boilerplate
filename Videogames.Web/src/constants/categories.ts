import { resolveFrontendAssetSrc } from "../utils/videogameImages";

export const CATEGORIES = [
  {
    id: "ps",
    name: "PlayStation",
    img: resolveFrontendAssetSrc("assets/categories/playstation.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 0, // Maps to backend Category enum/int
  },
  {
    id: "xbox",
    name: "Xbox",
    img: resolveFrontendAssetSrc("assets/categories/xbox.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 1,
  },
  {
    id: "nintendo",
    name: "Nintendo",
    img: resolveFrontendAssetSrc("assets/categories/nintendo.jpg"),
    subcategories: ["Videogames", "Accessories", "Merchandising"],
    categoryId: 2,
  },
  {
    id: "pc",
    name: "PC Gaming",
    img: resolveFrontendAssetSrc("assets/categories/pc-gaming.jpg"),
    subcategories: ["Hardware", "Games", "Peripherals"],
    categoryId: 4,
  },
  {
    id: "retro",
    name: "Retro Gaming",
    img: resolveFrontendAssetSrc("assets/categories/retro-gaming.jpg"),
    subcategories: ["Consoles", "Arcade", "Collectibles"],
    categoryId: 5,
  },
];
