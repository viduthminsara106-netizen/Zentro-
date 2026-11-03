import 'dotenv/config';
import express from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side 1-Account-Per-Device Registry (tracks deviceId, macAddress, and ipAddress)
interface RegisteredDeviceEntry {
  uid: string;
  username: string;
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  location: string;
  registeredAt: string;
}

const serverDeviceRegistry = new Map<string, RegisteredDeviceEntry>();

function extractClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function getServerNetworkMac(): string | null {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          return net.mac.toUpperCase();
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

app.get('/api/security/device-telemetry', (req, res) => {
  const ipAddress = extractClientIp(req);
  const acceptLanguage = req.headers['accept-language'] || 'en-US';
  const serverMac = getServerNetworkMac();
  res.json({
    ipAddress,
    acceptLanguage,
    serverMac,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/security/check-device', (req, res) => {
  const { deviceId, macAddress, ipAddress } = req.body || {};
  const clientIp = ipAddress || extractClientIp(req);
  for (const entry of serverDeviceRegistry.values()) {
    if (
      (deviceId && entry.deviceId === deviceId) ||
      (macAddress && entry.macAddress === macAddress) ||
      (deviceId && entry.ipAddress === clientIp && entry.deviceId === deviceId)
    ) {
      res.json({
        locked: true,
        existingUsername: entry.username,
        existingUid: entry.uid,
        entry,
      });
      return;
    }
  }
  res.json({ locked: false });
});

app.post('/api/security/register-device', (req, res) => {
  const { uid, username, deviceId, macAddress, ipAddress, location } = req.body || {};
  const clientIp = ipAddress || extractClientIp(req);

  for (const entry of serverDeviceRegistry.values()) {
    if (
      (deviceId && entry.deviceId === deviceId) ||
      (macAddress && entry.macAddress === macAddress)
    ) {
      if (entry.uid !== uid) {
        res.status(409).json({
          locked: true,
          existingUsername: entry.username,
          error: `Only 1 account is permitted per device. Device (${entry.deviceId} / MAC ${entry.macAddress} / IP ${entry.ipAddress}) is already registered to "${entry.username}".`,
        });
        return;
      }
    }
  }

  const record: RegisteredDeviceEntry = {
    uid: String(uid || 'unknown'),
    username: String(username || 'member'),
    deviceId: String(deviceId || 'ZNT-DEV-DEFAULT'),
    macAddress: String(macAddress || '00:1A:2B:3C:4D:5E'),
    ipAddress: String(clientIp),
    location: String(location || 'Tracked Region'),
    registeredAt: new Date().toISOString(),
  };
  if (deviceId) {
    serverDeviceRegistry.set(deviceId, record);
  }
  res.json({ ok: true, record });
});

// ============================================================================
// REAL-TIME MULTI-USER & ADMIN LIVE CHAT ENGINE (Server-Authoritative + SSE)
// ============================================================================
interface ServerLiveChatMessage {
  id: string;
  senderUid: string;
  senderUsername: string;
  senderVipLevel: number;
  senderIsAdmin: boolean;
  recipientUid: string; // 'GLOBAL' | 'ADMIN' | specific user uid
  recipientUsername?: string;
  text: string;
  createdAt: string;
}

interface ServerLiveChatUserPresence {
  uid: string;
  username: string;
  vipLevel: number;
  isAdmin: boolean;
  country?: string;
  lastSeenAt: string;
}

interface ServerSupportLinksConfig {
  whatsappOfficialChannelUrl: string;
  telegramOfficialChannelUrl: string;
  whatsappSupportCareUrl: string;
  telegramSupportCareUrl: string;
  whatsappSupportCareLabel: string;
  telegramSupportCareLabel: string;
  channels?: any[];
}

let serverSupportConfig: ServerSupportLinksConfig = {
  whatsappOfficialChannelUrl: 'https://whatsapp.com/channel/0029VaZentroOfficial',
  telegramOfficialChannelUrl: 'https://t.me/ZentroOfficialChannel',
  whatsappSupportCareUrl: 'https://wa.me/94770090007?text=Hello%20Zentro%20Hiring%20Manager%20Support',
  telegramSupportCareUrl: 'https://t.me/ZentroHiringManagerCare',
  whatsappSupportCareLabel: 'Hiring Manager Care (WhatsApp)',
  telegramSupportCareLabel: 'Hiring Manager Care (Telegram)',
};

const serverLiveChatMessages: ServerLiveChatMessage[] = [
  {
    id: 'msg_welcome_global_1',
    senderUid: 'ADMIN',
    senderUsername: 'Zentro Official Admin',
    senderVipLevel: 4,
    senderIsAdmin: true,
    recipientUid: 'GLOBAL',
    recipientUsername: 'All Members',
    text: 'Welcome to Zentro 24/7 Live Community & Support Chat! You can message all members in Global Live Chat or send a Direct Message to Admin or any member anytime.',
    createdAt: new Date().toISOString(),
  },
];

const serverLivePresence = new Map<string, ServerLiveChatUserPresence>();
serverLivePresence.set('ADMIN', {
  uid: 'ADMIN',
  username: 'Zentro Official Admin',
  vipLevel: 4,
  isAdmin: true,
  country: 'Official HQ',
  lastSeenAt: new Date().toISOString(),
});

const sseClients = new Set<express.Response>();

function broadcastLiveChatEvent(eventType: string, payload: unknown) {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get('/api/live-chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);
  res.write(
    `event: init\ndata: ${JSON.stringify({
      messages: serverLiveChatMessages.slice(-250),
      users: Array.from(serverLivePresence.values()),
      supportConfig: serverSupportConfig,
    })}\n\n`
  );

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/live-chat/state', (_req, res) => {
  res.json({
    messages: serverLiveChatMessages.slice(-250),
    users: Array.from(serverLivePresence.values()),
    supportConfig: serverSupportConfig,
  });
});

app.post('/api/live-chat/presence', (req, res) => {
  const { uid, username, vipLevel = 0, isAdmin = false, country = '' } = req.body || {};
  if (!uid || !username) {
    res.status(400).json({ error: 'uid and username required' });
    return;
  }
  const entry: ServerLiveChatUserPresence = {
    uid: String(uid),
    username: String(username).slice(0, 60),
    vipLevel: Number(vipLevel) || 0,
    isAdmin: Boolean(isAdmin),
    country: String(country || ''),
    lastSeenAt: new Date().toISOString(),
  };
  serverLivePresence.set(entry.uid, entry);
  // Also keep ADMIN online
  const adminEntry = serverLivePresence.get('ADMIN');
  if (adminEntry) {
    adminEntry.lastSeenAt = new Date().toISOString();
  }
  broadcastLiveChatEvent('presence:updated', {
    users: Array.from(serverLivePresence.values()),
  });
  res.json({ ok: true, users: Array.from(serverLivePresence.values()) });
});

app.post('/api/live-chat/send', (req, res) => {
  const {
    id,
    senderUid,
    senderUsername,
    senderVipLevel = 0,
    senderIsAdmin = false,
    recipientUid = 'GLOBAL',
    recipientUsername = '',
    text,
  } = req.body || {};

  if (!senderUid || !senderUsername || !text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Invalid chat message payload' });
    return;
  }

  const msgId = String(id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  // Idempotency check
  const existing = serverLiveChatMessages.find((m) => m.id === msgId);
  if (existing) {
    res.json({ ok: true, message: existing });
    return;
  }

  const newMsg: ServerLiveChatMessage = {
    id: msgId,
    senderUid: String(senderUid),
    senderUsername: String(senderUsername).slice(0, 60),
    senderVipLevel: Number(senderVipLevel) || 0,
    senderIsAdmin: Boolean(senderIsAdmin),
    recipientUid: String(recipientUid || 'GLOBAL'),
    recipientUsername: String(recipientUsername || '').slice(0, 60),
    text: text.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  serverLiveChatMessages.push(newMsg);
  if (serverLiveChatMessages.length > 400) {
    serverLiveChatMessages.shift();
  }

  // Update sender presence
  serverLivePresence.set(newMsg.senderUid, {
    uid: newMsg.senderUid,
    username: newMsg.senderUsername,
    vipLevel: newMsg.senderVipLevel,
    isAdmin: newMsg.senderIsAdmin,
    lastSeenAt: newMsg.createdAt,
  });

  broadcastLiveChatEvent('message:created', { message: newMsg });
  res.json({ ok: true, message: newMsg });
});

app.post('/api/live-chat/delete', (req, res) => {
  const { messageId } = req.body || {};
  if (!messageId) {
    res.status(400).json({ error: 'messageId required' });
    return;
  }
  const idx = serverLiveChatMessages.findIndex((m) => m.id === messageId);
  if (idx !== -1) {
    serverLiveChatMessages.splice(idx, 1);
    broadcastLiveChatEvent('message:deleted', { messageId });
  }
  res.json({ ok: true, messageId });
});

app.post('/api/live-chat/config', (req, res) => {
  const next = req.body || {};
  serverSupportConfig = {
    ...serverSupportConfig,
    whatsappOfficialChannelUrl:
      typeof next.whatsappOfficialChannelUrl === 'string' && next.whatsappOfficialChannelUrl.trim()
        ? next.whatsappOfficialChannelUrl.trim()
        : serverSupportConfig.whatsappOfficialChannelUrl,
    telegramOfficialChannelUrl:
      typeof next.telegramOfficialChannelUrl === 'string' && next.telegramOfficialChannelUrl.trim()
        ? next.telegramOfficialChannelUrl.trim()
        : serverSupportConfig.telegramOfficialChannelUrl,
    whatsappSupportCareUrl:
      typeof next.whatsappSupportCareUrl === 'string' && next.whatsappSupportCareUrl.trim()
        ? next.whatsappSupportCareUrl.trim()
        : serverSupportConfig.whatsappSupportCareUrl,
    telegramSupportCareUrl:
      typeof next.telegramSupportCareUrl === 'string' && next.telegramSupportCareUrl.trim()
        ? next.telegramSupportCareUrl.trim()
        : serverSupportConfig.telegramSupportCareUrl,
    whatsappSupportCareLabel:
      typeof next.whatsappSupportCareLabel === 'string' && next.whatsappSupportCareLabel.trim()
        ? next.whatsappSupportCareLabel.trim()
        : serverSupportConfig.whatsappSupportCareLabel,
    telegramSupportCareLabel:
      typeof next.telegramSupportCareLabel === 'string' && next.telegramSupportCareLabel.trim()
        ? next.telegramSupportCareLabel.trim()
        : serverSupportConfig.telegramSupportCareLabel,
    ...(Array.isArray(next.channels) ? { channels: next.channels } : {}),
  };
  broadcastLiveChatEvent('config:updated', { supportConfig: serverSupportConfig });
  res.json({ ok: true, supportConfig: serverSupportConfig });
});

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

// 1. Multi-Mode Gemini Intelligence Endpoint:
// - 'fast': gemini-3.1-flash-lite (low-latency responses)
// - 'thinking': gemini-4-argon with ThinkingLevel.HIGH (deep complex reasoning, no maxOutputTokens)
// - 'search': gemini-3.8-flash with googleSearch tool (up-to-date web search grounding)
// - 'general': gemini-3.8-flash (general tasks)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, mode = 'general', systemInstruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();

    if (mode === 'fast') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are the Zentro Instant Support & Financial Assistant. Provide clear, concise, helpful answers.',
        },
      });
      res.json({ text: response.text || '', modelUsed: 'gemini-3.1-flash-lite' });
      return;
    }

    if (mode === 'thinking') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Zentro Deep Intelligence Advisor. Perform rigorous quantitative, financial, and bioscience analysis.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      res.json({ text: response.text || '', modelUsed: 'gemini-4-argon (ThinkingLevel.HIGH)' });
      return;
    }

    if (mode === 'search') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Zentro Market & Bioscience Research Pulse. Provide accurate, up-to-date answers grounded in Google Search.',
          tools: [{ googleSearch: {} }],
        },
      });

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = rawChunks
        .map((chunk: any) => chunk?.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => ({
          uri: web.uri,
          title: web.title || web.uri,
        }));

      res.json({
        text: response.text || '',
        sources,
        modelUsed: 'gemini-3.8-flash + Google Search',
      });
      return;
    }

    // Default general mode: gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction || 'You are Zentro Intelligence. Help the user complete their task.',
      },
    });
    res.json({ text: response.text || '', modelUsed: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini.',
    });
  }
});

