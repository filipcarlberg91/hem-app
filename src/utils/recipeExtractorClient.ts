import { GoogleGenAI, Type } from '@google/genai';
import { getApiUrl } from './apiUrl';

const recipeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Receptets namn på svenska.',
    },
    description: {
      type: Type.STRING,
      description: 'Kort aptitretande beskrivning på svenska (1-2 meningar).',
    },
    prepTime: {
      type: Type.STRING,
      description: 'Tillagningstid, t.ex. "35 min" eller "45 min".',
    },
    servings: {
      type: Type.INTEGER,
      description: 'Antal portioner, t.ex. 4.',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Kategoritaggar på svenska, t.ex. ["Vardagsmat", "Snabbt", "Vegetariskt", "Husmanskost"].',
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Ingrediensens namn på svenska, t.ex. "Vispgrädde"',
          },
          amount: {
            type: Type.NUMBER,
            description: 'Mängd som siffra, t.ex. 2.5',
          },
          unit: {
            type: Type.STRING,
            description:
              'Enhet på svenska, t.ex. "dl", "g", "st", "msk", "tsk", "förp"',
          },
        },
        required: ['name', 'amount', 'unit'],
      },
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tydliga tillagningssteg på svenska i rätt ordning.',
    },
  },
  required: [
    'title',
    'description',
    'prepTime',
    'servings',
    'tags',
    'ingredients',
    'steps',
  ],
};

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&aring;/gi, 'å')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&eacute;/gi, 'é')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseIsoDurationToSwedish(iso?: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return '';
  const days = Number(m[1] || 0);
  const hours = Number(m[2] || 0) + days * 24;
  const mins = Number(m[3] || 0);
  if (hours > 0 && mins > 0) return `${hours} tim ${mins} min`;
  if (hours > 0) return `${hours * 60} min`;
  if (mins > 0) return `${mins} min`;
  return '';
}

export function parseIngredientLineToStructured(rawLine: string): {
  name: string;
  amount: number;
  unit: string;
} {
  let line = decodeHtmlEntities(rawLine)
    .replace(/^[-•*▪▫◦]\s*/, '')
    .trim();

  // Replace unicode fractions
  const fracMap: Record<string, string> = {
    '½': '0.5',
    '⅓': '0.33',
    '⅔': '0.67',
    '¼': '0.25',
    '¾': '0.75',
    '⅕': '0.2',
  };
  for (const [k, v] of Object.entries(fracMap)) {
    line = line.replace(new RegExp(`(\\d+)\\s*${k}`, 'g'), (_, d) =>
      String(Number(d) + Number(v))
    );
    line = line.replace(new RegExp(k, 'g'), v);
  }

  // Handle "1 1/2 dl mjölk" or "1/2 tsk salt"
  line = line.replace(/^(\d+)\s+(\d+)\/(\d+)\b/, (_, whole, num, den) =>
    String(Number(whole) + Number(num) / Number(den))
  );
  line = line.replace(/^(\d+)\/(\d+)\b/, (_, num, den) =>
    String(Math.round((Number(num) / Number(den)) * 100) / 100)
  );

  const unitRegex =
    /^(\d+(?:[.,]\d+)?)(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*(kg|hg|g|gram|l|liter|dl|cl|ml|msk|tsk|krm|st|stycken|förp|fp|pkt|paket|burk|burkar|klyfta|klyftor|knippe|kruka|påse|påsar|skiva|skivor|nypa|port|portioner)\b\.?\s*(.+)$/i;
  const match = line.match(unitRegex);
  if (match) {
    const amount = parseFloat(match[1].replace(',', '.')) || 1;
    let unit = match[2].toLowerCase();
    if (unit === 'gram') unit = 'g';
    if (unit === 'liter') unit = 'l';
    if (unit === 'stycken') unit = 'st';
    if (unit === 'fp' || unit === 'paket' || unit === 'pkt') unit = 'förp';
    const name = match[3].replace(/^av\s+/i, '').trim();
    return {
      amount: Math.round(amount * 100) / 100,
      unit,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    };
  }

  const numOnlyRegex = /^(\d+(?:[.,]\d+)?)\s+(.+)$/;
  const numMatch = line.match(numOnlyRegex);
  if (numMatch) {
    const amount = parseFloat(numMatch[1].replace(',', '.')) || 1;
    const name = numMatch[2].trim();
    return {
      amount: Math.round(amount * 100) / 100,
      unit: 'st',
      name: name.charAt(0).toUpperCase() + name.slice(1),
    };
  }

  return {
    amount: 1,
    unit: 'st',
    name: line.charAt(0).toUpperCase() + line.slice(1),
  };
}

function findRecipeNodeInJsonLd(node: any): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNodeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }
  const typeVal = node['@type'];
  const isRecipe =
    typeVal === 'Recipe' ||
    (Array.isArray(typeVal) && typeVal.some((t) => String(t).includes('Recipe'))) ||
    (typeof typeVal === 'string' && typeVal.includes('Recipe'));

  if (isRecipe && (node.name || node.recipeIngredient)) {
    return node;
  }
  if (node['@graph']) {
    const found = findRecipeNodeInJsonLd(node['@graph']);
    if (found) return found;
  }
  if (node.mainEntity) {
    const found = findRecipeNodeInJsonLd(node.mainEntity);
    if (found) return found;
  }
  return null;
}

