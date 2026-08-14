import { BookingRequest, Vehicle, Driver, BookingApprovalStatus } from '../types';

export interface LineConfig {
  channelAccessToken: string;
  targetUserId: string;
  autoNotifyOnNewBooking: boolean;
  autoNotifyOnStatusChange: boolean;
}

export const DEFAULT_LINE_TOKEN = 'kcpLMWTq1Sh0iciWD5wmyGonh2GPWlme+5hBUbMoJGnKLLhYdKEo92vj3n2qAH/kBjktvuhHi/TLFFHnWMMiQXVE81uDKS+hLyHp2H4vMSnY9LCGOjMuaS1Rx3gZBRY9iPKyrzZyvlZ/V5Hlzpg4lwdB04t89/1O/w1cDnyilFU=';
export const DEFAULT_LINE_TARGET_ID = 'U53bc804903a24f5eea308f02793f2306';

const STORAGE_KEY = 'dtp_line_notification_config';

export function getLineConfig(): LineConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        channelAccessToken: parsed.channelAccessToken || DEFAULT_LINE_TOKEN,
        targetUserId: parsed.targetUserId || DEFAULT_LINE_TARGET_ID,
        autoNotifyOnNewBooking: parsed.autoNotifyOnNewBooking !== false,
        autoNotifyOnStatusChange: parsed.autoNotifyOnStatusChange !== false,
      };
    }
  } catch (e) {
    console.error('Failed to parse line config from localStorage', e);
  }
  return {
    channelAccessToken: DEFAULT_LINE_TOKEN,
    targetUserId: DEFAULT_LINE_TARGET_ID,
    autoNotifyOnNewBooking: true,
    autoNotifyOnStatusChange: true,
  };
}

export function saveLineConfig(config: LineConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save line config to localStorage', e);
  }
}

/**
 * Creates a beautiful LINE Flex Message payload for auto-approved booking notifications
 */
export function buildNewBookingFlexMessage(
  booking: BookingRequest,
  vehicle?: Vehicle,
  driver?: Driver
) {
  const statusColor = '#10B981'; // Green for approved
  const statusName = '✅ อนุมัติแล้ว (Auto-Approved พร้อมเดินทาง)';

  return {
    type: 'flex',
    altText: `✅ [แจ้งเตือนอนุมัติการใช้รถ] รหัส ${booking.id} โดย ${booking.bookerName} (${booking.department})`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#064E3B', // Rich deep emerald
        paddingAll: '18px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🚗 DTP FLEET NOTIFICATION',
                color: '#6EE7B7',
                size: 'xxs',
                weight: 'bold',
                letterSpacing: '1.5px',
                flex: 1
              },
              {
                type: 'text',
                text: '✅ อนุมัติการใช้รถเรียบร้อย',
                color: '#ECFDF5',
                size: 'xxs',
                align: 'end',
                weight: 'bold'
              }
            ]
          },
          {
            type: 'text',
            text: `คำขอใช้รถหมายเลข: ${booking.id}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'sm',
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'xs',
            contents: [
              {
                type: 'text',
                text: 'สถานะ: ',
                color: '#A7F3D0',
                size: 'xs'
              },
              {
                type: 'text',
                text: statusName,
                color: '#FFFFFF',
                weight: 'bold',
                size: 'xs'
              }
            ]
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          // Section: Booker Info
          {
            type: 'text',
            text: '👤 ข้อมูลผู้ขอใช้รถและสังกัด',
            size: 'xs',
            weight: 'bold',
            color: '#0F172A'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ผู้ขอ:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: booking.bookerName, color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'หน่วยงาน:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.department}`, color: '#2563EB', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'เบอร์ติดต่อ:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: booking.phone || '-', color: '#1E293B', size: 'xs', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ผู้โดยสาร:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.passengers} ท่าน`, color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              }
            ]
          },
          { type: 'separator', margin: 'md' },

          // Section: Itinerary
          {
            type: 'text',
            text: '📅 วันและเวลาเดินทาง',
            size: 'xs',
            weight: 'bold',
            color: '#0F172A',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ออกเดินทาง:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.departureDate} เวลา ${booking.departureTime} น.`, color: '#0F172A', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'เดินทางกลับ:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.returnDate} เวลา ${booking.returnTime} น.`, color: '#0F172A', size: 'xs', flex: 7 }
                ]
              }
            ]
          },
          { type: 'separator', margin: 'md' },

          // Section: Locations & Purpose
          {
            type: 'text',
            text: '📍 เส้นทางและวัตถุประสงค์การใช้งาน',
            size: 'xs',
            weight: 'bold',
            color: '#0F172A',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'จุดรับ:', color: '#059669', size: 'xs', flex: 4, weight: 'bold' },
                  { type: 'text', text: booking.pickupLocation || 'สำนักงานใหญ่', color: '#1E293B', size: 'xs', wrap: true, flex: 8 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ปลายทาง:', color: '#E11D48', size: 'xs', flex: 4, weight: 'bold' },
                  { type: 'text', text: booking.destinationLocation, color: '#1E293B', size: 'xs', wrap: true, flex: 8 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                margin: 'xs',
                contents: [
                  { type: 'text', text: 'วัตถุประสงค์การใช้งาน:', color: '#2563EB', size: 'xs', weight: 'bold', flex: 4 },
                  { type: 'text', text: booking.purpose || '-', color: '#0F172A', size: 'xs', weight: 'bold', wrap: true, flex: 8 }
                ]
              }
            ]
          },
          { type: 'separator', margin: 'md' },

          // Section: Resource Assigned
          {
            type: 'text',
            text: '🚙 ยานพาหนะและสารถี',
            size: 'xs',
            weight: 'bold',
            color: '#0F172A',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'รถยนต์:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: vehicle?.name || 'รอจัดสรร', color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'สารถี:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: driver ? `${driver.name} (${driver.phone})` : 'รอจัดสรร', color: '#1E293B', size: 'xs', flex: 7 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        backgroundColor: '#F8FAFC',
        contents: [
          {
            type: 'text',
            text: `หน่วยงาน: ${booking.department} • อนุมัติการใช้รถเมื่อ: ${booking.createdAt}`,
            size: 'xxs',
            color: '#64748B',
            align: 'center',
            wrap: true
          }
        ]
      }
    }
  };
}

