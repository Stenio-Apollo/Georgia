import type { ImageSourcePropType } from 'react-native';
import type { PlanetName } from '../../lesson/types';

export const planets: Record<PlanetName, ImageSourcePropType> = {
  mercury: require('../../assets/images/Mercury.jpeg'),
  venus: require('../../assets/images/venus pantone - Simon Lee.jpeg'),
  earth: require('../../assets/images/earth.jpeg'),
  moon: require('../../assets/images/Moon.jpeg'),
  mars: require('../../assets/images/Marte.jpeg'),
  jupiter: require('../../assets/images/Jupiter.jpeg'),
  saturn: require('../../assets/images/Saturno.jpeg'),
  uranus: require('../../assets/images/Uranus.jpeg'),
  neptune: require('../../assets/images/Neptuno.jpeg'),
  pluto: require('../../assets/images/pluto.jpeg'),
  sun: require('../../assets/images/sun.jpeg'),
};