function extractStepsFromInstructions(rawInst: any): string[] {
  if (!rawInst) return [];
  if (typeof rawInst === 'string') {
    return decodeHtmlEntities(rawInst.replace(/<[^>]+>/g, '\n'))
      .split(/\r?\n|(?<=\.)\s+(?=[A-ZÅÄÖ])/)
      .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
      .filter((s) => s.length > 3);
  }
  if (Array.isArray(rawInst)) {
    const out: string[] = [];
    for (const item of rawInst) {
      out.push(...extractStepsFromInstructions(item));
    }
    return out;
  }
  if (typeof rawInst === 'object') {
    if (Array.isArray(rawInst.itemListElement)) {
      return extractStepsFromInstructions(rawInst.itemListElement);
    }
    const txt = rawInst.text || rawInst.name || '';
    if (typeof txt === 'string' && txt.trim()) {
      const clean = decodeHtmlEntities(txt.replace(/<[^>]+>/g, ' ')).trim();
      if (clean.length > 2) return [clean];
    }
  }
  return [];
}

function extractImageFromRecipeNode(imgNode: any): string | undefined {
  if (!imgNode) return undefined;
  if (typeof imgNode === 'string' && imgNode.startsWith('http')) return imgNode;
  if (Array.isArray(imgNode) && imgNode.length > 0) {
    return extractImageFromRecipeNode(imgNode[0]);
  }
  if (typeof imgNode === 'object') {
    if (typeof imgNode.url === 'string' && imgNode.url.startsWith('http')) {
      return imgNode.url;
    }
  }
  return undefined;
}

