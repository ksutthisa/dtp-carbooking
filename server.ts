import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

// Default LINE Token & Target User ID from system configuration
const DEFAULT_LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'kcpLMWTq1Sh0iciWD5wmyGonh2GPWlme+5hBUbMoJGnKLLhYdKEo92vj3n2qAH/kBjktvuhHi/TLFFHnWMMiQXVE81uDKS+hLyHp2H4vMSnY9LCGOjMuaS1Rx3gZBRY9iPKyrzZyvlZ/V5Hlzpg4lwdB04t89/1O/w1cDnyilFU=';
const DEFAULT_LINE_TARGET_ID = process.env.LINE_TEST_USER_ID || 'U53bc804903a24f5eea308f02793f2306';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'DTP Corporate Car Booking API'
    });
  });

  // Store recent active LINE recipients in memory from webhook
  const recentRecipients = new Map<string, { id: string; type: string; name?: string; lastSeen: string }>();

  // API Route: Get LINE Configuration info
  app.get('/api/line/config', (req, res) => {
    const token = DEFAULT_LINE_TOKEN;
    const masked = token ? `${token.substring(0, 10)}...${token.substring(token.length - 8)}` : '';
    res.json({
      configured: Boolean(token),
      maskedToken: masked,
      defaultTargetId: DEFAULT_LINE_TARGET_ID
    });
  });

  // API Route: Check LINE Bot status and profile
  app.post('/api/line/bot-info', async (req, res) => {
    try {
      const { token: customToken } = req.body;
      const targetToken = customToken || DEFAULT_LINE_TOKEN;

      if (!targetToken) {
        return res.status(400).json({ success: false, error: 'กรุณาระบุ LINE Channel Access Token' });
      }

      const lineRes = await fetch('https://api.line.me/v2/bot/info', {
        headers: {
          'Authorization': `Bearer ${targetToken}`,
        },
      });

      const data = await lineRes.json();
      if (!lineRes.ok) {
        return res.status(lineRes.status).json({
          success: false,
          status: lineRes.status,
          error: data.message || 'ไม่สามารถเชื่อมต่อ LINE Bot ได้ (Token ไม่ถูกต้องหรือหมดอายุ)',
          raw: data,
        });
      }

      return res.json({
        success: true,
        bot: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ LINE Bot',
      });
    }
  });

  // API Route: Get recent recipients who interacted with LINE Bot
  app.get('/api/line/recipients', (req, res) => {
    res.json({
      recipients: Array.from(recentRecipients.values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)),
    });
  });

  // API Route: LINE Webhook Endpoint (Receives events from LINE platform)
  app.post('/api/line/webhook', async (req, res) => {
    try {
      const events = req.body.events || [];
      const token = DEFAULT_LINE_TOKEN;

      for (const event of events) {
        const source = event.source;
        if (!source) continue;

        let targetId = source.userId;
        let targetType = 'user';

        if (source.groupId) {
          targetId = source.groupId;
          targetType = 'group';
        } else if (source.roomId) {
          targetId = source.roomId;
          targetType = 'room';
        }

        if (targetId) {
          recentRecipients.set(targetId, {
            id: targetId,
            type: targetType,
            lastSeen: new Date().toLocaleString('th-TH', { hour12: false }),
          });
        }

        // If user sent a message, auto-reply with their ID to make it super easy to set up
        if (event.type === 'message' && event.replyToken) {
          const replyText = targetType === 'group'
            ? `🚗 [DTP Fleet Booking]\nGroup ID ของกลุ่มนี้คือ:\n${targetId}\n\nคัดลอก ID นี้ไปใส่ในระบบจองรถเพื่อรับแจ้งเตือนเข้ากลุ่มได้ทันทีครับ!`
            : `🚗 [DTP Fleet Booking]\nLINE User ID ของคุณคือ:\n${targetId}\n\nคัดลอก ID นี้ไปใส่ในระบบจองรถเพื่อรับแจ้งเตือนได้ทันทีครับ!`;

          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: replyText }],
            }),
          }).catch((err) => console.error('Error replying via LINE webhook:', err));
        }
      }

      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('Error in LINE Webhook:', err);
      return res.status(200).send('OK'); // Always return 200 to LINE
    }
  });

  // API Route: Send LINE Push Notification
  app.post('/api/line/push', async (req, res) => {
    try {
      const { to, messages, token: customToken } = req.body;
      const targetToken = customToken || DEFAULT_LINE_TOKEN;
      const targetUserId = to || DEFAULT_LINE_TARGET_ID;

      if (!targetToken) {
        return res.status(400).json({ 
          success: false, 
          error: 'LINE Channel Access Token is not configured.' 
        });
      }

      if (!targetUserId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Target User/Group ID is required.' 
        });
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Messages payload must be a non-empty array.' 
        });
      }

      // Call LINE Messaging API
      const lineApiResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${targetToken}`,
        },
        body: JSON.stringify({
          to: targetUserId,
          messages: messages,
        }),
      });

      const responseText = await lineApiResponse.text();

      if (!lineApiResponse.ok) {
        console.error('LINE API Error Response:', lineApiResponse.status, responseText);
        let parsedError: any = {};
        try {
          parsedError = JSON.parse(responseText);
        } catch {
          parsedError = { message: responseText };
        }

        let friendlyThaiError = parsedError.message || 'ส่งข้อความผ่าน LINE API ไม่สำเร็จ';
        if (lineApiResponse.status === 400) {
          friendlyThaiError = `ไม่สามารถส่งได้ (400 Bad Request): รหัสผู้รับ [${targetUserId}] ไม่ถูกต้อง หรือผู้รับยังไม่ได้กดเพิ่มเพื่อนกับ LINE Bot หรือยังไม่ได้ดึงบอทเข้ากลุ่ม`;
        } else if (lineApiResponse.status === 401) {
          friendlyThaiError = 'ไม่ผ่านการยืนยันตัวตน (401 Unauthorized): LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ';
        } else if (lineApiResponse.status === 403) {
          friendlyThaiError = 'เกินโควต้า (403 Forbidden): บัญชี LINE Official Account นี้ส่งข้อความเกินโควต้าฟรีประจำเดือน หรือไม่มีสิทธิ์ Push Message';
        } else if (lineApiResponse.status === 404) {
          friendlyThaiError = `ไม่พบผู้รับ (404 Not Found): ไม่พบ User ID / Group ID [${targetUserId}] ในระบบ LINE`;
        }

        return res.status(lineApiResponse.status).json({
          success: false,
          status: lineApiResponse.status,
          error: friendlyThaiError,
          rawError: parsedError
        });
      }

      return res.json({
        success: true,
        sentTo: targetUserId,
        timestamp: new Date().toISOString(),
        messageCount: messages.length
      });

    } catch (err: any) {
      console.error('Server error during LINE push notification:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while dispatching LINE notification'
      });
    }
  });

  // API Route: Test LINE Push Notification
  app.post('/api/line/test', async (req, res) => {
    try {
      const { to, token: customToken, note } = req.body;
      const targetToken = customToken || DEFAULT_LINE_TOKEN;
      const targetUserId = to || DEFAULT_LINE_TARGET_ID;

      const nowStr = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        dateStyle: 'medium',
        timeStyle: 'medium'
      });

      const testPayload = {
        to: targetUserId,
        messages: [
          {
            type: 'flex',
            altText: '🔔 ทดสอบการแจ้งเตือนระบบจองรถ DTP Corporate Fleet',
            contents: {
              type: 'bubble',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '🚗 DTP FLEET NOTIFICATION',
                    weight: 'bold',
                    size: 'xxs',
                    color: '#2563EB',
                    letterSpacing: '2px'
                  },
                  {
                    type: 'text',
                    text: 'ทดสอบการเชื่อมต่อ LINE Bot สำเร็จ',
                    weight: 'bold',
                    size: 'md',
                    color: '#1E293B',
                    margin: 'sm'
                  }
                ],
                backgroundColor: '#F0FDF4',
                paddingAll: '16px'
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'ระบบแจ้งเตือนการจองรถของหน่วยงานสามารถส่งข้อความเข้า LINE ได้อย่างสมบูรณ์แบบ',
                    size: 'xs',
                    color: '#64748B',
                    wrap: true
                  },
                  {
                    type: 'separator',
                    margin: 'md'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'md',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'text',
                            text: 'ผู้รับ (User ID):',
                            color: '#94A3B8',
                            size: 'xxs',
                            flex: 4
                          },
                          {
                            type: 'text',
                            text: targetUserId,
                            wrap: true,
                            color: '#0F172A',
                            size: 'xxs',
                            flex: 8,
                            weight: 'bold'
                          }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'text',
                            text: 'เวลาทดสอบ:',
                            color: '#94A3B8',
                            size: 'xxs',
                            flex: 4
                          },
                          {
                            type: 'text',
                            text: nowStr,
                            color: '#0F172A',
                            size: 'xxs',
                            flex: 8
                          }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'text',
                            text: 'วัตถุประสงค์การใช้งาน:',
                            color: '#2563EB',
                            size: 'xxs',
                            flex: 4,
                            weight: 'bold'
                          },
                          {
                            type: 'text',
                            text: 'ทดสอบระบบแจ้งเตือนผ่าน LINE Bot',
                            color: '#0F172A',
                            size: 'xxs',
                            flex: 8,
                            weight: 'bold'
                          }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'text',
                            text: 'สถานะระบบ:',
                            color: '#94A3B8',
                            size: 'xxs',
                            flex: 4
                          },
                          {
                            type: 'text',
                            text: '🟢 พร้อมส่งแจ้งเตือนการจองรถ',
                            color: '#16A34A',
                            size: 'xxs',
                            flex: 8,
                            weight: 'bold'
                          }
                        ]
                      }
                    ]
                  }
                ],
                paddingAll: '16px'
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'หน่วยงานที่รองรับ: CPAM, CSAM, TRC, AKM, MEDIA, DHC, ADMIN',
                    size: 'xxs',
                    color: '#94A3B8',
                    align: 'center',
                    wrap: true
                  }
                ],
                paddingAll: '12px',
                backgroundColor: '#F8FAFC'
              }
            }
          }
        ]
      };

      const lineApiResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${targetToken}`,
        },
        body: JSON.stringify(testPayload),
      });

      const responseText = await lineApiResponse.text();

      if (!lineApiResponse.ok) {
        console.error('LINE Test API Error Response:', lineApiResponse.status, responseText);
        let parsedError: any = {};
        try {
          parsedError = JSON.parse(responseText);
        } catch {
          parsedError = { message: responseText };
        }

        let friendlyThaiError = parsedError.message || 'ส่งข้อความทดสอบไม่สำเร็จ';
        if (lineApiResponse.status === 400) {
          friendlyThaiError = `ไม่สามารถส่งได้ (400 Bad Request): รหัสผู้รับ [${targetUserId}] ไม่ถูกต้อง หรือผู้รับยังไม่ได้กดเพิ่มเพื่อนกับ LINE Bot / ยังไม่ได้ดึงบอทเข้ากลุ่ม`;
        } else if (lineApiResponse.status === 401) {
          friendlyThaiError = 'ไม่ผ่านการยืนยันตัวตน (401 Unauthorized): LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ';
        } else if (lineApiResponse.status === 403) {
          friendlyThaiError = 'เกินโควต้า (403 Forbidden): บัญชี LINE Official Account นี้ส่งข้อความเกินโควต้าฟรีประจำเดือน หรือไม่มีสิทธิ์ Push Message';
        } else if (lineApiResponse.status === 404) {
          friendlyThaiError = `ไม่พบผู้รับ (404 Not Found): ไม่พบ User ID / Group ID [${targetUserId}] ในระบบ LINE`;
        }

        return res.status(lineApiResponse.status).json({
          success: false,
          status: lineApiResponse.status,
          error: friendlyThaiError,
          rawError: parsedError
        });
      }

      return res.json({
        success: true,
        sentTo: targetUserId,
        timestamp: nowStr,
        message: 'ส่งข้อความทดสอบเข้า LINE Bot สำเร็จเรียบร้อย'
      });

    } catch (err: any) {
      console.error('Server error during LINE test push:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while dispatching test notification'
      });
    }
  });

  // Vite middleware for development or Static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DTP Car Booking Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