// 2. Analyze Images with gemini-4-argon (used for KYC ID document inspection & general image understanding)
app.post('/api/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required.' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text:
              prompt ||
              'Analyze this image in detail. Describe key visual elements, text, structure, and verification indicators.',
          },
        ],
      },
    });

    res.json({
      text: response.text || '',
      modelUsed: 'gemini-4-argon',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze image with gemini-4-argon.',
    });
  }
});

// 3. Create & Edit High-Quality Images (supports gemini-nano-banana-2.1 and gemini-3-pro-image-preview)
// Supports image sizes (1K, 2K, 4K) and aspect ratios (1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-nano-banana-2.1',
      aspectRatio = '1:1',
      imageSize = '1K',
      referenceImageBase64,
      referenceMimeType = 'image/png',
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();
    const parts: any[] = [];

    if (referenceImageBase64) {
      const cleanRef = referenceImageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanRef,
          mimeType: referenceMimeType,
        },
      });
    }

    parts.push({
      text: `${prompt} (Target aspect ratio: ${aspectRatio})`,
    });

    const selectedModel =
      model === 'gemini-3-pro-image-preview' || model === 'gemini-3-pro-image'
        ? model
        : 'gemini-nano-banana-2.1';

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });
    } catch (innerErr: any) {
      // Fallback if a model alias or ratio requires standard ratio or gemini-nano-banana-2.1
      const fallbackRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)
        ? aspectRatio
        : '16:9';
      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: fallbackRatio,
            imageSize,
          },
        },
      });
    }

    let imageUrl: string | null = null;
    let textNote = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textNote += part.text;
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error: textNote || 'Model did not return an image part.',
      });
      return;
    }

    res.json({
      imageUrl,
      text: textNote,
      modelUsed: selectedModel,
      aspectRatio,
      imageSize,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate or edit image.',
    });
  }
});