/**
 * Creates a LINE Flex Message payload for booking status updates (Approved, In-transit, etc.)
 */
export function buildStatusUpdateFlexMessage(
  booking: BookingRequest,
  newStatus: BookingApprovalStatus,
  vehicle?: Vehicle,
  driver?: Driver
) {
  const statusConfigs: { [key in BookingApprovalStatus]: { title: string; color: string; bg: string; icon: string } } = {
    pending: { title: 'รอการอนุมัติ', color: '#CA8A04', bg: '#FEFCE8', icon: '⏳' },
    approved: { title: 'อนุมัติการใช้รถเรียบร้อย', color: '#2563EB', bg: '#EFF6FF', icon: '✅' },
    in_transit: { title: 'รถออกเดินทางแล้ว (กำลังเดินทาง)', color: '#059669', bg: '#ECFDF5', icon: '🚙' },
    completed: { title: 'เสร็จสิ้นการเดินทาง', color: '#475569', bg: '#F8FAFC', icon: '🏁' },
    rejected: { title: 'ไม่อนุมัติคำขอใช้รถ', color: '#DC2626', bg: '#FEF2F2', icon: '❌' },
    cancelled: { title: 'ยกเลิกคำขอ', color: '#94A3B8', bg: '#F8FAFC', icon: '🚫' },
  };

  const current = statusConfigs[newStatus] || statusConfigs.pending;

  return {
    type: 'flex',
    altText: `📢 [อัปเดตสถานะ] คำขอ ${booking.id}: ${current.title}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: current.bg,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${current.icon} ${current.title}`,
            color: current.color,
            weight: 'bold',
            size: 'md'
          },
          {
            type: 'text',
            text: `รหัสคำขอ: ${booking.id} (${booking.department})`,
            color: '#475569',
            size: 'xs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ผู้ขอ:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.bookerName} (ฝ่าย ${booking.department})`, color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'จุดหมาย:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: booking.destinationLocation, color: '#1E293B', size: 'xs', wrap: true, flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'วัตถุประสงค์:', color: '#2563EB', size: 'xs', weight: 'bold', flex: 3 },
                  { type: 'text', text: booking.purpose || '-', color: '#0F172A', size: 'xs', weight: 'bold', wrap: true, flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'วันเดินทาง:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: `${booking.departureDate} (${booking.departureTime} - ${booking.returnTime})`, color: '#1E293B', size: 'xs', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'รถที่จัดสรร:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: vehicle?.name || 'ตามระบบ', color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'สารถี:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: driver ? `${driver.name} (โทร ${driver.phone})` : 'ตามระบบ', color: '#1E293B', size: 'xs', flex: 7 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        backgroundColor: '#F8FAFC',
        contents: [
          {
            type: 'text',
            text: `อัปเดตเมื่อ: ${new Date().toLocaleString('th-TH')}`,
            size: 'xxs',
            color: '#94A3B8',
            align: 'center'
          }
        ]
      }
    }
  };
}

