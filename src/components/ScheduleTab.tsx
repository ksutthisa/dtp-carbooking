import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Car, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Vehicle, BookingRequest, Driver } from '../types';

interface ScheduleTabProps {
  vehicles: Vehicle[];
  bookings: BookingRequest[];
  drivers: Driver[];
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  vehicles,
  bookings,
  drivers,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-14');
  const [viewMode, setViewMode] = useState<'vehicle' | 'driver'>('vehicle');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Helper to convert "HH:mm" to minutes from 08:00
  const getTimelinePosition = (timeStr: string) => {
    const [h, m] = (timeStr || '08:00').split(':').map(Number);
    const totalMinutes = h * 60 + (m || 0);
    const startMinutes = 8 * 60; // 08:00
    const endMinutes = 18 * 60;  // 18:00
    const clamped = Math.max(startMinutes, Math.min(endMinutes, totalMinutes));
    return ((clamped - startMinutes) / (endMinutes - startMinutes)) * 100;
  };

  // Helper to calculate effective start & end time for a booking on the selected date
  const getBookingEffectiveTimes = (b: BookingRequest, targetDate: string) => {
    let effectiveStart = '08:00';
    let effectiveEnd = '18:00';

    if (b.departureDate === targetDate) {
      effectiveStart = b.departureTime;
    }
    if (b.returnDate === targetDate) {
      effectiveEnd = b.returnTime;
    }
    return { effectiveStart, effectiveEnd };
  };