// 4. Animate Uploaded Image into Video via Interactions API with gemini-omni-1.1-flash
// Aspect ratio: '16:9' (landscape) or '9:16' (portrait)
app.post('/api/ai/animate-video', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', prompt, aspectRatio = '16:9' } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload a photo to animate.' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const ai = getAiClient();

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: [
          {
            type: 'image',
            mime_type: mimeType,
            data: cleanBase64,
          },
          {
            type: 'text',
            text:
              prompt ||
              'Subtle cinematic camera motion with realistic ambient lighting and smooth depth parallax.',
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: validAspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart?.data) {
      const videoMime = videoPart.mime_type || 'video/mp4';
      res.json({
        videoUrl: `data:${videoMime};base64,${videoPart.data}`,
        aspectRatio: validAspectRatio,
        modelUsed: 'gemini-omni-1.1-flash',
      });
      return;
    }

    if (videoPart?.uri) {
      res.json({
        videoUrl: videoPart.uri,
        aspectRatio: validAspectRatio,
        modelUsed: 'gemini-omni-1.1-flash',
      });
      return;
    }

    res.status(500).json({
      error: 'Video generation completed without a video payload.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/animate-video:', error);
    res.status(500).json({
      error: error?.message || 'Failed to animate image into video with gemini-omni-1.1-flash.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zentro server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
