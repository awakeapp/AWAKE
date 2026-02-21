import { QUOTES_EN } from './quotes_en';
import { QUOTES_AR } from './quotes_ar';
import { QUOTES_ML } from './quotes_ml';
import { QUOTES_KN } from './quotes_kn';
import { QUOTES_KN2 } from './quotes_kn2';

export const QUOTES = {
  en: QUOTES_EN,
  ar: QUOTES_AR,
  ml: QUOTES_ML,
  kn: [...QUOTES_KN, ...QUOTES_KN2]
};
