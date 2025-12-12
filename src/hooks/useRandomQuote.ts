import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface Quote {
  text: string;
  author: string;
}

const QUOTES_EN: Quote[] = [
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "The art is not in making money, but in keeping it.", author: "Proverb" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "It's not how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "The quickest way to double your money is to fold it over and put it back in your pocket.", author: "Will Rogers" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "You must gain control over your money or the lack of it will forever control you.", author: "Dave Ramsey" },
  { text: "Never spend your money before you have it.", author: "Thomas Jefferson" },
  { text: "Investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Time is more valuable than money. You can get more money, but you cannot get more time.", author: "Jim Rohn" },
  { text: "Rich people believe 'I create my life'. Poor people believe 'Life happens to me'.", author: "T. Harv Eker" },
  { text: "Formal education will make you a living; self-education will make you a fortune.", author: "Jim Rohn" }
];

const QUOTES_FR: Quote[] = [
  { text: "Un budget, c'est dire à votre argent où aller au lieu de vous demander où il est passé.", author: "Dave Ramsey" },
  { text: "Ne dépensez pas ce qu'il reste après avoir épargné, mais épargnez ce qu'il reste après avoir dépensé.", author: "Warren Buffett" },
  { text: "L'art n'est pas de gagner de l'argent, mais de le conserver.", author: "Proverbe" },
  { text: "Méfiez-vous des petites dépenses. Une petite fuite peut faire couler un grand navire.", author: "Benjamin Franklin" },
  { text: "Ce n'est pas combien d'argent vous gagnez, mais combien vous gardez.", author: "Robert Kiyosaki" },
  { text: "La richesse ne consiste pas à avoir de grandes possessions, mais à avoir peu de besoins.", author: "Épictète" },
  { text: "L'argent est un maître terrible mais un excellent serviteur.", author: "P.T. Barnum" },
  { text: "Le moyen le plus rapide de doubler votre argent est de le plier en deux et de le remettre dans votre poche.", author: "Will Rogers" },
  { text: "La liberté financière est disponible pour ceux qui apprennent à ce sujet et travaillent pour l'obtenir.", author: "Robert Kiyosaki" },
  { text: "Vous devez prendre le contrôle de votre argent ou son manque vous contrôlera pour toujours.", author: "Dave Ramsey" },
  { text: "Ne dépensez jamais votre argent avant de l'avoir.", author: "Thomas Jefferson" },
  { text: "L'investissement dans la connaissance paie le meilleur intérêt.", author: "Benjamin Franklin" },
  { text: "Le temps est plus précieux que l'argent. Vous pouvez obtenir plus d'argent, mais vous ne pouvez pas obtenir plus de temps.", author: "Jim Rohn" },
  { text: "Les riches croient 'Je crée ma vie'. Les pauvres croient 'La vie m'arrive'.", author: "T. Harv Eker" },
  { text: "L'éducation formelle vous permettra de gagner votre vie ; l'auto-éducation vous fera une fortune.", author: "Jim Rohn" }
];

export function useRandomQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    // Select a random quote on mount or language change
    const quotes = i18n.language.startsWith('fr') ? QUOTES_FR : QUOTES_EN;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, [i18n.language]);

  return quote;
}
