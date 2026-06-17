import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../config/db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Initialize GoogleGenAI SDK lazily to prevent module-load time key issues and support dynamic environment variables
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add it via Secrets panel.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

// GET USER CHAT HISTORY
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const history = await db.getChatHistory(req.user.id);
    res.json({ chatHistory: history });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve chat history: ' + error.message });
  }
});

// ASK CHAT ASSISTANT (conversation routing)
router.post('/ask', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { question } = req.body;

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!question || question.trim() === '') {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  try {
    // Verify API Key exists and get the Gemini AI client
    const ai = getAI();

    // Retrieve previous conversations for user memory
    const history = await db.getChatHistory(req.user.id);

    // Format previous interactions into chat contents format
    // Each past question (User Role) and response (Model Role)
    const contents: any[] = [];
    
    // Take the last 6 messages to prevent hitting token bounds or slow loads, keeping it highly responsive.
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      contents.push({ role: 'user', parts: [{ text: msg.question }] });
      contents.push({ role: 'model', parts: [{ text: msg.answer }] });
    }

    // Append the current active user question
    contents.push({ role: 'user', parts: [{ text: question }] });

    // Request answer from Gemini model
    let answer = '';
    const config = {
      systemInstruction: `You are EcoSmart AI, an advanced, elite Artificial Intelligence waste segregation and recycling assistant.
Your goal is to guide citizens, families, municipalities, and companies toward sustainable consumption, waste reduction, and correct segregation aligning with SDG 12 (Responsible Consumption and Production).

Guidelines for your answers:
1. Be highly accurate, professional, informative, and engaging.
2. Provide concrete localized sorting advices (e.g. explain when greasy pizza boxes are not recyclable because grease soils paper boards, explaining what are resin numbers in plastics, why lithium batteries require specialized municipal collection).
3. Do not output lazy, generic bullet lines. Share the environmental scientific reasons behind correct recycling or ecological degradation.
4. Keep answers clean, readable, formatted beautifully using Markdown (with headers, bullet lists, bold text, or callouts).
5. Suggest ways to Reduce or Reuse materials before recommending Recycling (Hierarchical Waste Management).`
    };

    try {
      console.log('Querying primary chat model: gemini-3.5-flash');
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: config
      });
      answer = geminiResponse.text || '';
    } catch (primaryError: any) {
      console.warn('Primary chat model failed. Attempting backup gemini-3.1-flash-lite...', primaryError.message || primaryError);
      try {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contents,
          config: config
        });
        answer = geminiResponse.text || '';
      } catch (backupError: any) {
        console.error('All chat models failed. Activating local assistant rules...', backupError.message || backupError);
        
        // Intelligent locally-served answers for highest quality fault-tolerance
        const normalized = question.toLowerCase();
        let topicResponse = '';

        if (normalized.includes('plastic') || normalized.includes('bottle')) {
          topicResponse = `### Plastic Recycling Insights (SDG 12)

Plastics are classified using **Resin Identification Codes (1-7)** found inside the recycling triangle:
- **PET (Code 1)** and **HDPE (Code 2)** are most widely recycled.
- **PVC (Code 3)** and **PS (Code 6)** are highly toxic and rarely accepted by municipal collectors.

**Sorting Best Practices:**
1. Rinse out liquid residue. Greasy polymers degrade recycle pulp streams.
2. Flatten bottles to optimize container transportation efficiency.`;
        } else if (normalized.includes('paper') || normalized.includes('cardboard') || normalized.includes('box')) {
          topicResponse = `### Paper and Fiberboard Recycling

Paper is a highly recyclable organic fiber, but it has sensitive thresholds:
- **Greasy paper or pizza boxes cannot be recycled**—grease and food oil do not mix with water during pulping, rendering the batch useless.
- High-quality office paper, paperboard packaging list items, and clean cardboard are pristine targets.

**Action Plan:**
1. Shred sensitive data.
2. Remove plastic window components, thick packing tapes, and parcel liners.`;
        } else if (normalized.includes('metal') || normalized.includes('can') || normalized.includes('aluminum')) {
          topicResponse = `### Metal & Beverage Can Salvage

Metals (specifically **Aluminum** and **Steel**) are circular champions—they can be recycled infinitely without losing material structure:
- Recycling metal uses **95% less energy** than extraction from virgin raw bauxite.
- Make sure cans are rinsed cleanly and folded down to protect automated sorting grids.`;
        } else if (normalized.includes('battery') || normalized.includes('electronic') || normalized.includes('phone') || normalized.includes('e-waste')) {
          topicResponse = `### Hazardous Electronic Waste (E-Waste)

E-waste contains precious materials (such as gold, palladium, copper, and cobalt) along with toxic heavy metals (mercury, lead, and cadmium):
- **Never discard batteries or electronics in general household garbage bins.** They represent severe fire risks and landfill pollution.
- Locate certified local collection grids and battery collection dropboxes at shopping centers or post offices.`;
        } else {
          topicResponse = `### Sustainable Living Guidelines (SDG 12)

Responsible consumption means focusing on waste prevention rather than sorting after use:
1. **Reduce**: Bring your own carry bags, purchase bulk supplies, and purchase products with zero structural packaging.
2. **Reuse**: Repurpose older jars for seed starters, or storage blocks.
3. **Recycle**: Familiarize yourself with local municipality classification codes to avoid "wishcycling" (placing unrecyclable items in municipal bins in hopes they get sorted).`;
        }

        answer = `${topicResponse}\n\n***\n\n♻️ *Note: Our server-side Gemini AI model is currently under a high load spike or free quota limit (503/429 limits). EcoSmart AI provides this offline backup summary to assist your green objectives seamlessly.*`;
      }
    }

    if (!answer) {
      throw new Error('AI assistant failed to generate a written response.');
    }

    // Save session message to database
    const savedChat = await db.createChatHistory({
      user_id: req.user.id,
      question: question.trim(),
      answer: answer.trim()
    });

    res.status(201).json({ chat: savedChat });
  } catch (error: any) {
    console.error('Chat routing error:', error);
    res.status(500).json({ error: error.message || 'The AI assistant was unable to satisfy your query. Please check your system endpoints.' });
  }
});

// DELETE SPECIFIC MESSAGE OR HISTORY
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const chatId = parseInt(req.params.id);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const history = await db.getChatHistory(req.user.id);
    const hasRecord = history.find(c => c.id === chatId);

    if (!hasRecord) {
      res.status(404).json({ error: 'Chat message not found or unauthorized.' });
      return;
    }

    const success = await db.deleteChatHistory(chatId);
    if (success) {
      res.json({ message: 'Conversation record successfully removed.' });
    } else {
      res.status(500).json({ error: 'Failed to complete message deletion.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