export function parseRecipeFromHtmlOrText(htmlOrText: string, sourceUrl: string): any | null {
  if (!htmlOrText || htmlOrText.length < 30) return null;

  // 1. Check all <script type="application/ld+json"> blocks for Schema.org Recipe
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(htmlOrText)) !== null) {
    const rawJson = match[1].trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson);
      const recipeNode = findRecipeNodeInJsonLd(parsed);
      if (recipeNode) {
        const title = decodeHtmlEntities(recipeNode.name || 'Importerat recept');
        const description = decodeHtmlEntities(
          (recipeNode.description || '').replace(/<[^>]+>/g, ' ')
        );
        const prepTime =
          parseIsoDurationToSwedish(recipeNode.totalTime) ||
          parseIsoDurationToSwedish(recipeNode.cookTime) ||
          parseIsoDurationToSwedish(recipeNode.prepTime) ||
          '30 min';

        let servings = 4;
        if (recipeNode.recipeYield !== undefined) {
          const yieldStr = Array.isArray(recipeNode.recipeYield)
            ? String(recipeNode.recipeYield[0])
            : String(recipeNode.recipeYield);
          const numMatch = yieldStr.match(/\d+/);
          if (numMatch) servings = Math.max(1, Math.min(24, Number(numMatch[0])));
        }

        const rawTags: string[] = [];
        const addTagField = (val: any) => {
          if (!val) return;
          if (Array.isArray(val)) val.forEach(addTagField);
          else if (typeof val === 'string') {
            val
              .split(',')
              .map((s) => decodeHtmlEntities(s).trim())
              .filter((s) => s.length > 1 && s.length < 28)
              .forEach((t) => rawTags.push(t));
          }
        };
        addTagField(recipeNode.recipeCategory);
        addTagField(recipeNode.recipeCuisine);
        addTagField(recipeNode.keywords);
        const uniqueTags = Array.from(new Set(rawTags)).slice(0, 5);

        const rawIngs = Array.isArray(recipeNode.recipeIngredient)
          ? recipeNode.recipeIngredient
          : Array.isArray(recipeNode.ingredients)
          ? recipeNode.ingredients
          : [];
        const ingredients = rawIngs
          .map((line: any) => (typeof line === 'string' ? line : line?.name || ''))
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => parseIngredientLineToStructured(line));

        const steps = extractStepsFromInstructions(recipeNode.recipeInstructions);
        const imageUrl = extractImageFromRecipeNode(recipeNode.image);

        if (title && (ingredients.length > 0 || steps.length > 0)) {
          return {
            title,
            description: description || `Importerat recept från ${new URL(sourceUrl).hostname.replace(/^www\./, '')}.`,
            prepTime,
            servings,
            tags: uniqueTags.length > 0 ? uniqueTags : ['Vardagsmat', 'Importerat'],
            ingredients:
              ingredients.length > 0
                ? ingredients
                : [{ name: 'Se receptlänk för ingredienser', amount: 1, unit: 'st' }],
            steps:
              steps.length > 0
                ? steps
                : ['Följ instruktionerna i receptet.'],
            imageUrl,
          };
        }
      }
    } catch {
      // Continue checking next script block
    }
  }

  // 2. Parse OpenGraph / HTML / Reader Markdown fallback
  const titleMatch =
    htmlOrText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    htmlOrText.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlOrText.match(/^Title:\s*(.+)$/m) ||
    htmlOrText.match(/^#\s+(.+)$/m);

  const descMatch =
    htmlOrText.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    htmlOrText.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );

  const ogImgMatch = htmlOrText.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );

  const cleanTitle = titleMatch
    ? decodeHtmlEntities(titleMatch[1])
        .replace(/\s*[|\-–—]\s*(ICA|Arla|Köket|Koket|Coop|Tasteline|Recept\.se|Allrecipes|Mathem).*$/i, '')
        .trim()
    : '';

  // Strip HTML tags to lines and look for ingredient-like lines & instruction lines
  const textLines = htmlOrText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '\n')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '\n')
    .replace(/<(li|p|div|br|h1|h2|h3|h4|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\r?\n/)
    .map((l) => decodeHtmlEntities(l).replace(/^[-*•]\s*/, '').trim())
    .filter((l) => l.length >= 3 && l.length <= 220);

  const unitLineRegex =
    /^(\d+(?:[.,/]\d+)?)\s*(kg|hg|g|gram|l|dl|cl|ml|msk|tsk|krm|st|förp|pkt|burk|klyftor|klyfta)\b\s+(.+)$/i;

  const detectedIngredients: { name: string; amount: number; unit: string }[] = [];
  const detectedSteps: string[] = [];

  for (const line of textLines) {
    if (unitLineRegex.test(line) && line.length < 85 && detectedIngredients.length < 30) {
      detectedIngredients.push(parseIngredientLineToStructured(line));
    } else if (
      /^(?:\d+[.)]\s+)?(Sätt ugnen|Skala|Hacka|Skär|Blanda|Vispa|Fräs|Stek|Koka|Häll|Rör|Tillsätt|Grädda|Servera|Låt|Dela|Lägg|Smält|Pensla|Krydda)\b/i.test(
        line
      ) &&
      line.length > 18 &&
      detectedSteps.length < 18
    ) {
      detectedSteps.push(line.replace(/^\d+[.)]\s*/, '').trim());
    }
  }

  if (cleanTitle && (detectedIngredients.length > 0 || detectedSteps.length > 0)) {
    return {
      title: cleanTitle,
      description: descMatch
        ? decodeHtmlEntities(descMatch[1])
        : `Importerat recept från ${new URL(sourceUrl).hostname.replace(/^www\./, '')}.`,
      prepTime: '35 min',
      servings: 4,
      tags: ['Vardagsmat', 'Importerat'],
      ingredients:
        detectedIngredients.length > 0
          ? detectedIngredients
          : [{ name: 'Valfria ingredienser enligt länk', amount: 1, unit: 'st' }],
      steps:
        detectedSteps.length > 0
          ? detectedSteps
          : ['Tillaga enligt instruktionerna på receptsidan.'],
      imageUrl: ogImgMatch ? ogImgMatch[1] : undefined,
    };
  }

  return null;
}

