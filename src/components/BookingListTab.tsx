import React, { useState } from 'react';
import { 
  ListOrdered, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Eye, 
  Printer, 
  ChevronRight,
  Download,
  AlertCircle,
  FileSpreadsheet,
  BellRing,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { BookingRequest, Vehicle, Driver, BookingApprovalStatus } from '../types';
import { exportCarUsageReportToExcel } from '../utils/excelExport';

interface BookingListTabProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  drivers: Driver[];
  userRole: 'admin' | 'user' | 'driver';
  onUpdateBookingStatus: (bookingId: string, status: BookingApprovalStatus) => void;
  onSendDepartureReminder?: (bookingId: string) => void;
}

export const BookingListTab: React.FC<BookingListTabProps> = ({
  bookings,
  vehicles,
  drivers,
  userRole,
  onUpdateBookingStatus,
  onSendDepartureReminder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<BookingRequest | null>(null);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.bookerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BookingApprovalStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> รออนุมัติ</span>;
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> พร้อมเดินทาง</span>;
      case 'in_transit':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> กำลังเดินทาง</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1">เสร็จสิ้นการใช้รถ</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> ไม่อนุมัติ</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-xs">ยกเลิก</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-md border border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-600" />
            รายการขอใช้รถยนต์ทั้งหมด ({bookings.length} รายการ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบสถานะคำขอ อนุมัติการใช้รถ และออกใบสั่งการเดินทาง
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อผู้จอง, รหัส, แผนก..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">⏳ รออนุมัติ</option>
            <option value="approved">✅ อนุมัติแล้ว</option>
            <option value="in_transit">🚗 กำลังเดินทาง</option>
            <option value="completed">🏁 เสร็จสิ้น</option>
            <option value="rejected">❌ ไม่อนุมัติ</option>
          </select>

          <button
            type="button"
            onClick={() => {
              exportCarUsageReportToExcel({
                bookings: filteredBookings,
                vehicles,
                drivers,
                filename: `รายการขอใช้รถ_DTP_${new Date().toISOString().slice(0, 10)}.xlsx`,
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="ส่งออกรายการที่กรองเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel ({filteredBookings.length})</span>
          </button>
        </div>
      </div>

      {/* System Policy Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-blue-950">
            ระบบยืนยันอัตโนมัติ ไม่ต้องรออนุมัติหรือปล่อยรถ (Instant Active & Smart Reminders)
          </p>
          <p className="text-blue-800 leading-relaxed">
            • <strong>ตอนกดจอง/ออกเดินทาง:</strong> แจ้งเตือนเข้า LINE ทันที พร้อมเดินทางได้เลย <br />
            • <strong>หากจองล่วงหน้า:</strong> ระบบจะส่งแจ้งเตือนเตือนความจำอีก 1 ครั้งก่อนถึงเวลาออกเดินทางจริง 1 ชั่วโมง <br />
            • <strong>เมื่อใช้รถจบ:</strong> กดปุ่ม "เสร็จสิ้นการใช้รถ" โดยระบบจะไม่ส่งข้อความแจ้งเตือนซ้ำเข้า LINE ตามเงื่อนไข
          </p>
        </div>
      </div>

      {/* Bookings Table / Card List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-medium">ไม่พบรายการขอใช้รถตามเงื่อนไขที่ค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBookings.map((b) => {
              const veh = vehicles.find((v) => v.id === b.vehicleId);
              const drv = drivers.find((d) => d.id === b.driverId);

              return (
                <div key={b.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: ID, Booker, Dept, Purpose */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {b.id}
                      </span>
                      {getStatusBadge(b.status)}
                      {b.reminderSent && (
                        <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                          <BellRing className="w-3 h-3 text-amber-600" />
                          <span>เตือน 1 ชม. แล้ว</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400">จองเมื่อ: {b.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span>{b.bookerName}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-normal">
                        {b.department}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        (ผู้โดยสาร {b.passengers} ท่าน | โทร: {b.phone})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      <strong>วัตถุประสงค์:</strong> {b.purpose}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>เดินทาง: {b.departureDate} ({b.departureTime} น.) ถึง {b.returnDate} ({b.returnTime} น.)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>สารถี: {drv?.name || 'ไม่ระบุ'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>รถ: {veh?.name.split(' ')[0]} ({veh?.plateNumber.split(' ')[0]})</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => setSelectedTicket(b)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>ใบขอใช้รถ</span>
                    </button>

                    {/* Quick Trigger for 1-Hour Departure Reminder */}
                    {(b.status === 'approved' || b.status === 'in_transit') && onSendDepartureReminder && (
                      <button
                        onClick={() => onSendDepartureReminder(b.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          b.reminderSent
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                        title="ส่งการแจ้งเตือนเตือนความจำก่อนออกเดินทาง 1 ชั่วโมงเข้า LINE"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{b.reminderSent ? 'ส่งเตือน 1 ชม. ซ้ำ' : '⏰ เตือนก่อนออก (1 ชม.)'}</span>
                      </button>
                    )}

                    {/* Finish Trip Action (No LINE notification sent on completion per user rule) */}
                    {(b.status === 'approved' || b.status === 'in_transit') && (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="เมื่อเสร็จสิ้นการใช้รถ จะไม่มีการส่งแจ้งเตือนเข้า LINE อีก"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เสร็จสิ้นการใช้รถ</span>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected' && (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer"
                        title="ยกเลิกคำขอนี้"
                      >
                        <span>ยกเลิก</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 text-slate-900 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold font-['Prompt'] text-slate-900">
                  ใบอนุญาตใช้ยานพาหนะส่วนกลาง (e-Trip Ticket)
                </h3>
                <p className="text-xs text-slate-500 font-mono">เลขที่: {selectedTicket.id}</p>
              </div>
              <div>{getStatusBadge(selectedTicket.status)}</div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">ผู้ขอใช้รถ:</span>
                  <strong className="text-slate-800">{selectedTicket.bookerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ฝ่าย/แผนก:</span>
                  <strong className="text-slate-800">{selectedTicket.department}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">โทรศัพท์:</span>
                  <strong className="text-slate-800">{selectedTicket.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">จำนวนผู้โดยสาร:</span>
                  <strong className="text-slate-800">{selectedTicket.passengers} ท่าน</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">วัตถุประสงค์:</span>
                <p className="text-slate-800 font-medium">{selectedTicket.purpose}</p>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">จุดรับ:</span>
                  <strong className="text-slate-800">{selectedTicket.pickupLocation}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">จุดหมายปลายทาง:</span>
                  <strong className="text-slate-800">{selectedTicket.destinationLocation}</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">วัน-เวลาเดินทาง:</span>
                  <strong className="text-slate-800">{selectedTicket.departureDate} ({selectedTicket.departureTime} น.)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">วัน-เวลาเดินทางกลับ:</span>
                  <strong className="text-slate-800">{selectedTicket.returnDate} ({selectedTicket.returnTime} น.)</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
