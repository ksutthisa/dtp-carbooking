import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  User, 
  Users, 
  HelpCircle, 
  QrCode, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { 
  getLineConfig, 
  saveLineConfig, 
  sendLineTestMessage, 
  checkLineBotProfile, 
  getRecentLineRecipients, 
  getLineLogs,
  LineConfig,
  LineNotificationLog,
  DEFAULT_LINE_TOKEN,
  DEFAULT_LINE_TARGET_ID
} from '../utils/lineNotify';

interface LineNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const LineNotificationModal: React.FC<LineNotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [config, setConfig] = useState<LineConfig>(getLineConfig());
  const [targetId, setTargetId] = useState(config.targetUserId || DEFAULT_LINE_TARGET_ID);
  const [token, setToken] = useState(config.channelAccessToken || DEFAULT_LINE_TOKEN);
  const [showToken, setShowToken] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Bot Verification State
  const [botLoading, setBotLoading] = useState(false);
  const [botProfile, setBotProfile] = useState<any>(null);
  const [botError, setBotError] = useState<string | null>(null);

  // Test Push State
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string; timestamp?: string } | null>(null);

  // Recent Recipients State
  const [recentRecipients, setRecentRecipients] = useState<{ id: string; type: string; lastSeen: string }[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Logs
  const [logs, setLogs] = useState<LineNotificationLog[]>([]);

  // Active Tab inside modal
  const [modalTab, setModalTab] = useState<'status' | 'setup_guide' | 'logs'>('status');

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getLineConfig();
      setConfig(currentConfig);
      setTargetId(currentConfig.targetUserId || DEFAULT_LINE_TARGET_ID);
      setToken(currentConfig.channelAccessToken || DEFAULT_LINE_TOKEN);
      setLogs(getLineLogs());
      handleVerifyBot(currentConfig.channelAccessToken || DEFAULT_LINE_TOKEN);
      loadRecipients();
    }
  }, [isOpen]);

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const recs = await getRecentLineRecipients();
      setRecentRecipients(recs);
    } catch {
      // ignore
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleVerifyBot = async (targetToken: string) => {
    setBotLoading(true);
    setBotError(null);
    try {
      const res = await checkLineBotProfile(targetToken);
      if (res.success && res.bot) {
        setBotProfile(res.bot);
      } else {
        setBotProfile(null);
        setBotError(res.error || 'ไม่สามารถดึงข้อมูล LINE Bot ได้');
      }
    } catch (e: any) {
      setBotProfile(null);
      setBotError(e.message || 'การเชื่อมต่อผิดพลาด');
    } finally {
      setBotLoading(false);
    }
  };

  const handleSave = () => {
    const updated: LineConfig = {
      ...config,
      targetUserId: targetId.trim(),
      channelAccessToken: token.trim(),
    };
    saveLineConfig(updated);
    setConfig(updated);
    if (onSuccessToast) {
      onSuccessToast('💾 บันทึกการตั้งค่า LINE Bot เรียบร้อยแล้ว');
    }
  };

  const handleRunTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await sendLineTestMessage(token.trim(), targetId.trim());
      setTestResult(res);
      setLogs(getLineLogs());
      if (res.success && onSuccessToast) {
        onSuccessToast('📲 ส่งข้อความทดสอบเข้า LINE Bot สำเร็จเรียบร้อย');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'ส่งข้อความทดสอบล้มเหลว',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSelectRecipient = (id: string) => {
    setTargetId(id);
    const updated = { ...config, targetUserId: id };
    saveLineConfig(updated);
    setConfig(updated);
    if (onSuccessToast) {
      onSuccessToast(`✅ เลือกผู้รับ ${id} และบันทึกเรียบร้อย`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0b1120] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-['Prompt'] text-white">
                  ตัวช่วยตรวจสอบ & ตั้งค่าแจ้งเตือน LINE Bot
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LINE Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ตรวจสอบสาเหตุที่การแจ้งเตือนไม่เข้า พร้อมวิธีรับ User ID และตั้งค่าเข้ากลุ่ม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold shrink-0">
          <button
            onClick={() => setModalTab('status')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'status'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>สถานะ & ทดสอบระบบ</span>
          </button>
          <button
            onClick={() => setModalTab('setup_guide')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'setup_guide'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>วิธีรับ ID & ดึงเข้ากลุ่ม (3 ขั้นตอน)</span>
          </button>
          <button
            onClick={() => setModalTab('logs')}
            className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              modalTab === 'logs'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ประวัติการส่ง ({logs.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* TAB 1: STATUS & CONFIG */}
          {modalTab === 'status' && (
            <div className="space-y-4">
              
              {/* Bot Info Banner */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {botLoading ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center animate-spin text-slate-400">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                  ) : botProfile ? (
                    <div className="relative">
                      {botProfile.pictureUrl ? (
                        <img 
                          src={botProfile.pictureUrl} 
                          alt="Bot" 
                          className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          BOT
                        </div>
                      )}
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {botProfile?.displayName || 'LINE Official Account Bot'}
                      </span>
                      {botProfile && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {botProfile.basicId || '@bot'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {botProfile 
                        ? '🟢 Bot พร้อมส่งข้อความ Flex Ticket เข้า LINE' 
                        : botError || 'ไม่สามารถเชื่อมต่อ LINE Bot ได้ กรุณาตรวจสอบ Token'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyBot(token)}
                  disabled={botLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${botLoading ? 'animate-spin' : ''}`} />
                  <span>ตรวจสอบ Bot Profile</span>
                </button>
              </div>

              {/* Push Test Action Box */}
              <div className="bg-gradient-to-br from-slate-800/90 to-emerald-950/40 rounded-2xl p-4 border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>ทดสอบส่งการแจ้งเตือนเข้า LINE เดี๋ยวนี้ (1-Click Test)</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      ส่งข้อความ Flex Card ไปยังผู้รับ <strong className="text-emerald-300 font-mono">{targetId || 'ยังไม่ได้ระบุ'}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunTest}
                    disabled={testLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังส่งข้อความ...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>🚀 ส่งข้อความทดสอบ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-150 ${
                    testResult.success 
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold">
                        {testResult.success ? '✅ ข้อความส่งเข้า LINE สำเร็จเรียบร้อย!' : '❌ การส่งข้อความไม่สำเร็จ'}
                      </p>
                      <p className="text-[11px] mt-0.5 leading-relaxed">
                        {testResult.message || testResult.error}
                      </p>
                      {!testResult.success && (
                        <div className="mt-2 pt-2 border-t border-rose-800/40 flex items-center gap-2 text-[11px] text-rose-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>ดูวิธีแก้ไขปัญหาที่แท็บ <strong>"วิธีรับ ID & ดึงเข้ากลุ่ม"</strong> ด้านบน</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Target User / Group ID Input */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>รหัสผู้รับ (LINE User ID หรือ Group ID):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(targetId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="เช่น U53bc804903a24f5eea308f02793f2306 หรือ C98a12..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer active:scale-95"
                  >
                    บันทึก ID
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  * ต้องเป็น User ID ที่เคยเพิ่มเพื่อนกับบอทแล้ว หรือ Group ID ที่ดึงบอทเข้ากลุ่ม
                </p>
              </div>

              {/* Recent Active Chat Recipients (Auto-detected from webhook) */}
              {recentRecipients.length > 0 && (
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>ID ที่เพิ่งทักหาบอทล่าสุด (คลิกเพื่อเลือกทันที):</span>
                    </span>
                    <button
                      type="button"
                      onClick={loadRecipients}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingRecipients ? 'animate-spin' : ''}`} />
                      <span>รีเฟรช</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentRecipients.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleSelectRecipient(rec.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 transition-all cursor-pointer ${
                          targetId === rec.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {rec.type === 'group' ? (
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{rec.id.substring(0, 14)}...</span>
                        <span className="text-[9px] text-slate-400">({rec.lastSeen})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LINE Channel Access Token */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>LINE Channel Access Token (Long-lived):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showToken ? 'ซ่อน' : 'แสดง'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(token);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedToken ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Channel Access Token..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all cursor-pointer active:scale-95"
                  >
                    บันทึก Token
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SETUP GUIDE (3 STEPS) */}
          {modalTab === 'setup_guide' && (
            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    เพิ่มเพื่อนกับบัญชี LINE Official Account (Bot)
                  </h4>
                </div>
                <p className="text-slate-300 text-xs pl-8">
                  ตามเงื่อนไขของ LINE Messaging API บอทจะสามารถส่งข้อความหาคุณได้เฉพาะเมื่อคุณได้ <strong>เพิ่มเพื่อนกับ LINE Bot</strong> แล้วเท่านั้น
                </p>
                <div className="pl-8 pt-1 flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl inline-block shadow-md">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <p className="font-semibold text-emerald-300">
                      ค้นหา Bot ID: <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">{botProfile?.basicId || '@dtp-fleet-bot'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      หรือสแกน QR Code จาก LINE Official Account Manager ขององค์กร
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    วิธีดู LINE User ID ของคุณ
                  </h4>
                </div>
                <div className="pl-8 space-y-2 text-slate-300 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>วิธีที่ง่ายที่สุด:</span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      พิมพ์คำว่า <strong>"id"</strong> หรือทักทายในแชทของ LINE Bot บอทจะส่ง User ID ตอบกลับมาทันที จากนั้นนำมาใส่ในระบบ
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * LINE User ID จะขึ้นต้นด้วยตัวอักษร <strong>U</strong> ตามด้วยตัวเลขและตัวอักษร 32 หลัก (ไม่ใช่ LINE ID ที่ใช้ค้นหาเพื่อน)
                  </p>
                </div>
              </div>

              {/* Step 3: Group ID */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>ต้องการให้แจ้งเตือนเข้ากลุ่ม LINE แผนก/ฝ่าย?</span>
                  </h4>
                </div>
                <div className="pl-8 space-y-2 text-slate-300 text-xs">
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                    <li>เชิญ LINE Bot เข้ากลุ่มของแผนกที่คุณต้องการให้แจ้งเตือน</li>
                    <li>พิมพ์ข้อความอะไรก็ได้ในกลุ่ม บอทจะส่ง <strong>Group ID (ขึ้นต้นด้วย C...)</strong> ตอบกลับมา</li>
                    <li>นำ Group ID นั้นมากรอกในช่อง <strong>"รหัสผู้รับ"</strong> ในระบบนี้</li>
                  </ol>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                    💡 เมื่อตั้งเป็น Group ID ทุกครั้งที่มีการจองรถและอนุมัติ ระบบจะส่งแจ้งเตือนเข้ากลุ่ม ให้ทุกคนในแผนกเห็นพร้อมกันทันที!
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LOGS */}
          {modalTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs">
                  ประวัติการเรียกส่งแจ้งเตือนล่าสุด ({logs.length} รายการ)
                </span>
                <span className="text-[10px] text-slate-500">เก็บสูงสุด 30 รายการล่าสุด</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>ยังไม่มีประวัติการส่งแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        log.success 
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {log.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {log.type === 'booking_auto_approved' && '🚗 จองรถ (อนุมัติอัตโนมัติ)'}
                              {log.type === 'departure_reminder' && '⏰ เตือนก่อนออกเดินทาง 1 ชม.'}
                              {log.type === 'status_change' && '🔄 เปลี่ยนสถานะคำขอ'}
                              {log.type === 'test' && '🔔 ทดสอบระบบ'}
                            </span>
                            {log.bookingId && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                                {log.bookingId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] mt-0.5 text-slate-400 font-mono">
                            ผู้รับ: {log.targetId}
                          </p>
                          {log.error && (
                            <p className="text-[11px] mt-1 text-rose-300 font-medium">
                              ❌ {log.error}
                            </p>
                          )}
                          {log.message && (
                            <p className="text-[11px] mt-1 text-emerald-300">
                              ✅ {log.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">
            DTP Fleet Management • LINE Messaging API
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