  // Helper to calculate status colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return { bg: 'bg-emerald-600', text: 'กำลังเดินทาง', border: 'border-emerald-700' };
      case 'approved':
        return { bg: 'bg-blue-600', text: 'อนุมัติแล้ว', border: 'border-blue-700' };
      case 'pending':
        return { bg: 'bg-amber-600', text: 'รออนุมัติ', border: 'border-amber-700' };
      default:
        return { bg: 'bg-slate-600', text: status, border: 'border-slate-700' };
    }
  };

  // Check if a vehicle/driver has conflicting bookings on this date
  const checkRowHasConflict = (rowBookings: BookingRequest[], targetDate: string) => {
    if (rowBookings.length < 2) return false;
    for (let i = 0; i < rowBookings.length; i++) {
      for (let j = i + 1; j < rowBookings.length; j++) {
        const b1 = getBookingEffectiveTimes(rowBookings[i], targetDate);
        const b2 = getBookingEffectiveTimes(rowBookings[j], targetDate);
        const b1Start = b1TimeToMinutes(b1.effectiveStart);
        const b1End = b1TimeToMinutes(b1.effectiveEnd);
        const b2Start = b1TimeToMinutes(b2.effectiveStart);
        const b2End = b1TimeToMinutes(b2.effectiveEnd);
        if (Math.max(b1Start, b2Start) < Math.min(b1End, b2End)) {
          return true;
        }
      }
    }
    return false;
  };

  const b1TimeToMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Statistics for selected date (including multi-day bookings spanning selectedDate)
  const activeBookingsForDate = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.departureDate <= selectedDate &&
        b.returnDate >= selectedDate &&
        b.status !== 'rejected' &&
        b.status !== 'cancelled'
    );
  }, [bookings, selectedDate]);

  const occupiedVehicleIds = useMemo(() => {
    return new Set(activeBookingsForDate.map((b) => b.vehicleId));
  }, [activeBookingsForDate]);

  const occupiedDriverIds = useMemo(() => {
    return new Set(activeBookingsForDate.map((b) => b.driverId));
  }, [activeBookingsForDate]);

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-5">
      
      {/* Header with Date Navigation & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-md border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Prompt'] text-slate-900">
                ผังตารางการใช้รถและสารถี (Dispatch Schedule)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบคิวการปฏิบัติงานแบบเรียลไทม์ และป้องกันการจองทับซ้อนในช่วงเวลาเดียวกัน
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('vehicle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'vehicle'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>ผังยานพาหนะ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('driver')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'driver'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ผังสารถี</span>
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500">ภารกิจในวันนี้:</span>
          <span className="text-sm font-bold text-blue-700">{activeBookingsForDate.length} รายการ</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500">รถพร้อมใช้งาน:</span>
          <span className="text-sm font-bold text-emerald-600">
            {vehicles.filter(v => v.status !== 'maintenance' && !occupiedVehicleIds.has(v.id)).length} / {vehicles.length} คัน
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500">สารถีพร้อมขับ:</span>
          <span className="text-sm font-bold text-emerald-600">
            {drivers.filter(d => d.status !== 'leave' && !occupiedDriverIds.has(d.id)).length} / {drivers.length} ท่าน
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500">ระบบตรวจจับการชน:</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> เปิดใช้งาน
          </span>
        </div>
      </div>

      {/* Schedule Timeline Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 overflow-x-auto">
        <div className="min-w-[900px] space-y-4">
          
          {/* Header Time Columns */}
          <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-3">
            <div className="col-span-3 text-left pl-2 flex items-center gap-1.5">
              {viewMode === 'vehicle' ? (
                <>
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>ยานพาหนะ / ทะเบียน</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-blue-600" />
                  <span>สารถี / ข้อมูลติดต่อ</span>
                </>
              )}
            </div>
            {timeSlots.map((time) => (
              <div key={time} className="font-mono text-[11px] text-slate-600">{time}</div>
            ))}
          </div>

          {/* ROWS: Vehicle View Mode */}
          {viewMode === 'vehicle' && vehicles.map((veh) => {
            const vehBookings = bookings.filter(
              (b) =>
                b.vehicleId === veh.id &&
                b.departureDate <= selectedDate &&
                b.returnDate >= selectedDate &&
                b.status !== 'rejected' &&
                b.status !== 'cancelled'
            );
            const drv = drivers.find((d) => d.id === veh.assignedDriverId);
            const hasCollision = checkRowHasConflict(vehBookings, selectedDate);

            return (
              <div key={veh.id} className="grid grid-cols-12 gap-2 items-center py-3 border-b border-slate-100 hover:bg-slate-50/50 rounded-xl transition-colors">
                
                {/* Vehicle Card Info */}
                <div className="col-span-3 flex items-center gap-2.5 pl-2">
                  <img
                    src={veh.image}
                    alt={veh.name}
                    className="w-12 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{veh.name.split(' ')[0]}</p>
                      {hasCollision && (
                        <span className="p-0.5 bg-rose-100 text-rose-600 rounded-full" title="ตรวจพบการจองทับซ้อน">
                          <AlertTriangle className="w-3 h-3 animate-bounce" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {veh.plateNumber.split(' ')[0]} • สารถี: {drv?.name.split(' ')[0] || 'ไม่ได้ระบุ'}
                    </p>
                    {veh.status === 'maintenance' && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">
                        🔧 ส่งซ่อมบำรุง
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline visual bar (Spans 9 columns from 08:00 to 18:00) */}
                <div className="col-span-9 relative h-11 bg-slate-100/70 rounded-xl border border-slate-200 overflow-hidden flex items-center">
                  
                  {/* Background gridlines for every hour */}
                  <div className="absolute inset-0 grid grid-cols-10 pointer-events-none divide-x divide-slate-200/60" />

                  {vehBookings.length === 0 ? (
                    <div className="relative z-10 px-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>ว่างตลอดวัน (พร้อมรับงาน)</span>
                    </div>
                  ) : (
                    vehBookings.map((b) => {
                      const { effectiveStart, effectiveEnd } = getBookingEffectiveTimes(b, selectedDate);
                      const leftPercent = getTimelinePosition(effectiveStart);
                      const rightPercent = getTimelinePosition(effectiveEnd);
                      const widthPercent = Math.max(10, rightPercent - leftPercent);
                      const statusStyle = getStatusBadge(b.status);
                      const isMultiDay = b.departureDate !== b.returnDate;

                      return (
                        <div
                          key={b.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-1 bottom-1 ${statusStyle.bg} text-white rounded-lg px-2 py-0.5 flex items-center justify-between text-[10px] font-bold shadow-xs border ${statusStyle.border} z-10 transition-all hover:brightness-110 overflow-hidden group`}
                          title={`คำขอ: ${b.id}\nผู้จอง: ${b.bookerName} (${b.department})\nช่วงเวลาเต็ม: ${b.departureDate} ${b.departureTime} ถึง ${b.returnDate} ${b.returnTime}\nวัตถุประสงค์: ${b.purpose}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <span>🚗</span>
                            <span className="truncate">{b.bookerName} ({b.department})</span>
                            {isMultiDay && <span className="bg-white/20 text-[8px] px-1 rounded">หลายวัน</span>}
                          </span>
                          <span className="font-mono text-[9px] bg-black/30 px-1 py-0.5 rounded shrink-0 ml-1">
                            {effectiveStart}-{effectiveEnd}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}

          {/* ROWS: Driver View Mode */}
          {viewMode === 'driver' && drivers.map((drv) => {
            const drvBookings = bookings.filter(
              (b) =>
                b.driverId === drv.id &&
                b.departureDate <= selectedDate &&
                b.returnDate >= selectedDate &&
                b.status !== 'rejected' &&
                b.status !== 'cancelled'
            );
            const veh = vehicles.find((v) => v.id === drv.assignedVehicleId);
            const hasCollision = checkRowHasConflict(drvBookings, selectedDate);

            return (
              <div key={drv.id} className="grid grid-cols-12 gap-2 items-center py-3 border-b border-slate-100 hover:bg-slate-50/50 rounded-xl transition-colors">
                
                {/* Driver Card Info */}
                <div className="col-span-3 flex items-center gap-2.5 pl-2">
                  <img
                    src={drv.photo}
                    alt={drv.name}
                    className="w-10 h-10 object-cover rounded-full border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{drv.name}</p>
                      {hasCollision && (
                        <span className="p-0.5 bg-rose-100 text-rose-600 rounded-full" title="ตรวจพบการมอบหมายทับซ้อน">
                          <AlertTriangle className="w-3 h-3 animate-bounce" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {drv.phone} • รถประจำ: {veh?.name.split(' ')[0] || 'ไม่ได้ระบุ'}
                    </p>
                    {drv.status === 'leave' && (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded">
                        🏖️ ลาพักงาน
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline visual bar */}
                <div className="col-span-9 relative h-11 bg-slate-100/70 rounded-xl border border-slate-200 overflow-hidden flex items-center">
                  
                  {/* Background gridlines */}
                  <div className="absolute inset-0 grid grid-cols-10 pointer-events-none divide-x divide-slate-200/60" />

                  {drvBookings.length === 0 ? (
                    <div className="relative z-10 px-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>ว่างตลอดวัน (พร้อมปฏิบัติหน้าที่)</span>
                    </div>
                  ) : (
                    drvBookings.map((b) => {
                      const { effectiveStart, effectiveEnd } = getBookingEffectiveTimes(b, selectedDate);
                      const leftPercent = getTimelinePosition(effectiveStart);
                      const rightPercent = getTimelinePosition(effectiveEnd);
                      const widthPercent = Math.max(10, rightPercent - leftPercent);
                      const statusStyle = getStatusBadge(b.status);
                      const isMultiDay = b.departureDate !== b.returnDate;

                      return (
                        <div
                          key={b.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute top-1 bottom-1 ${statusStyle.bg} text-white rounded-lg px-2 py-0.5 flex items-center justify-between text-[10px] font-bold shadow-xs border ${statusStyle.border} z-10 transition-all hover:brightness-110 overflow-hidden group`}
                          title={`คำขอ: ${b.id}\nผู้จอง: ${b.bookerName} (${b.department})\nช่วงเวลาเต็ม: ${b.departureDate} ${b.departureTime} ถึง ${b.returnDate} ${b.returnTime}\nปลายทาง: ${b.destinationLocation}`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <span>👤</span>
                            <span className="truncate">{b.bookerName}</span>
                            {isMultiDay && <span className="bg-white/20 text-[8px] px-1 rounded">หลายวัน</span>}
                          </span>
                          <span className="font-mono text-[9px] bg-black/30 px-1 py-0.5 rounded shrink-0 ml-1">
                            {effectiveStart}-{effectiveEnd}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Legend Information */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700">สัญลักษณ์สถานะ:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span>อนุมัติแล้ว</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span>กำลังเดินทาง (In Transit)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
            <span>รอการอนุมัติ (Pending)</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>ลากเมาส์ชี้บนแถบเวลาเพื่อดูรายละเอียดคำขอและเส้นทาง</span>
        </div>
      </div>

    </div>
  );
};

