import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { parseRecipeFromHtmlOrText } from './src/utils/recipeExtractorClient';

dotenv.config();

const STORE_FILE = path.join(process.cwd(), '.household-store.json');

interface HouseholdStore {
  version: number;
  updatedAt: string;
  updatedBy: string;
  updatedByDeviceId?: string;
  lastActionId?: string;
  lastActionSummary: string;
  lastActionType: 'calendar' | 'todo' | 'shopping' | 'sync';
  categories?: any[];
  events?: any[];
  todos?: any[];
  notes?: any[];
  shopping?: any[];
  recipes?: any[];
  budgetMonths?: any[];
  accounts?: any[];
  workspaces?: Record<string, any>;
}

const LEGACY_DEMO_IDS = new Set([
  'evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5',
  'todo-1', 'todo-2', 'todo-3', 'todo-4',
  'note-1', 'note-2', 'note-3',
  'shop-1', 'shop-2', 'shop-3', 'shop-4', 'shop-5', 'shop-6', 'shop-7',
  'rec-1', 'rec-2', 'rec-3',
  'b-10-1', 'b-10-2', 'b-10-3', 'b-10-4', 'b-10-5', 'b-10-6', 'b-10-7',
  'b-11-1', 'b-11-3', 'b-11-4', 'b-11-5', 'b-11-6', 'b-11-7',
  'b-12-1', 'b-12-3', 'b-12-4', 'b-12-5', 'b-12-6', 'b-12-7', 'b-12-8',
]);

function stripDemoItems<T extends { id?: string }>(arr?: T[]): T[] | undefined {
  if (!Array.isArray(arr)) return arr;
  return arr.filter((item) => !item?.id || !LEGACY_DEMO_IDS.has(item.id));
}

function cleanHouseholdStore(store: HouseholdStore): HouseholdStore {
  return {
    ...store,
    events: stripDemoItems(store.events),
    todos: stripDemoItems(store.todos),
    notes: stripDemoItems(store.notes),
    shopping: stripDemoItems(store.shopping),
    recipes: stripDemoItems(store.recipes),
    budgetMonths: Array.isArray(store.budgetMonths)
      ? store.budgetMonths.map((m: any) => ({
          ...m,
          entries: stripDemoItems(m?.entries) || [],
        }))
      : store.budgetMonths,
  };
}

function readHouseholdStore(): HouseholdStore | null {
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return cleanHouseholdStore(JSON.parse(raw) as HouseholdStore);
  } catch {
    return null;
  }
}

