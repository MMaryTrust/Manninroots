import dosa from '../assets/dosa.jpg';
import biryani from '../assets/biryani.jpg';
import meals from '../assets/meals.jpg';
import kothu from '../assets/kothu.jpg';
import chettinad from '../assets/chettinad.jpg';
import sweets from '../assets/sweets.jpg';

export const CUISINE_IMAGES = {
  'South Indian': dosa,
  Biryani: biryani,
  'Traditional Meals': meals,
  'Millet Specials': chettinad,
  'Street Food': kothu,
  'Healthy & Light': sweets,
};

export const cuisineImage = (cuisine) => CUISINE_IMAGES[cuisine] || meals;
