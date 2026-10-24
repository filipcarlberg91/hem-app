import { Type } from '@google/genai';
import { getApiUrl } from './apiUrl';

export const recipeResponseSchema = {
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

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&aring;/g, 'å')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&eacute;/gi, 'é')
    .replace(/&frac12;/gi, '½')
    .replace(/&frac14;/gi, '¼')
    .replace(/&frac34;/gi, '¾')
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

function normalizeFractionsInText(input: string): string {
  let line = input;
  const fracMap: Record<string, number> = {
    '½': 0.5,
    '⅓': 0.33,
    '⅔': 0.67,
    '¼': 0.25,
    '¾': 0.75,
    '⅕': 0.2,
  };
  for (const [k, v] of Object.entries(fracMap)) {
    line = line.replace(new RegExp(`(\\d+)\\s*${k}`, 'g'), (_, d) =>
      String(Number(d) + v)
    );
    line = line.replace(new RegExp(k, 'g'), String(v));
  }

  // Handle "1 1/2" or "2 1/4"
  line = line.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, (_, whole, num, den) => {
    const d = Number(den);
    if (!d) return whole;
    return String(Math.round((Number(whole) + Number(num) / d) * 100) / 100);
  });

  // Handle "1/2" or "3/4"
  line = line.replace(/\b(\d+)\/(\d+)\b/g, (_, num, den) => {
    const d = Number(den);
    if (!d) return num;
    return String(Math.round((Number(num) / d) * 100) / 100);
  });

  return line;
}