function buildFallbackRecipeFromUrlSlug(url: string): any {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && !/^\d+$/.test(s) && s !== 'recept' && s !== 'recipes');
    const lastSlug = segments[segments.length - 1] || parsedUrl.hostname;
    const rawName = decodeURIComponent(lastSlug)
      .replace(/\.(html|php|aspx)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d{4,}\b/g, '')
      .trim();
    const title = rawName
      ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
      : 'Importerat recept';
    const host = parsedUrl.hostname.replace(/^www\./, '');
    return {
      title,
      description: `Recept hämtat från ${host}. Kontrollera gärna mått och steg nedan innan du sparar.`,
      prepTime: '35 min',
      servings: 4,
      tags: ['Importerat', 'Vardagsmat'],
      ingredients: [
        { name: title, amount: 4, unit: 'port' },
      ],
      steps: [
        `Receptlänk: ${url}`,
        'Justera ingredienser och tillagningssteg efter behov och tryck på Spara recept.',
      ],
    };
  } catch {
    return {
      title: 'Importerat recept',
      description: 'Recept importerat via länk.',
      prepTime: '30 min',
      servings: 4,
      tags: ['Importerat'],
      ingredients: [{ name: 'Ingrediens', amount: 1, unit: 'st' }],
      steps: ['Tillaga enligt anvisning.'],
    };
  }
}

async function fetchUrlContentClientSide(targetUrl: string): Promise<string[]> {
  const candidates = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://r.jina.ai/${targetUrl}`,
  ];

  const results: string[] = [];
  for (const proxyUrl of candidates) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6500);
      const res = await fetch(proxyUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 80) {
          results.push(text);
          // If it already contains application/ld+json or Recipe, we have full structured HTML!
          if (text.includes('application/ld+json') || text.includes('"recipeIngredient"')) {
            break;
          }
        }
      }
    } catch {
      // Try next proxy
    }
  }
  return results;
}

export async function extractRecipeFromImage(
  base64DataUrl: string,
  mimeType: string
): Promise<any> {
  try {
    const res = await fetch(getApiUrl('/api/recipes/extract-image'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: base64DataUrl, mimeType }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback below
  }

  return {
    title: 'Skannat fotorecept',
    description: 'Foto tillagt — fyll i eller justera receptnamn och ingredienser nedan.',
    prepTime: '30 min',
    servings: 4,
    tags: ['Fotorecept', 'Vardagsmat'],
    ingredients: [{ name: 'Valfri ingrediens', amount: 1, unit: 'st' }],
    steps: ['Tillaga enligt bilden.'],
  };
}

export async function extractRecipeFromUrl(url: string): Promise<any> {
  const cleanUrl = url.trim();

  // 1. Try server endpoint first when available (parses JSON-LD + HTML on backend)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(getApiUrl('/api/recipes/extract-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return data;
      }
    }
  } catch {
    // Continue to direct client-side HTML / JSON-LD extraction
  }

  // 2. Fetch webpage HTML/Reader via CORS proxies and extract Schema.org Recipe JSON-LD / HTML directly on device
  const fetchedTexts = await fetchUrlContentClientSide(cleanUrl);
  for (const rawContent of fetchedTexts) {
    const extracted = parseRecipeFromHtmlOrText(rawContent, cleanUrl);
    if (extracted) {
      return extracted;
    }
  }

  // 3. Guaranteed clean fallback from URL slug (never throws 402/RESOURCE_EXHAUSTED!)
  return buildFallbackRecipeFromUrlSlug(cleanUrl);
}