/**
 * Creates a LINE Flex Message payload for 1-Hour Pre-Departure Reminder
 */
export function buildDepartureReminderFlexMessage(
  booking: BookingRequest,
  vehicle?: Vehicle,
  driver?: Driver
) {
  return {
    type: 'flex',
    altText: `⏰ [แจ้งเตือนก่อนออกเดินทาง 1 ชม.] รหัส ${booking.id} - ${booking.destinationLocation} (${booking.departureTime} น.)`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#78350F', // Warm amber / deep bronze
        paddingAll: '18px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '⏰ DEPARTURE REMINDER (1 HR)',
                color: '#FDE68A',
                size: 'xxs',
                weight: 'bold',
                letterSpacing: '1.5px',
                flex: 1
              },
              {
                type: 'text',
                text: '🔔 เตรียมพร้อมเดินทาง',
                color: '#FEF3C7',
                size: 'xxs',
                align: 'end',
                weight: 'bold'
              }
            ]
          },
          {
            type: 'text',
            text: `เตือนก่อนออกเดินทาง 1 ชั่วโมง: ${booking.id}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'sm',
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'xs',
            contents: [
              {
                type: 'text',
                text: 'เวลาออกเดินทาง: ',
                color: '#FDE68A',
                size: 'xs'
              },
              {
                type: 'text',
                text: `วันนี้ เวลา ${booking.departureTime} น.`,
                color: '#FFFFFF',
                weight: 'bold',
                size: 'xs'
              }
            ]
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          // Banner Notice
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FFFBEB',
            borderColor: '#FCD34D',
            borderWidth: '1px',
            cornerRadius: '10px',
            paddingAll: '10px',
            contents: [
              {
                type: 'text',
                text: `🚗 รถจะออกเดินทางในอีกประมาณ 1 ชั่วโมง กรุณาเตรียมสัมภาระและพร้อม ณ จุดรับก่อนเวลา`,
                size: 'xxs',
                color: '#92400E',
                wrap: true,
                weight: 'bold'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ผู้ขอ/คณะ:', color: '#64748B', size: 'xs', flex: 4 },
                  { type: 'text', text: `${booking.bookerName} (${booking.department})`, color: '#1E293B', size: 'xs', weight: 'bold', flex: 8 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'จุดนัดรับ:', color: '#059669', size: 'xs', weight: 'bold', flex: 4 },
                  { type: 'text', text: booking.pickupLocation || 'สำนักงานใหญ่', color: '#1E293B', size: 'xs', wrap: true, flex: 8 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'ปลายทาง:', color: '#E11D48', size: 'xs', weight: 'bold', flex: 4 },
                  { type: 'text', text: booking.destinationLocation, color: '#1E293B', size: 'xs', wrap: true, flex: 8 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                margin: 'xs',
                contents: [
                  { type: 'text', text: 'วัตถุประสงค์:', color: '#2563EB', size: 'xs', weight: 'bold', flex: 4 },
                  { type: 'text', text: booking.purpose || '-', color: '#0F172A', size: 'xs', weight: 'bold', wrap: true, flex: 8 }
                ]
              }
            ]
          },
          { type: 'separator', margin: 'md' },

          // Vehicle & Driver Details
          {
            type: 'text',
            text: '🚙 ยานพาหนะ & สารถีประจำรถ',
            size: 'xs',
            weight: 'bold',
            color: '#0F172A',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'sm',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'รถยนต์:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: vehicle?.name || 'ตามการจัดสรร', color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'สารถี:', color: '#64748B', size: 'xs', flex: 3 },
                  { type: 'text', text: driver ? `${driver.name} (โทร ${driver.phone})` : 'ตามการจัดสรร', color: '#1E293B', size: 'xs', weight: 'bold', flex: 7 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        backgroundColor: '#F8FAFC',
        contents: [
          {
            type: 'text',
            text: `ระบบแจ้งเตือนอัตโนมัติก่อนเดินทาง 1 ชั่วโมง • DTP Fleet`,
            size: 'xxs',
            color: '#64748B',
            align: 'center'
          }
        ]
      }
    }
  };
}

export interface LineNotificationLog {
  id: string;
  type: 'booking_auto_approved' | 'departure_reminder' | 'status_change' | 'test';
  timestamp: string;
  targetId: string;
  success: boolean;
  message?: string;
  error?: string;
  bookingId?: string;
}

const LOG_STORAGE_KEY = 'dtp_line_notification_logs';

export function getLineLogs(): LineNotificationLog[] {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLineLog(log: Omit<LineNotificationLog, 'id'>): void {
  try {
    const existing = getLineLogs();
    const newLog: LineNotificationLog = {
      ...log,
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [newLog, ...existing].slice(0, 30);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save LINE log', e);
  }
}

export async function checkLineBotProfile(token?: string): Promise<{ success: boolean; bot?: any; error?: string }> {
  const config = getLineConfig();
  const effectiveToken = token || config.channelAccessToken || DEFAULT_LINE_TOKEN;

  try {
    const res = await fetch('/api/line/bot-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: effectiveToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true, bot: data.bot };
  } catch (err: any) {
    return { success: false, error: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
  }
}

export async function getRecentLineRecipients(): Promise<{ id: string; type: string; lastSeen: string }[]> {
  try {
    const res = await fetch('/api/line/recipients');
    if (!res.ok) return [];
    const data = await res.json();
    return data.recipients || [];
  } catch {
    return [];
  }
}

/**
 * Dispatches a LINE push notification via the backend proxy
 */
export async function sendLineBookingNotification(
  booking: BookingRequest,
  vehicle?: Vehicle,
  driver?: Driver
): Promise<{ success: boolean; error?: string; sentTo?: string }> {
  const config = getLineConfig();
  if (!config.autoNotifyOnNewBooking) {
    return { success: true, sentTo: 'Skipped (Auto-notify disabled)' };
  }

  const flexPayload = buildNewBookingFlexMessage(booking, vehicle, driver);
  const targetId = config.targetUserId || DEFAULT_LINE_TARGET_ID;

  try {
    const res = await fetch('/api/line/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetId,
        token: config.channelAccessToken || DEFAULT_LINE_TOKEN,
        messages: [flexPayload],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('LINE push notification error:', data);
      const errMsg = data.error || `HTTP ${res.status}`;
      addLineLog({
        type: 'booking_auto_approved',
        timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
        targetId,
        success: false,
        error: errMsg,
        bookingId: booking.id,
      });
      return { success: false, error: errMsg };
    }

    addLineLog({
      type: 'booking_auto_approved',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: true,
      message: `ส่งการแจ้งเตือนอนุมัติคำขอ ${booking.id} สำเร็จ`,
      bookingId: booking.id,
    });
    return { success: true, sentTo: data.sentTo };
  } catch (err: any) {
    console.error('Error sending LINE notification:', err);
    const errMsg = err.message || 'Network error';
    addLineLog({
      type: 'booking_auto_approved',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: false,
      error: errMsg,
      bookingId: booking.id,
    });
    return { success: false, error: errMsg };
  }
}

/**
 * Dispatches a 1-Hour Pre-Departure Reminder notification to LINE
 */
export async function sendLineDepartureReminder(
  booking: BookingRequest,
  vehicle?: Vehicle,
  driver?: Driver
): Promise<{ success: boolean; error?: string; sentTo?: string }> {
  const config = getLineConfig();
  const flexPayload = buildDepartureReminderFlexMessage(booking, vehicle, driver);
  const targetId = config.targetUserId || DEFAULT_LINE_TARGET_ID;

  try {
    const res = await fetch('/api/line/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetId,
        token: config.channelAccessToken || DEFAULT_LINE_TOKEN,
        messages: [flexPayload],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error || `HTTP ${res.status}`;
      addLineLog({
        type: 'departure_reminder',
        timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
        targetId,
        success: false,
        error: errMsg,
        bookingId: booking.id,
      });
      return { success: false, error: errMsg };
    }

    addLineLog({
      type: 'departure_reminder',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: true,
      message: `ส่งแจ้งเตือนก่อนออกเดินทาง 1 ชม. สำหรับคำขอ ${booking.id} สำเร็จ`,
      bookingId: booking.id,
    });
    return { success: true, sentTo: data.sentTo };
  } catch (err: any) {
    console.error('Error sending LINE departure reminder:', err);
    const errMsg = err.message || 'Network error';
    addLineLog({
      type: 'departure_reminder',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: false,
      error: errMsg,
      bookingId: booking.id,
    });
    return { success: false, error: errMsg };
  }
}

/**
 * Dispatches a status update notification to LINE
 */
export async function sendLineStatusNotification(
  booking: BookingRequest,
  newStatus: BookingApprovalStatus,
  vehicle?: Vehicle,
  driver?: Driver
): Promise<{ success: boolean; error?: string; sentTo?: string }> {
  // Requirement: เมื่อมีการใช้รถจบ ก็ไม่ต้องเตือนอีก (Skip LINE push for completed trips)
  if (newStatus === 'completed') {
    return { success: true, sentTo: 'Skipped (Completed trip notification skipped per rule)' };
  }

  const config = getLineConfig();
  if (!config.autoNotifyOnStatusChange) {
    return { success: true, sentTo: 'Skipped (Auto-notify status disabled)' };
  }

  const flexPayload = buildStatusUpdateFlexMessage(booking, newStatus, vehicle, driver);
  const targetId = config.targetUserId || DEFAULT_LINE_TARGET_ID;

  try {
    const res = await fetch('/api/line/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetId,
        token: config.channelAccessToken || DEFAULT_LINE_TOKEN,
        messages: [flexPayload],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error || `HTTP ${res.status}`;
      addLineLog({
        type: 'status_change',
        timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
        targetId,
        success: false,
        error: errMsg,
        bookingId: booking.id,
      });
      return { success: false, error: errMsg };
    }

    addLineLog({
      type: 'status_change',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: true,
      message: `แจ้งเปลี่ยนสถานะ ${booking.id} เป็น [${newStatus}] สำเร็จ`,
      bookingId: booking.id,
    });
    return { success: true, sentTo: data.sentTo };
  } catch (err: any) {
    console.error('Error sending LINE status notification:', err);
    const errMsg = err.message || 'Network error';
    addLineLog({
      type: 'status_change',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId,
      success: false,
      error: errMsg,
      bookingId: booking.id,
    });
    return { success: false, error: errMsg };
  }
}

/**
 * Dispatches a test push notification to verify bot token and target user ID
 */
export async function sendLineTestMessage(
  token?: string,
  targetId?: string
): Promise<{ success: boolean; message?: string; error?: string; timestamp?: string }> {
  const config = getLineConfig();
  const effectiveToken = token || config.channelAccessToken || DEFAULT_LINE_TOKEN;
  const effectiveTargetId = targetId || config.targetUserId || DEFAULT_LINE_TARGET_ID;

  try {
    const res = await fetch('/api/line/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: effectiveTargetId,
        token: effectiveToken,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error || `HTTP ${res.status}: Failed to reach LINE API`;
      addLineLog({
        type: 'test',
        timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
        targetId: effectiveTargetId,
        success: false,
        error: errMsg,
      });
      return { 
        success: false, 
        error: errMsg 
      };
    }

    addLineLog({
      type: 'test',
      timestamp: data.timestamp || new Date().toLocaleString('th-TH', { hour12: false }),
      targetId: effectiveTargetId,
      success: true,
      message: data.message || 'ส่งข้อความทดสอบสำเร็จ',
    });

    return {
      success: true,
      message: data.message || 'ส่งข้อความทดสอบสำเร็จเรียบร้อย',
      timestamp: data.timestamp
    };
  } catch (err: any) {
    const errMsg = err.message || 'Network communication failure';
    addLineLog({
      type: 'test',
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      targetId: effectiveTargetId,
      success: false,
      error: errMsg,
    });
    return { success: false, error: errMsg };
  }
}
