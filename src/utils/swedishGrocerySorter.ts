import { SwedishShoppingCategory } from '../types';

export const SWEDISH_CATEGORY_ORDER: SwedishShoppingCategory[] = [
  'Frukt & Grönt',
  'Bröd & Bageri',
  'Mejeri, Ost & Ägg',
  'Kött, Fågel & Chark',
  'Fisk & Skaldjur',
  'Skafferi & Torrvaror',
  'Fryst',
  'Dryck',
  'Snacks & Sötsaker',
  'Hem & Hygien',
  'Övrigt',
];

const CATEGORY_KEYWORDS: Record<SwedishShoppingCategory, string[]> = {
  'Frukt & Grönt': [
    'äpple', 'äpplen', 'banan', 'bananer', 'apelsin', 'citron', 'lime', 'päron', 'vindruvor',
    'avokado', 'tomat', 'tomater', 'körsbärstomat', 'gurka', 'sallad', 'isbergssallad', 'ruccola',
    'spenat', 'babyspenat', 'potatis', 'färskpotatis', 'sötpotatis', 'morot', 'morötter', 'lök',
    'rödlök', 'gul lök', 'vitlök', 'purjolök', 'salladslök', 'paprika', 'chili', 'ingefära',
    'broccoli', 'blomkål', 'zucchini', 'squash', 'aubergine', 'svamp', 'champinjoner', 'kantareller',
    'dill', 'persilja', 'basilika', 'koriander', 'timjan', 'rosmarin', 'mynta', 'gräslök',
    'kål', 'vitkål', 'rödkål', 'grönkål', 'sparris', 'selleri', 'rädisor', 'rödbetor', 'palsternacka',
    'jordgubbar', 'blåbär', 'hallon', 'björnbär', 'mango', 'ananas', 'melon', 'vattenmelon', 'kiwi',
    'clementin', 'mandarin', 'nektarin', 'persika', 'plommon', 'lingon'
  ],
  'Bröd & Bageri': [
    'bröd', 'limpa', 'surdeg', 'surdegsbröd', 'rostbröd', 'formbröd', 'knäckebröd', 'tunnbröd',
    'tortilla', 'tortillabröd', 'pitabröd', 'hamburgerbröd', 'korvbröd', 'fralla', 'frallor',
    'baguette', 'ciabatta', 'croissant', 'bulle', 'bullar', 'kanelbullar', 'kardemummabullar',
    'skorpor', 'kex', 'riskakor'
  ],
  'Mejeri, Ost & Ägg': [
    'mjölk', 'mellanmjölk', 'standardmjölk', 'lättmjölk', 'havredryck', 'ikaffe', 'grädde',
    'vispgrädde', 'matlagningsgrädde', 'crème fraiche', 'creme fraiche', 'gräddfil', 'yoghurt',
    'turkisk yoghurt', 'grekisk yoghurt', 'fil', 'filmjölk', 'kvarg', 'keso', 'smör', 'bregott',
    'margarin', 'ost', 'hushållsost', 'prästost', 'herrgårdsost', 'västerbottensost', 'grevé',
    'mozzarella', 'parmesan', 'fetaost', 'halloumi', 'cheddar', 'brie', 'färskost', 'philadelphia',
    'ägg', 'jästa', 'jäst'
  ],
  'Kött, Fågel & Chark': [
    'kött', 'nötfärs', 'blandfärs', 'fläskfärs', 'köttfärs', 'vegofärs', 'kyckling', 'kycklingfilé',
    'kycklinglår', 'kalkon', 'oxfilé', 'entrecote', 'ryggbiff', 'högrev', 'fläskfilé', 'fläskkotlett',
    'karré', 'sidfläsk', 'bacon', 'korv', 'falukorv', 'grillkorv', 'chorizo', 'prinskorv', 'salami',
    'skinka', 'kokt skinka', 'rökt skinka', 'parmaskinka', 'köttbullar', 'blodpudding', 'leverpastej',
    'lamm', 'renskav', 'vilt'
  ],
  'Fisk & Skaldjur': [
    'fisk', 'lax', 'laxfilé', 'kallrökt lax', 'gravad lax', 'torsk', 'torskrygg', 'sej', 'kolja',
    'rödspätta', 'sill', 'strömming', 'makrill', 'tonfisk', 'räkor', 'skaldjur', 'kräftor', 'musslor',
    'fiskpinnar', 'fiskbullar', 'kaviar', 'rom', 'stenbitsrom'
  ],
  'Skafferi & Torrvaror': [
    'pasta', 'spaghetti', 'makaroner', 'penne', 'tagliatelle', 'lasagneplattor', 'nudlar',
    'ris', 'jasminris', 'basmatiris', 'avorioris', 'matvete', 'bulgur', 'couscous', 'quinoa',
    'havregryn', 'müsli', 'granola', 'flingor', 'cornflakes', 'mjöl', 'vetemjöl', 'grahamsmjöl',
    'rågmjöl', 'socker', 'strösocker', 'florsocker', 'farinsocker', 'sirap', 'honung', 'bakpulver',
    'vaniljsocker', 'kakao', 'torrjäst', 'salt', 'flingsalt', 'peppar', 'svartpeppar', 'kanel',
    'kardemumma', 'curry', 'spiskummin', 'oregano', 'paprikapulver', 'buljong', 'fond', 'soja',
    'rapsolja', 'olivolja', 'vinäger', 'balsamvinäger', 'ättika', 'krossade tomater', 'passerade tomater',
    'tomatpuré', 'kokosmjölk', 'bönor', 'svarta bönor', 'kidneybönor', 'kikärtor', 'linser', 'röda linser',
    'ketchup', 'senap', 'majonnäs', 'bea', 'bearnaisesås', 'salsa', 'tacosås', 'tacokrydda',
    'sylt', 'lingonsylt', 'marmelad', 'jordnötssmör', 'nutella', 'oliver', 'kapris', 'soltorkade tomater',
    'nötter', 'mandlar', 'valnötter', 'cashewnötter', 'solrosfrön', 'pumpakärnor', 'chiafrön'
  ],
  'Fryst': [
    'fryst', 'frysta', 'djupfryst', 'glass', 'pinnglass', 'gräddglass', 'pommes', 'pommes frites',
    'pyttipanna', 'frysta bär', 'frysta hallon', 'frysta blåbär', 'frysta ärtor', 'gröna ärtor',
    'fryst majs', 'fryst broccoli', 'fryst spenat', 'fryspizza', 'pirog'
  ],
  'Dryck': [
    'kaffe', 'bryggkaffe', 'espresso', 'kaffebönor', 'te', 'örtte', 'juice', 'apelsinjuice',
    'äppelmust', 'saft', 'läsk', 'cola', 'coca-cola', 'pepsi', 'fanta', 'sprite', 'trocamero',
    'julmust', 'påskmust', 'kolsyrat vatten', 'mineralvatten', 'loka', 'ramlösa', 'energidryck',
    'öl', 'lättöl', 'folköl', 'cider', 'vin', 'alkoholfritt'
  ],
  'Snacks & Sötsaker': [
    'chips', 'ostbågar', 'jordnötter', 'popcorn', 'dippmix', 'choklad', 'mjölkchoklad', 'mörk choklad',
    'godis', 'lösgodis', 'smågodis', 'lakrits', 'geléhallon', 'bilar', 'kakor', 'ballerina', 'kexchoklad',
    'tårta', 'bakelse'
  ],
  'Hem & Hygien': [
    'toapapper', 'toalettpapper', 'hushållspapper', 'servetter', 'diskmedel', 'maskindisktabletter',
    'tvättmedel', 'sköljmedel', 'soppåsar', 'avfallspåsar', 'fryspåsar', 'plastfolie', 'aluminiumfolie',
    'bakplåtspapper', 'tvål', 'handtvål', 'duschkräm', 'schampo', 'balsam', 'tandkräm', 'tandborste',
    'tandtråd', 'deodorant', 'hudkräm', 'plåster', 'värktabletter', 'alvedon', 'ipren', 'blöjor',
    'våtservetter', 'kattsand', 'kattmat', 'hundmat', 'batterier', 'ljus', 'värmeljus'
  ],
  'Övrigt': [],
};

export function classifySwedishGrocery(itemName: string): SwedishShoppingCategory {
  const normalized = itemName.trim().toLowerCase();
  if (!normalized) return 'Övrigt';

  // Check "fryst" prefix first because "frysta hallon" belongs in Fryst rather than Frukt & Grönt
  for (const kw of CATEGORY_KEYWORDS['Fryst']) {
    if (normalized.includes(kw)) {
      return 'Fryst';
    }
  }

  for (const category of SWEDISH_CATEGORY_ORDER) {
    if (category === 'Fryst' || category === 'Övrigt') continue;
    const keywords = CATEGORY_KEYWORDS[category];
    for (const kw of keywords) {
      if (normalized === kw || normalized.includes(kw)) {
        return category;
      }
    }
  }

  return 'Övrigt';
}