function writeHouseholdStore(data: HouseholdStore) {
  try {
    const cleaned = cleanHouseholdStore(data);
    fs.writeFileSync(STORE_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not write household store:', err);
  }
}

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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
      description: 'Kategoritaggar på svenska, t.ex. ["Vardagsmat", "Snabbt", "Vegetariskt", "Husmanskost"].',
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Ingrediensens namn på svenska, t.ex. "Vispgrädde"' },
          amount: { type: Type.NUMBER, description: 'Mängd som siffra, t.ex. 2.5' },
          unit: { type: Type.STRING, description: 'Enhet på svenska, t.ex. "dl", "g", "st", "msk", "tsk", "förp"' },
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
  required: ['title', 'description', 'prepTime', 'servings', 'tags', 'ingredients', 'steps'],
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Allow Native Android (.aab) & iOS Capacitor shells to call /api/* endpoints
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Shared Household State API (Syncs between Android & iOS devices)
  app.get('/api/household', (_req, res) => {
    const store = readHouseholdStore();
    if (!store) {
      res.json({ initialized: false });
      return;
    }
    res.json({ initialized: true, ...store });
  });

  app.post('/api/household', (req, res) => {
    const current = readHouseholdStore();
    const nextVersion = Math.max((current?.version || 0) + 1, req.body.version || 1);
    const payload: HouseholdStore = {
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: req.body.updatedBy || 'Familjemedlem',
      updatedByDeviceId: req.body.updatedByDeviceId ?? current?.updatedByDeviceId,
      lastActionId: req.body.lastActionId ?? current?.lastActionId,
      lastActionSummary: req.body.lastActionSummary || 'Uppdaterade data',
      lastActionType: req.body.lastActionType || 'sync',
      categories: req.body.categories ?? current?.categories,
      events: req.body.events ?? current?.events,
      todos: req.body.todos ?? current?.todos,
      notes: req.body.notes ?? current?.notes,
      shopping: req.body.shopping ?? current?.shopping,
      recipes: req.body.recipes ?? current?.recipes,
      budgetMonths: req.body.budgetMonths ?? current?.budgetMonths,
      accounts: req.body.accounts ?? current?.accounts,
      workspaces: req.body.workspaces ?? current?.workspaces,
    };
    writeHouseholdStore(payload);
    res.json({ ok: true, version: nextVersion, updatedAt: payload.updatedAt });
  });

  // Direct GitHub Push API (Pushes all latest files + Android .aab workflow directly to user's GitHub repo)
  app.post('/api/github/push', async (req, res) => {
    try {
      const { repoInput, githubToken } = req.body;
      if (!repoInput || !githubToken) {
        res.status(400).json({ error: 'Ange både GitHub-repo (t.ex. användarnamn/repo) och GitHub Personal Access Token.' });
        return;
      }

      const cleanRepo = String(repoInput)
        .trim()
        .replace(/^https?:\/\/github\.com\//i, '')
        .replace(/\.git$/i, '')
        .replace(/^\/+|\/+$/g, '');

      if (!cleanRepo.includes('/')) {
        res.status(400).json({ error: 'Ange repo i formatet användarnamn/repo-namn eller hela GitHub-länken.' });
        return;
      }

      const ghHeaders = {
        Authorization: `Bearer ${String(githubToken).trim()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Hem-App-Sync',
      };

      // 1. Check repo & default branch
      const repoRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
        headers: ghHeaders,
      });
      if (!repoRes.ok) {
        const errBody = await repoRes.text();
        res.status(repoRes.status).json({
          error: `Kunde inte nå GitHub-repot (${cleanRepo}). Kontrollera att repot finns och att din token har behörigheten "repo" (och "workflow"). Detalj: ${errBody}`,
        });
        return;
      }
      const repoData: any = await repoRes.json();
      const branch = repoData.default_branch || 'main';

      // Collect all project files to upload
      const filesToPush: { path: string; content: string; encoding: 'utf-8' | 'base64' }[] = [];
      const includeRootFiles = [
        '.env.example',
        '.gitignore',
        'capacitor.config.json',
        'firebase-applet-config.json',
        'index.html',
        'metadata.json',
        'package.json',
        'server.ts',
        'tsconfig.json',
        'twa-manifest.json',
        'vite.config.ts',
      ];

      for (const f of includeRootFiles) {
        const full = path.join(process.cwd(), f);
        if (fs.existsSync(full)) {
          filesToPush.push({
            path: f,
            content: fs.readFileSync(full, 'utf-8'),
            encoding: 'utf-8',
          });
        }
      }

      const walkDir = (dirRel: string) => {
        const absDir = path.join(process.cwd(), dirRel);
        if (!fs.existsSync(absDir)) return;
        for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
          if (entry.name.startsWith('.')) continue;
          const relPath = `${dirRel}/${entry.name}`;
          const absPath = path.join(process.cwd(), relPath);
          if (entry.isDirectory()) {
            walkDir(relPath);
          } else {
            if (/\.aab$/i.test(entry.name)) continue;
            const isBinary = /\.(png|jpg|jpeg|ico|webp|woff|woff2|jks)$/i.test(entry.name);
            filesToPush.push({
              path: relPath,
              content: isBinary
                ? fs.readFileSync(absPath).toString('base64')
                : fs.readFileSync(absPath, 'utf-8'),
              encoding: isBinary ? 'base64' : 'utf-8',
            });
          }
        }
      };

      walkDir('src');
      walkDir('public');
      walkDir('scripts');

      const aabWorkflowPath = path.join(process.cwd(), '.github/workflows/build-aab.yml');
      const aabWorkflowYaml = fs.existsSync(aabWorkflowPath)
        ? fs.readFileSync(aabWorkflowPath, 'utf-8')
        : '';

      // Get latest commit SHA on default branch (or initialize if empty)
      const refRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${branch}`,
        { headers: ghHeaders }
      );

      if (!refRes.ok) {
        // Empty repo fallback: create initial file via Contents API
        const initRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents/README.md`,
          {
            method: 'PUT',
            headers: ghHeaders,
            body: JSON.stringify({
              message: 'Initiera Hem-projektet',
              content: Buffer.from('# Hem — Familjeapp för Android & iOS\n').toString('base64'),
            }),
          }
        );
        if (!initRes.ok) {
          throw new Error('Kunde inte initiera tomt GitHub-repo.');
        }
      }

      const refRes2 = await fetch(
        `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${branch}`,
        { headers: ghHeaders }
      );
      const refData: any = await refRes2.json();
      const latestCommitSha = refData.object.sha;

      // Create blobs for all files
      const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
      for (const file of filesToPush) {
        const blobRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/git/blobs`,
          {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({
              content: file.content,
              encoding: file.encoding,
            }),
          }
        );
        if (blobRes.ok) {
          const blobData: any = await blobRes.json();
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          });
        }
      }

      // Also try adding workflow file if token has workflow scope
      let workflowIncluded = false;
      const wfBlobRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/git/blobs`,
        {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({
            content: aabWorkflowYaml,
            encoding: 'utf-8',
          }),
        }
      );
      let wfBlobSha = '';
      if (wfBlobRes.ok) {
        const wfBlobData: any = await wfBlobRes.json();
        wfBlobSha = wfBlobData.sha;
      }

      const pushTreeAndCommit = async (items: typeof treeItems) => {
        const treeRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/git/trees`,
          {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({
              base_tree: latestCommitSha,
              tree: items,
            }),
          }
        );
        if (!treeRes.ok) return null;
        const treeData: any = await treeRes.json();

        const commitRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/git/commits`,
          {
            method: 'POST',
            headers: ghHeaders,
            body: JSON.stringify({
              message: 'Synka senaste Hem-appen (Android & iOS intern testning, Recept, Budgetkalkylator)',
              tree: treeData.sha,
              parents: [latestCommitSha],
            }),
          }
        );
        if (!commitRes.ok) return null;
        const commitData: any = await commitRes.json();

        const updateRefRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/git/refs/heads/${branch}`,
          {
            method: 'PATCH',
            headers: ghHeaders,
            body: JSON.stringify({
              sha: commitData.sha,
              force: true,
            }),
          }
        );
        return updateRefRes.ok ? commitData.sha : null;
      };

      // Try pushing WITH .github/workflows/build-aab.yml first
      let committedSha: string | null = null;
      if (wfBlobSha) {
        committedSha = await pushTreeAndCommit([
          ...treeItems,
          {
            path: '.github/workflows/build-aab.yml',
            mode: '100644',
            type: 'blob',
            sha: wfBlobSha,
          },
        ]);
        if (committedSha) {
          workflowIncluded = true;
        }
      }

      // Fallback: push without .github/workflows if token lacked workflow scope
      if (!committedSha) {
        committedSha = await pushTreeAndCommit(treeItems);
      }

      if (!committedSha) {
        res.status(500).json({
          error: 'Kunde inte skapa commit på GitHub. Kontrollera att din token har Skrivbehörighet (Contents: Read and Write).',
        });
        return;
      }

      res.json({
        ok: true,
        repoUrl: `https://github.com/${cleanRepo}`,
        actionsUrl: `https://github.com/${cleanRepo}/actions`,
        branch,
        filesCount: treeItems.length,
        workflowIncluded,
      });
    } catch (error: any) {
      console.error('GitHub push error:', error);
      res.status(500).json({
        error: error?.message || 'Fel vid uppladdning till GitHub.',
      });
    }
  });

  app.post('/api/recipes/extract-image', async (req, res) => {
    try {
      const { base64Image, mimeType } = req.body;
      if (!base64Image) {
        res.status(400).json({ error: 'Ingen bild skickades med.' });
        return;
      }

      const ai = getAiClient();
      const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: 'Analysera denna bild (det kan vara ett foto av ett recept i en kokbok, en handskriven lapp eller en maträtt). Extrahera eller skapa ett komplett recept på svenska med titel, beskrivning, tid, portioner, taggar, ingredienser och steg.',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: recipeResponseSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Tomt svar från modellen.');
      }

      const parsed = JSON.parse(text.trim());
      res.json(parsed);
    } catch (error: any) {
      console.error('Error extracting recipe from image:', error);
      res.status(500).json({
        error: error?.message || 'Kunde inte tolka receptet från bilden.',
      });
    }
  });

  app.post('/api/recipes/extract-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Ange en giltig URL.' });
        return;
      }

      const cleanUrl = url.trim();
      let rawHtml = '';
      let pageText = '';

      // 1. Try direct fetch first (works for Arla.se, Köket.se, Coop.se, etc.)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6500);
        const pageRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (pageRes.ok) {
          rawHtml = await pageRes.text();
          const parsedDirect = parseRecipeFromHtmlOrText(rawHtml, cleanUrl);
          if (parsedDirect && parsedDirect.ingredients?.length > 0) {
            res.json(parsedDirect);
            return;
          }
          pageText = rawHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 20000);
        }
      } catch {
        // Ignore direct fetch failure
      }

      // 2. Try Jina Reader (bypasses Cloudflare on ICA.se, etc. and returns structured Markdown)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7500);
        const jinaRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
          headers: {
            Accept: 'text/plain, text/markdown, */*',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (jinaRes.ok) {
          const jinaMarkdown = await jinaRes.text();
          const parsedJina = parseRecipeFromHtmlOrText(jinaMarkdown, cleanUrl);
          if (parsedJina && parsedJina.ingredients?.length > 0) {
            res.json(parsedJina);
            return;
          }
          if (!pageText && jinaMarkdown) {
            pageText = jinaMarkdown.slice(0, 20000);
          }
        }
      } catch {
        // Ignore Jina Reader failure
      }

      // 3. Optional AI extraction if configured and has credits
      try {
        const ai = getAiClient();
        const prompt = pageText
          ? `Extrahera receptet från följande webbsida (${cleanUrl}) och översätt/formattera allt till svenska:\n\n${pageText}`
          : `Extrahera eller rekonstruera receptet från denna webbadress (${cleanUrl}) på svenska med korrekta ingredienser, mått och tillagningssteg.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: recipeResponseSchema,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim());
          res.json(parsed);
          return;
        }
      } catch {
        // Fall through
      }

      res.status(422).json({
        error: 'Kunde inte tolka receptstrukturen på servern, använder klientextraktor.',
      });
    } catch (error: any) {
      console.error('Error extracting recipe from URL:', error);
      res.status(500).json({
        error: 'Kunde inte hämta receptet från länken.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
