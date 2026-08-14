import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Car, 
  Fuel, 
  MapPin, 
  Users, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles,
  Building2,
  Check,
  ChevronDown,
  Layers
} from 'lucide-react';
import { BookingRequest, Vehicle, Driver, BookingApprovalStatus } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { exportCarUsageReportToExcel, exportBookingListToCsv } from '../utils/excelExport';

interface ReportsTabProps {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  drivers?: Driver[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  bookings,
  vehicles,
  drivers = [],
}) => {
  // Filter States
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Filtered Bookings for the Report
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Department Filter
      if (departmentFilter !== 'all' && b.department !== departmentFilter) {
        return false;
      }
      // Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }
      // Date Range Filter
      if (startDate && b.departureDate < startDate) {
        return false;
      }
      if (endDate && b.departureDate > endDate) {
        return false;
      }
      // Keyword Search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matches = 
          b.bookerName.toLowerCase().includes(kw) ||
          b.id.toLowerCase().includes(kw) ||
          b.department.toLowerCase().includes(kw) ||
          b.destinationLocation.toLowerCase().includes(kw) ||
          b.purpose.toLowerCase().includes(kw);
        if (!matches) return false;
      }
      return true;
    });
  }, [bookings, departmentFilter, statusFilter, startDate, endDate, searchKeyword]);

  // Overall KPIs
  const totalTrips = bookings.length;
  const filteredCount = filteredBookings.length;
  const approvedTrips = bookings.filter((b) => b.status === 'approved' || b.status === 'completed' || b.status === 'in_transit').length;
  const totalKm = vehicles.reduce((acc, v) => acc + (v.mileageKm || 0), 0);
  const totalPassengers = filteredBookings.reduce((sum, b) => sum + (b.passengers || 0), 0);

  // Department distribution
  const deptCount: { [key: string]: number } = {};
  DEPARTMENTS.forEach(d => { deptCount[d.name] = 0; });
  bookings.forEach((b) => {
    deptCount[b.department] = (deptCount[b.department] || 0) + 1;
  });

  // Handle Export to Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const res = exportCarUsageReportToExcel({
        bookings: filteredBookings,
        vehicles,
        drivers,
        filename: `รายงานการใช้รถ_DTP_Corporate_${dateStr}.xlsx`,
      });

      setExportFeedback(`ส่งออกไฟล์ Excel สำเร็จ (${res.totalRecords} รายการ • 4 แผ่นงาน)`);
      setTimeout(() => setExportFeedback(null), 4500);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export to CSV
  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportBookingListToCsv(filteredBookings, `รายงานการใช้รถ_${dateStr}.csv`);
    setExportFeedback(`ส่งออกไฟล์ CSV สำเร็จ (${filteredBookings.length} รายการ)`);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  // Clear all filters
  const handleResetFilters = () => {
    setDepartmentFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchKeyword('');
  };

  const getStatusBadge = (status: BookingApprovalStatus) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> รออนุมัติ</span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว</span>;
      case 'in_transit':
        return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> กำลังเดินทาง</span>;
      case 'completed':
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[11px]">เสร็จสิ้น</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> ไม่อนุมัติ</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[11px]">ยกเลิก</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-4 space-y-6">
      
      {/* Top Banner & Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-['Prompt'] text-slate-900">
              รายงานการใช้รถและสถิติยานพาหนะ (Fleet Analytics & Excel Export)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-11">
            สรุปภาพรวมการขอใช้รถ ประสิทธิภาพการเดินทาง อัตราสิ้นเปลือง และสามารถส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx) แบบสมบูรณ์
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'กำลังสร้างไฟล์ Excel...' : 'ส่งออกไฟล์ Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Toast Banner */}
      {exportFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
            บันทึกไฟล์ลงเครื่องเรียบร้อย
          </span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-blue-500" />
            คำขอใช้รถทั้งหมด
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Prompt'] mt-1">
            {totalTrips} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </h3>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            ↑ มีการจัดสรรรถ {approvedTrips} ครั้ง
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            อนุมัติ & ให้บริการแล้ว
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Prompt'] mt-1">
            {approvedTrips} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            คิดเป็น {Math.round((approvedTrips / (totalTrips || 1)) * 100)}% ของคำขอทั้งหมด
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            ผู้โดยสารรวม (ตามตัวกรอง)
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 font-['Prompt'] mt-1">
            {totalPassengers} <span className="text-xs font-normal text-slate-400">ท่าน</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            เฉลี่ย {filteredCount ? (totalPassengers / filteredCount).toFixed(1) : 0} ท่าน/เที่ยว
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            ระยะทางสะสมยานพาหนะ
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Prompt'] mt-1">
            {totalKm.toLocaleString()} <span className="text-xs font-normal text-slate-400">กม.</span>
          </h3>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            จากรถประจำการ {vehicles.length} คัน
          </span>
        </div>
      </div>

      {/* Excel Structure Info Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-md uppercase tracking-wider">
                XLSX WORKBOOK
              </span>
              <h3 className="text-sm sm:text-base font-bold font-['Prompt']">
                โครงสร้างไฟล์ Excel ที่ส่งออก (Multi-Sheet Comprehensive Report)
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              ไฟล์ Excel (.xlsx) จะสร้างชุดข้อมูลอัตโนมัติ 4 แผ่นงาน พร้อมจัดรูปแบบความกว้างคอลัมน์และคำนวณผลรวม
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ดาวน์โหลดทันที</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/80 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-0.5">📄 Sheet 1: รายการขอใช้รถ</span>
            <p className="text-[11px] text-slate-300">
              รหัสคำขอ, ผู้ขอ, หน่วยงาน, จุดรับ-ส่ง, วัตถุประสงค์, วันเวลา, รถ, สารถี, สถานะ
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="font-bold text-blue-400 block mb-0.5">🏢 Sheet 2: สรุปตามหน่วยงาน</span>
            <p className="text-[11px] text-slate-300">
              สถิติแยก 7 ฝ่าย (CPAM, CSAM, TRC, AKM, MEDIA, DHC, ADMIN) และผลรวมทั้งหมด
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="font-bold text-indigo-400 block mb-0.5">🚙 Sheet 3: รายงานยานพาหนะ</span>
            <p className="text-[11px] text-slate-300">
              ทะเบียนรถ, รุ่น, พลังงานคงเหลือ %, เลขไมล์สะสม, สถานะ และจำนวนเที่ยวที่วิ่ง
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="font-bold text-amber-400 block mb-0.5">👤 Sheet 4: รายงานสารถี</span>
            <p className="text-[11px] text-slate-300">
              รหัสสารถี, ชื่อ-นามสกุล, เบอร์โทร, คะแนนเรตติ้ง, ประสบการณ์ และจำนวนภารกิจ
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Query Toolbar */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 font-['Prompt']">
              กำหนดเงื่อนไขการส่งออกรายงาน (Filter Data for Excel)
            </h3>
          </div>
          {(departmentFilter !== 'all' || statusFilter !== 'all' || startDate || endDate || searchKeyword) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Keyword search */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">คำค้นหา:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="ชื่อผู้ขอ, รหัส, ปลายทาง..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">หน่วยงาน / ฝ่าย:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">ทุกหน่วยงาน (7 ฝ่าย)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">สถานะคำขอ:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">ทุกสถานะคำขอ</option>
              <option value="pending">⏳ รออนุมัติ (Pending)</option>
              <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
              <option value="in_transit">🚗 กำลังเดินทาง (In Transit)</option>
              <option value="completed">🏁 เสร็จสิ้น (Completed)</option>
              <option value="rejected">❌ ไม่อนุมัติ (Rejected)</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">ตั้งแต่วันที่:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">ถึงวันที่:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Department Usage Distribution Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Department Usage List */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-['Prompt'] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              สัดส่วนการขอใช้รถแยกตาม 7 หน่วยงาน
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              รวม {totalTrips} เที่ยว
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {DEPARTMENTS.map((dept) => {
              const count = deptCount[dept.name] || 0;
              const pct = Math.round((count / (totalTrips || 1)) * 100);
              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {dept.name}
                    </span>
                    <span className="text-slate-600">{count} ครั้ง ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Fleet Status Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-['Prompt'] flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              สถานะยานพาหนะและระดับพลังงานคงเหลือ
            </h3>
            <span className="text-xs text-emerald-600 font-bold">
              {vehicles.length} คันพร้อมใช้งาน
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                <div>
                  <p className="font-bold text-slate-900">{v.name} ({v.plateNumber})</p>
                  <p className="text-slate-500 text-[11px]">{v.type} • {v.fuelType}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-xs">{v.batteryOrFuel}% พลังงาน</span>
                  <p className="text-slate-400 text-[10px]">ไมล์สะสม: {v.mileageKm.toLocaleString()} กม.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Car Usage Logs Data Table (Preview of what will be exported) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold font-['Prompt'] text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              ตารางบันทึกการใช้รถ (Car Usage Log Table)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดง {filteredCount} รายการจากทั้งหมด {totalTrips} รายการ (พร้อมส่งออกสู่ Excel)
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกเฉพาะตารางนี้ ({filteredCount})</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">ไม่พบข้อมูลการใช้รถตามเงื่อนไขตัวกรอง</p>
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                ล้างตัวกรองเพื่อดูข้อมูลทั้งหมด
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">ลำดับ</th>
                  <th className="py-3 px-4">รหัสคำขอ</th>
                  <th className="py-3 px-4">ผู้ขอใช้รถ</th>
                  <th className="py-3 px-4">หน่วยงาน</th>
                  <th className="py-3 px-4">วัน-เวลาเดินทาง</th>
                  <th className="py-3 px-4">จุดรับ - ปลายทาง</th>
                  <th className="py-3 px-4">วัตถุประสงค์</th>
                  <th className="py-3 px-4">ยานพาหนะ / สารถี</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((b, idx) => {
                  const veh = vehicles.find((v) => v.id === b.vehicleId);
                  const drv = drivers.find((d) => d.id === b.driverId);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{b.bookerName}</p>
                        <p className="text-[11px] text-slate-500">{b.phone || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {b.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{b.departureDate}</p>
                        <p className="text-[11px] text-slate-500">{b.departureTime} - {b.returnTime} น.</p>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="truncate text-slate-900 font-medium" title={b.destinationLocation}>
                          {b.destinationLocation}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          จาก: {b.pickupLocation || 'สำนักงานใหญ่'}
                        </p>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <p className="truncate text-slate-600" title={b.purpose}>
                          {b.purpose}
                        </p>
                        <span className="text-[10px] text-slate-400">({b.passengers} ท่าน)</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{veh?.name.split(' ')[0] || 'รอจัดสรร'} ({veh?.plateNumber.split(' ')[0] || '-'})</p>
                        <p className="text-[11px] text-slate-500">{drv?.name || 'รอจัดสรร'}</p>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(b.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};