export function parseIngredientLineToStructured(rawLine: string): {
  name: string;
  amount: number;
  unit: string;
} {
  let line = decodeHtmlEntities(rawLine)
    .replace(/^[-•*▪▫◦]\s*/, '')
    .replace(/^\[[ xX]?\]\s*/, '')
    .replace(/\*\*/g, '')
    .trim();

  // Strip leading "ca ", "cirka ", "ev. ", "eventuellt "
  line = line.replace(/^(?:ca|cirka|ev\.?|eventuellt)\s+/i, '');

  line = normalizeFractionsInText(line);

  const unitPattern =
    'kg|hg|g|gram|l|liter|dl|cl|ml|msk|tsk|krm|st|stycken|förp|fp|pkt|paket|burk|burkar|klyfta|klyftor|knippe|knippen|kruka|krukor|påse|påsar|skiva|skivor|nypa|nypor|port|portioner|ask|askar|flaska|flaskor|bit|bitar';

  const unitRegex = new RegExp(
    `^(\\d+(?:[.,]\\d+)?)(?:\\s*[-–]\\s*\\d+(?:[.,]\\d+)?)?\\s*(${unitPattern})\\b\\.?\\s+(.+)$`,
    'i'
  );
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

  const numOnlyRegex = /^(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s+(.+)$/;
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

function parseTableCellsToIngredient(
  col1Raw: string,
  col2Raw: string
): { name: string; amount: number; unit: string } | null {
  const c1 = decodeHtmlEntities(col1Raw).replace(/\*\*/g, '').trim();
  const c2 = decodeHtmlEntities(col2Raw).replace(/\*\*/g, '').trim();
  if (!c1 && !c2) return null;
  if (/^[-:]+$/.test(c1) || /^[-:]+$/.test(c2)) return null;

  const c1Norm = normalizeFractionsInText(c1.replace(/^(?:ca|cirka)\s+/i, ''));
  const c2Norm = normalizeFractionsInText(c2.replace(/^(?:ca|cirka)\s+/i, ''));

  const startsWithNum1 = /^\d+(?:[.,]\d+)?/.test(c1Norm);
  const startsWithNum2 = /^\d+(?:[.,]\d+)?/.test(c2Norm);

  // Case A: "| Vetemjöl | 3 dl |" or "| Ägg | 3 |" (Arla.se format)
  if (!startsWithNum1 && startsWithNum2 && c1.length >= 2) {
    return parseIngredientLineToStructured(`${c2} ${c1}`);
  }
  // Case B: "| 3 dl | Vetemjöl |"
  if (startsWithNum1 && !startsWithNum2 && c2.length >= 2) {
    return parseIngredientLineToStructured(`${c1} ${c2}`);
  }
  // Case C: "| Salt & peppar | efter smak |"
  if (!startsWithNum1 && !startsWithNum2 && c1.length >= 2) {
    return {
      name: c1.charAt(0).toUpperCase() + c1.slice(1),
      amount: 1,
      unit: 'st',
    };
  }
  return null;
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
    (Array.isArray(typeVal) && typeVal.some((t) => String(t).toLowerCase().includes('recipe'))) ||
    (typeof typeVal === 'string' && typeVal.toLowerCase().includes('recipe'));

  if (isRecipe && (node.name || node.recipeIngredient || node.ingredients)) {
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
      .split(/\r?\n|(?<=[.!])\s+(?=[A-ZÅÄÖ])/)
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

function cleanSiteSuffixFromTitle(rawTitle: string): string {
  return decodeHtmlEntities(rawTitle)
    .replace(
      /\s*[|\-–—•]\s*(Recept\s+ICA\.se|ICA\.se|ICA|Arla\.se|Arla\s+Köket|Arla|Köket\.se|Koket\.se|Köket|Coop\.se|Coop|Tasteline|Recept\.se|Allt\s+om\s+Mat|Mathem|Zeinas\s+Kitchen|Jennys\s+Matblogg|Lindas\s+Bakskola).*$/i,
      ''
    )
    .replace(/\s*-\s*Recept$/i, '')
    .trim();
}

export function parseRecipeFromHtmlOrText(htmlOrText: string, sourceUrl: string): any | null {
  if (!htmlOrText || htmlOrText.length < 30) return null;

  let hostname = 'webben';
  try {
    hostname = new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    // ignore
  }

  const metaDescMatch =
    htmlOrText.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    htmlOrText.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i
    ) ||
    htmlOrText.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) ||
    htmlOrText.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );
  const metaDescription = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1]) : '';

  const ogImgMatch =
    htmlOrText.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) ||
    htmlOrText.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    );
  const metaImage = ogImgMatch ? ogImgMatch[1] : undefined;

  // 1. Check all <script type="application/ld+json"> AND <script type="application/ld&#x2B;json"> (Arla.se!)
  const scriptRegex =
    /<script[^>]*type=["']application\/ld(?:\+|&#x2b;|&#43;)json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(htmlOrText)) !== null) {
    const rawJson = match[1].trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson);
      const recipeNode = findRecipeNodeInJsonLd(parsed);
      if (recipeNode) {
        const title = cleanSiteSuffixFromTitle(recipeNode.name || 'Importerat recept');
        const rawDesc = decodeHtmlEntities(
          (recipeNode.description || '').replace(/<[^>]+>/g, ' ')
        );
        const description = rawDesc || metaDescription || `Importerat recept från ${hostname}.`;
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
        const imageUrl = extractImageFromRecipeNode(recipeNode.image) || metaImage;

        if (title && ingredients.length > 0) {
          return {
            title,
            description,
            prepTime,
            servings,
            tags: uniqueTags.length > 0 ? uniqueTags : ['Vardagsmat', 'Importerat'],
            ingredients,
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

  // 2. Parse Jina Reader Markdown / Structured HTML Sections
  // Extract Markdown image before stripping image tags
  let markdownImageUrl = metaImage;
  if (!markdownImageUrl) {
    const imgMatches = Array.from(
      htmlOrText.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)
    );
    for (const m of imgMatches) {
      const candidateUrl = m[1];
      const looksLikeRealRecipePhoto =
        /\.(?:jpe?g|png|webp|avif)(\?|$)/i.test(candidateUrl) ||
        /assets\.icanet\.se|images\.arla\.com|img\.koket\.se|res\.cloudinary\.com/i.test(
          candidateUrl
        );
      if (
        looksLikeRealRecipePhoto &&
        !/\.svg(\?|$)/i.test(candidateUrl) &&
        !/16x16|32x32|avatar|logo|icon|badge|flag|square-mini|author|kockar/i.test(
          candidateUrl
        )
      ) {
        markdownImageUrl = candidateUrl;
        break;
      }
    }
  }

  // Clean multi-line markdown links/images so table cells and list items stay on single lines,
  // while preserving checkboxes like "- [x]" and parenthesized notes like "(stor)".
  const normalizedMarkdown = htmlOrText
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\((?:https?:\/\/|\/|blob:)[^)]*\)/g, (_, inner) =>
      inner.replace(/\s+/g, ' ').trim()
    );

  const titleMatch =
    normalizedMarkdown.match(/^#\s+(.+)$/m) ||
    normalizedMarkdown.match(/^Title:\s*(.+)$/m) ||
    htmlOrText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    htmlOrText.match(/<title[^>]*>([^<]+)<\/title>/i);

  const cleanTitle = titleMatch ? cleanSiteSuffixFromTitle(titleMatch[1]) : '';

  // Reject 404 / expired pages (like Köket.se "Gammal ost")
  if (/^Gammal ost$/i.test(cleanTitle) || /Sidan du sökte har nått sitt bäst-före-datum/i.test(normalizedMarkdown)) {
    return null;
  }

  // Detect prepTime & servings from text
  const timeMatch = normalizedMarkdown.match(
    /\b((?:Under\s+|Över\s+|Ca\s+)?(?:\d+\s*tim(?:mar)?\s*)?\d+\s*min(?:uter)?)\b/i
  );
  const detectedPrepTime = timeMatch
    ? timeMatch[1].replace(/^(?:Under|Över|Ca)\s+/i, '').trim()
    : '35 min';

  const servingsMatch = normalizedMarkdown.match(/\b(\d+)\s*port(?:ioner)?\b/i);
  const detectedServings = servingsMatch
    ? Math.max(1, Math.min(24, Number(servingsMatch[1])))
    : 4;

  // Extract description from Markdown intro (between # Title and ## Ingredienser)
  let detectedDescription = metaDescription;
  if (!detectedDescription) {
    const ingHeaderIdx = normalizedMarkdown.search(/^(?:#{1,4}\s*|\*\*)Ingredienser\b/im);
    const introBlock =
      ingHeaderIdx > 0
        ? normalizedMarkdown.slice(0, ingHeaderIdx)
        : normalizedMarkdown.slice(0, 2500);

    const introLines = introBlock
      .split(/\r?\n/)
      .map((l) => decodeHtmlEntities(l).trim())
      .filter((l) => {
        if (l.length < 38 || l.length > 460) return false;
        if (/^(?:Title:|URL Source:|Markdown Content:|#|[-*•|]|\*\*Upptäck)/i.test(l))
          return false;
        if (/^\[.*\]\(.*\)$/.test(l) || /^https?:\/\//i.test(l)) return false;
        if (
          /(?:Hoppa till|Lägg i inköpslista|Spara recept|Logga in|Betyg|kommentarer|Näringsvärde|Klimatavtryck|Klimatsmart|klimatsmart val|Köp online|Dela recept|Gå till|Öppna menyn|Köp plus)/i.test(
            l
          )
        )
          return false;
        return /[a-zåäö]{3,}.*[.!]/i.test(l);
      });

    if (introLines.length > 0) {
      detectedDescription = introLines[0].replace(/\*\*/g, '').trim();
    }
  }

  // Extract structured Ingredients from "## Ingredienser" section if present
  const sectionIngredients: { name: string; amount: number; unit: string }[] = [];
  const ingHeadingRegex = /^(?:#{1,4}\s*|\*\*)Ingredienser(?:\*\*)?\s*$/im;
  const ingHeadingExec = ingHeadingRegex.exec(normalizedMarkdown);
  if (ingHeadingExec) {
    const afterIng = normalizedMarkdown.slice(
      ingHeadingExec.index + ingHeadingExec[0].length
    );
    const endIngRegex =
      /^(?:#{1,4}\s*|\*\*)?(?:Gör så här|Så här gör du|Tillagning|Instruktioner|Steg för steg|Näringsvärde|Tips|Serveringstips|Relaterade|Kommentarer|Vad tyckte du|Andra har även|Upptäck fler|Fler goda recept|Lägg till i inköpslista|Ha med dig inköpslistan|För alla)\b/im;
    const endIngExec = endIngRegex.exec(afterIng);
    const ingBlock = endIngExec ? afterIng.slice(0, endIngExec.index) : afterIng.slice(0, 3500);

    const rawIngLines = ingBlock.split(/\r?\n/);
    for (const rawLine of rawIngLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // Skip subheaders like "### Sås" or "**Garnering**"
      if (/^#{1,4}\s+/.test(trimmed)) continue;
      if (/^\*\*[^*]+\*\*$/.test(trimmed)) continue;

      // Skip UI noise inside Ingredients block (including "4 port", "Håll skärmen tänd", etc.)
      if (
        /^(?:\d+\s*port(?:ioner)?\.?$|Ändra antal|Lägg i inköpslista|Lägg till i inköpslista|Handla|Köp|Spara|Välj|Visa|Portioner|Håll skärmen tänd|Öppna matlagningsläget|Stäng$|Fler goda recept)/i.test(
          trimmed
        )
      ) {
        continue;
      }

      // Check if Markdown Table row: "| col1 | col2 |"
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 2) {
          const parsedCellIng = parseTableCellsToIngredient(cells[0], cells[1]);
          if (
            parsedCellIng &&
            parsedCellIng.name.length >= 2 &&
            !/^port(?:ioner)?$/i.test(parsedCellIng.name)
          ) {
            sectionIngredients.push(parsedCellIng);
          }
        }
        continue;
      }

      // Standard line inside ## Ingredienser (e.g. "ca 600 g kassler", "1 1/2 dl ananasjuice", "salt och peppar")
      const cleanLine = decodeHtmlEntities(trimmed)
        .replace(/^(?:[-*•▪▫◦]\s*)+(?:\[[ xX]?\]\s*)*/, '')
        .replace(/\s*\[[^\]]*\]$/, '')
        .trim();

      if (
        cleanLine.length >= 2 &&
        cleanLine.length <= 95 &&
        !/^(?:\d+\s*port(?:ioner)?$)/i.test(cleanLine) &&
        !/^(?:Recept|Läs mer|Se även|Klicka|Annons|Håll skärmen|Öppna matlagnings|Stäng$)/i.test(
          cleanLine
        )
      ) {
        sectionIngredients.push(parseIngredientLineToStructured(cleanLine));
      }
    }
  }

  // Extract structured Steps from "## Gör så här" / "## Så här gör du" / "## Tillagning"
  const sectionSteps: string[] = [];
  const stepHeadingRegex =
    /^(?:#{1,4}\s*|\*\*)(?:Gör så här|Så här gör du|Tillagning|Instruktioner|Steg för steg)(?:\*\*)?\s*$/im;
  const stepHeadingExec = stepHeadingRegex.exec(normalizedMarkdown);
  if (stepHeadingExec) {
    const afterSteps = normalizedMarkdown.slice(
      stepHeadingExec.index + stepHeadingExec[0].length
    );
    const endStepsRegex =
      /^(?:#{1,4}\s*|\*\*)?(?:Skapa anteckning|Har du lagat receptet|Markera som tillagat|Markera receptet som tillagat|Jag har lagat det här receptet|Sätt betyg|Näringsvärde|Tips|Serveringstips|Dryckestips|Relaterade|Kommentarer|Vad tyckte du|Betygsätt|Andra har även|Upptäck fler|Liknande recept|Fler goda recept|Köp|Handla|Fler recept|Mer från|Få de senaste nyheterna|Om Köket)\b/im;
    const endStepsExec = endStepsRegex.exec(afterSteps);
    const stepsBlock = endStepsExec
      ? afterSteps.slice(0, endStepsExec.index)
      : afterSteps.slice(0, 4500);

    const rawStepLines = stepsBlock.split(/\r?\n/);
    for (const rawLine of rawStepLines) {
      const cleanStep = decodeHtmlEntities(rawLine)
        .replace(/^(?:[-*•]\s*)+(?:\[[ xX]?\]\s*)*/, '')
        .replace(/^\[[ xX]?\]\s*/, '')
        .replace(/^(?:Steg\s*)?\d+[.:)]\s*/i, '')
        .replace(/\*\*/g, '')
        .trim();

      if (!cleanStep || cleanStep.length < 10 || cleanStep.length > 500) continue;
      if (/^#{1,4}\s+/.test(cleanStep)) continue;
      if (
        /^(?:Starta timer|Timer|Klar!|Dela|Skriv ut|Spara|Betygsätt|Kommentera|Logga in|Håll skärmen tänd|Öppna matlagningsläget|Skapa anteckning|Betyg:|Har du lagat|Markera|Tillagat)/i.test(
          cleanStep
        )
      ) {
        continue;
      }
      sectionSteps.push(cleanStep);
    }
  }

  if (cleanTitle && (sectionIngredients.length > 0 || sectionSteps.length > 0)) {
    return {
      title: cleanTitle,
      description:
        detectedDescription || `Importerat recept från ${hostname}.`,
      prepTime: detectedPrepTime,
      servings: detectedServings,
      tags: ['Vardagsmat', 'Importerat'],
      ingredients:
        sectionIngredients.length > 0
          ? sectionIngredients
          : [{ name: 'Se receptlänk för ingredienser', amount: 1, unit: 'st' }],
      steps:
        sectionSteps.length > 0
          ? sectionSteps
          : ['Tillaga enligt instruktionerna på receptsidan.'],
      imageUrl: markdownImageUrl,
    };
  }

  // 3. Heuristic line-by-line fallback for generic HTML pages without Markdown headings
  const textLines = normalizedMarkdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '\n')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '\n')
    .replace(/<(li|p|div|br|h1|h2|h3|h4|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\r?\n/)
    .map((l) => decodeHtmlEntities(l).replace(/^[-*•]\s*/, '').trim())
    .filter((l) => l.length >= 3 && l.length <= 220);

  const unitLineRegex =
    /^(?:ca\s+)?(\d+(?:[.,/\s]\d+)?)\s*(kg|hg|g|gram|l|dl|cl|ml|msk|tsk|krm|st|förp|pkt|burk|klyftor|klyfta)\b\.?\s+(.+)$/i;

  const detectedIngredients: { name: string; amount: number; unit: string }[] = [];
  const detectedSteps: string[] = [];

  for (const line of textLines) {
    if (unitLineRegex.test(line) && line.length < 85 && detectedIngredients.length < 30) {
      detectedIngredients.push(parseIngredientLineToStructured(line));
    } else if (
      /^(?:\d+[.)]\s+)?(Sätt ugnen|Värm|Skala|Hacka|Skär|Blanda|Vispa|Fräs|Stek|Koka|Häll|Rör|Tillsätt|Grädda|Servera|Låt|Dela|Lägg|Smält|Pensla|Krydda|Bred|Toppa)\b/i.test(
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
      description:
        detectedDescription || `Importerat recept från ${hostname}.`,
      prepTime: detectedPrepTime,
      servings: detectedServings,
      tags: ['Vardagsmat', 'Importerat'],
      ingredients:
        detectedIngredients.length > 0
          ? detectedIngredients
          : [{ name: 'Valfria ingredienser enligt länk', amount: 1, unit: 'st' }],
      steps:
        detectedSteps.length > 0
          ? detectedSteps
          : ['Tillaga enligt instruktionerna på receptsidan.'],
      imageUrl: markdownImageUrl,
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

function isRealExtractedRecipe(data: any): boolean {
  if (!data || !data.title || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    return false;
  }
  const firstIngName = String(data.ingredients[0]?.name || '');
  if (
    firstIngName.includes('Ingredienser (justera vid behov)') ||
    firstIngName.includes('Se ingredienser på länken') ||
    firstIngName.includes('Se receptlänk för ingredienser') ||
    firstIngName.includes('Valfria ingredienser enligt länk')
  ) {
    return false;
  }
  if (data.ingredients.length === 1 && data.ingredients[0]?.unit === 'port') {
    return false;
  }
  return true;
}

async function fetchSingleCandidateRecipe(
  proxyUrl: string,
  targetUrl: string,
  isAllOriginsJson: boolean,
  timeoutMs: number,
  parentControllers: AbortController[]
): Promise<any> {
  const ctrl = new AbortController();
  parentControllers.push(ctrl);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(proxyUrl, {
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    let text = '';
    if (isAllOriginsJson) {
      const json = await res.json();
      text = typeof json?.contents === 'string' ? json.contents : '';
    } else {
      text = await res.text();
    }
    if (!text || text.length < 80) {
      throw new Error('Empty response');
    }
    const extracted = parseRecipeFromHtmlOrText(text, targetUrl);
    if (!isRealExtractedRecipe(extracted)) {
      throw new Error('Not a complete recipe');
    }
    return extracted;
  } finally {
    clearTimeout(timer);
  }
}

async function extractRecipeClientSideParallel(targetUrl: string): Promise<any | null> {
  // 0. If running inside the native Android app, try direct native HTTP fetch first (zero CORS / instant)
  try {
    const nativeBridge =
      typeof window !== 'undefined' ? (window as any).HemNativeBridge : null;
    if (nativeBridge && typeof nativeBridge.fetchUrlHtml === 'function') {
      const nativeHtml = String(nativeBridge.fetchUrlHtml(targetUrl) || '');
      if (nativeHtml.length > 80) {
        const nativeParsed = parseRecipeFromHtmlOrText(nativeHtml, targetUrl);
        if (isRealExtractedRecipe(nativeParsed)) {
          return nativeParsed;
        }
      }
    }
  } catch {
    // Fall through to parallel web proxies
  }

  const controllers: AbortController[] = [];
  const abortAll = () => {
    for (const c of controllers) {
      try {
        c.abort();
      } catch {
        // ignore
      }
    }
  };

  try {
    // Launch Jina Reader + AllOrigins Raw + AllOrigins JSON + CodeTabs in parallel.
    // Whichever returns a valid recipe with real ingredients first wins immediately!
    const winner = await Promise.any([
      fetchSingleCandidateRecipe(
        `https://r.jina.ai/${targetUrl}`,
        targetUrl,
        false,
        16000,
        controllers
      ),
      fetchSingleCandidateRecipe(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        targetUrl,
        false,
        16000,
        controllers
      ),
      fetchSingleCandidateRecipe(
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        targetUrl,
        true,
        16000,
        controllers
      ),
      fetchSingleCandidateRecipe(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        targetUrl,
        false,
        10000,
        controllers
      ),
    ]);
    abortAll();
    return winner;
  } catch {
    abortAll();
  }

  // Follow-up retry on Jina Reader (in case the first wave warmed Jina's headless browser cache)
  try {
    const retryControllers: AbortController[] = [];
    return await fetchSingleCandidateRecipe(
      `https://r.jina.ai/${targetUrl}`,
      targetUrl,
      false,
      10000,
      retryControllers
    );
  } catch {
    return null;
  }
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

  // 1. Run parallel client-side extraction (Jina Reader + AllOrigins + CodeTabs)
  const parallelExtracted = await extractRecipeClientSideParallel(cleanUrl);
  if (isRealExtractedRecipe(parallelExtracted)) {
    return parallelExtracted;
  }

  // 2. Try server endpoint (parses JSON-LD + Jina Reader + HTML on backend)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(getApiUrl('/api/recipes/extract-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (isRealExtractedRecipe(data)) {
        return data;
      }
    }
  } catch {
    // Fallback below
  }

  // 3. Guaranteed clean fallback from URL slug
  return buildFallbackRecipeFromUrlSlug(cleanUrl);
}
