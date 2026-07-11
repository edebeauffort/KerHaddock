// Background photos for the booking option buttons — one per whole house,
// one per individual room. Add your own photos to /public/options with
// these exact names; any option without a matching file just shows a plain
// colored card instead of a photo, nothing breaks.
export const WHOLE_HOUSE_IMAGES: Record<string, string> = {
  "Grande maison": "/options/grande-maison-entiere.jpg",
  "Petite maison": "/options/petite-maison-entiere.jpg",
};

export const ROOM_IMAGES: Record<string, string> = {
  "Chambre Daddy & Grany": "/options/chambre-daddy-grany.jpg",
  "Chambre du fond": "/options/chambre-du-fond.jpg",
  "Chambre meteo Beaufort": "/options/chambre-meteo-beaufort.jpg",
  "Chambre aux phares": "/options/chambre-aux-phares.jpg",
  "Chambre aux poissons": "/options/chambre-aux-poissons.jpg",
  "Dortoir": "/options/dortoir.jpg",
};
