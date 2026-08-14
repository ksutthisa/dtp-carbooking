import * as XLSX from 'xlsx';
import { BookingRequest, Vehicle, Driver, BookingApprovalStatus } from '../types';
import { DEPARTMENTS } from '../data/mockData';

export interface ExcelExportOptions {
  bookings: BookingRequest[];
  vehicles: Vehicle[];
  drivers: Driver[];
  filename?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
}

const STATUS_THAI_MAP: Record<BookingApprovalStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  in_transit: 'กำลังเดินทาง',
  completed: 'เสร็จสิ้นภารกิจ',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิกคำขอ',
};

/**
 * Generates and downloads a rich multi-sheet Excel (.xlsx) file for Car Usage Reports
 */
export function exportCarUsageReportToExcel({
  bookings,
  vehicles,
  drivers,
  filename,
  startDate,
  endDate,
  department,
  status,
}: ExcelExportOptions): { success: boolean; filename: string; totalRecords: number } {
  try {
    // 1. Filter bookings if filters provided
    let filtered = [...bookings];

    if (department && department !== 'all') {
      filtered = filtered.filter((b) => b.department === department);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((b) => b.status === status);
    }
    if (startDate) {
      filtered = filtered.filter((b) => b.departureDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((b) => b.departureDate <= endDate);
    }

    // Sort by departure date descending
    filtered.sort((a, b) => {
      const dateA = `${a.departureDate} ${a.departureTime}`;
      const dateB = `${b.departureDate} ${b.departureTime}`;
      return dateB.localeCompare(dateA);
    });

    const wb = XLSX.utils.book_new();

    // ----------------------------------------------------
    // Sheet 1: รายการขอใช้รถทั้งหมด (Car Usage Log Sheet)
    // ----------------------------------------------------
    const bookingRows = filtered.map((b, index) => {
      const veh = vehicles.find((v) => v.id === b.vehicleId);
      const drv = drivers.find((d) => d.id === b.driverId);

      return {
        'ลำดับ': index + 1,
        'รหัสคำขอ': b.id,
        'วันที่ยื่นคำขอ': b.createdAt || '-',
        'ชื่อผู้ขอใช้รถ': b.bookerName,
        'ฝ่าย/หน่วยงาน': b.department,
        'เบอร์โทรผู้ขอ': b.phone || '-',
        'จำนวนผู้โดยสาร (ท่าน)': b.passengers,
        'วันที่ออกเดินทาง': b.departureDate,
        'เวลาออกเดินทาง': b.departureTime ? `${b.departureTime} น.` : '-',
        'วันที่เดินทางกลับ': b.returnDate,
        'เวลาเดินทางกลับ': b.returnTime ? `${b.returnTime} น.` : '-',
        'จุดรับ': b.pickupLocation || 'สำนักงานใหญ่',
        'จุดหมายปลายทาง': b.destinationLocation,
        'วัตถุประสงค์การใช้รถ': b.purpose,
        'รถยนต์ที่จัดสรร': veh ? veh.name : 'ยังไม่ระบุ',
        'ทะเบียนรถ': veh ? veh.plateNumber : '-',
        'ประเภทรถ': veh ? (veh.typeNameTh || veh.type) : '-',
        'สารถีผู้ขับขี่': drv ? drv.name : 'ยังไม่ระบุ',
        'เบอร์โทรสารถี': drv ? drv.phone : '-',
        'สถานะคำขอ': STATUS_THAI_MAP[b.status] || b.status,
        'ผู้อนุมัติ': b.approvedBy || '-',
        'หมายเหตุ': b.note || '-'
      };
    });

    const wsBookings = XLSX.utils.json_to_sheet(bookingRows);

    // Auto-fit column widths for Sheet 1
    wsBookings['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 16 }, // รหัสคำขอ
      { wch: 18 }, // วันที่ยื่นคำขอ
      { wch: 22 }, // ชื่อผู้ขอใช้รถ
      { wch: 14 }, // ฝ่าย/หน่วยงาน
      { wch: 15 }, // เบอร์โทร
      { wch: 18 }, // จำนวนผู้โดยสาร
      { wch: 16 }, // วันที่ออกเดินทาง
      { wch: 14 }, // เวลาออก
      { wch: 16 }, // วันที่กลับ
      { wch: 14 }, // เวลากลับ
      { wch: 25 }, // จุดรับ
      { wch: 32 }, // ปลายทาง
      { wch: 45 }, // วัตถุประสงค์
      { wch: 26 }, // รถยนต์
      { wch: 16 }, // ทะเบียน
      { wch: 15 }, // ประเภทรถ
      { wch: 22 }, // สารถี
      { wch: 16 }, // เบอร์สารถี
      { wch: 18 }, // สถานะ
      { wch: 18 }, // ผู้อนุมัติ
      { wch: 25 }, // หมายเหตุ
    ];

    XLSX.utils.book_append_sheet(wb, wsBookings, 'รายการขอใช้รถ');

    // ----------------------------------------------------
    // Sheet 2: สรุปสถิติแยกตามฝ่าย/หน่วยงาน (Department Summary)
    // ----------------------------------------------------
    const totalBookingsCount = filtered.length || 1;
    const deptRows = DEPARTMENTS.map((dept, index) => {
      const deptBookings = filtered.filter((b) => b.department === dept.code || b.department === dept.name);
      const count = deptBookings.length;
      const approvedCount = deptBookings.filter((b) => b.status === 'approved').length;
      const inTransitCount = deptBookings.filter((b) => b.status === 'in_transit').length;
      const completedCount = deptBookings.filter((b) => b.status === 'completed').length;
      const pendingCount = deptBookings.filter((b) => b.status === 'pending').length;
      const rejectedCount = deptBookings.filter((b) => b.status === 'rejected' || b.status === 'cancelled').length;
      const totalPassengers = deptBookings.reduce((sum, b) => sum + (b.passengers || 0), 0);
      const percentage = ((count / totalBookingsCount) * 100).toFixed(1);

      return {
        'ลำดับ': index + 1,
        'รหัสฝ่าย': dept.code,
        'ชื่อหน่วยงาน': dept.name,
        'จำนวนคำขอทั้งหมด (ครั้ง)': count,
        'คิดเป็นสัดส่วน (%)': `${percentage}%`,
        'จำนวนผู้โดยสารรวม (ท่าน)': totalPassengers,
        'อนุมัติแล้ว': approvedCount,
        'กำลังเดินทาง': inTransitCount,
        'เสร็จสิ้น': completedCount,
        'รออนุมัติ': pendingCount,
        'ไม่อนุมัติ/ยกเลิก': rejectedCount,
      };
    });

    // Add Grand Total row
    const grandTotalTrips = deptRows.reduce((sum, r) => sum + r['จำนวนคำขอทั้งหมด (ครั้ง)'], 0);
    const grandTotalPassengers = deptRows.reduce((sum, r) => sum + r['จำนวนผู้โดยสารรวม (ท่าน)'], 0);
    const grandApproved = deptRows.reduce((sum, r) => sum + r['อนุมัติแล้ว'], 0);
    const grandInTransit = deptRows.reduce((sum, r) => sum + r['กำลังเดินทาง'], 0);
    const grandCompleted = deptRows.reduce((sum, r) => sum + r['เสร็จสิ้น'], 0);
    const grandPending = deptRows.reduce((sum, r) => sum + r['รออนุมัติ'], 0);
    const grandRejected = deptRows.reduce((sum, r) => sum + r['ไม่อนุมัติ/ยกเลิก'], 0);

    deptRows.push({
      'ลำดับ': '',
      'รหัสฝ่าย': 'รวมทุกฝ่าย',
      'ชื่อหน่วยงาน': 'รวมทั้งหมด (Grand Total)',
      'จำนวนคำขอทั้งหมด (ครั้ง)': grandTotalTrips,
      'คิดเป็นสัดส่วน (%)': '100.0%',
      'จำนวนผู้โดยสารรวม (ท่าน)': grandTotalPassengers,
      'อนุมัติแล้ว': grandApproved,
      'กำลังเดินทาง': grandInTransit,
      'เสร็จสิ้น': grandCompleted,
      'รออนุมัติ': grandPending,
      'ไม่อนุมัติ/ยกเลิก': grandRejected,
    } as any);

    const wsDept = XLSX.utils.json_to_sheet(deptRows);
    wsDept['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 14 }, // รหัสฝ่าย
      { wch: 22 }, // ชื่อหน่วยงาน
      { wch: 24 }, // จำนวนคำขอ
      { wch: 18 }, // สัดส่วน %
      { wch: 24 }, // ผู้โดยสารรวม
      { wch: 14 }, // อนุมัติแล้ว
      { wch: 14 }, // กำลังเดินทาง
      { wch: 14 }, // เสร็จสิ้น
      { wch: 14 }, // รออนุมัติ
      { wch: 18 }, // ไม่อนุมัติ
    ];
    XLSX.utils.book_append_sheet(wb, wsDept, 'สรุปแยกตามหน่วยงาน');

    // ----------------------------------------------------
    // Sheet 3: ข้อมูลยานพาหนะและสถิติการใช้งาน (Vehicles Fleet)
    // ----------------------------------------------------
    const vehicleRows = vehicles.map((v, index) => {
      const assignedCount = filtered.filter((b) => b.vehicleId === v.id).length;
      const statusThai = v.status === 'available' ? 'พร้อมใช้งาน' : v.status === 'in_use' ? 'กำลังปฏิบัติภารกิจ' : 'ซ่อมบำรุง/ไม่พร้อมใช้';

      return {
        'ลำดับ': index + 1,
        'ทะเบียนรถ': v.plateNumber,
        'ยี่ห้อและรุ่น': v.name,
        'ประเภท': v.typeNameTh || v.type,
        'ความจุผู้โดยสาร': `${v.capacity} ที่นั่ง`,
        'ประเภทพลังงาน/เชื้อเพลิง': v.fuelType,
        'พลังงานคงเหลือ (%)': `${v.batteryOrFuel}%`,
        'เลขไมล์สะสม (กม.)': v.mileageKm.toLocaleString(),
        'สถานะปัจจุบัน': statusThai,
        'จำนวนเที่ยวที่ได้รับมอบหมาย': `${assignedCount} เที่ยว`,
      };
    });

    const wsVehicles = XLSX.utils.json_to_sheet(vehicleRows);
    wsVehicles['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 16 }, // ทะเบียน
      { wch: 28 }, // รุ่น
      { wch: 14 }, // ประเภท
      { wch: 16 }, // ที่นั่ง
      { wch: 24 }, // เชื้อเพลิง
      { wch: 18 }, // พลังงานคงเหลือ
      { wch: 18 }, // ไมล์สะสม
      { wch: 20 }, // สถานะ
      { wch: 25 }, // จำนวนเที่ยว
    ];
    XLSX.utils.book_append_sheet(wb, wsVehicles, 'รายงานยานพาหนะ');

    // ----------------------------------------------------
    // Sheet 4: ทำเนียบสารถีและการปฏิบัติภารกิจ (Drivers)
    // ----------------------------------------------------
    const driverRows = drivers.map((d, index) => {
      const assignedTrips = filtered.filter((b) => b.driverId === d.id).length;
      const statusThai = d.status === 'ready' ? 'พร้อมปฏิบัติงาน' : d.status === 'on_duty' ? 'กำลังขับขี่/ออกทริป' : 'ลาหยุด/ไม่พร้อมปฏิบัติงาน';

      return {
        'ลำดับ': index + 1,
        'รหัสสารถี': d.id,
        'ชื่อ-นามสกุล': d.name,
        'เบอร์โทรศัพท์': d.phone,
        'ใบขับขี่': d.licenseNumber || '-',
        'คะแนนประเมิน': `${d.rating} / 5.0 ⭐`,
        'เที่ยวสะสมทั้งหมด': `${d.tripsCompleted || 0} เที่ยว`,
        'สถานะการปฏิบัติงาน': d.statusText || statusThai,
        'จำนวนเที่ยวในรายงาน': `${assignedTrips} เที่ยว`,
      };
    });

    const wsDrivers = XLSX.utils.json_to_sheet(driverRows);
    wsDrivers['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 14 }, // รหัส
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 16 }, // เบอร์โทร
      { wch: 18 }, // ใบขับขี่
      { wch: 16 }, // คะแนน
      { wch: 18 }, // เที่ยวสะสม
      { wch: 22 }, // สถานะ
      { wch: 22 }, // จำนวนเที่ยว
    ];
    XLSX.utils.book_append_sheet(wb, wsDrivers, 'รายงานสารถี');

    // Generate formatted filename
    const dateStr = new Date().toISOString().slice(0, 10);
    const finalFilename = filename || `รายงานการใช้รถ_DTP_Corporate_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, finalFilename);

    return {
      success: true,
      filename: finalFilename,
      totalRecords: filtered.length,
    };
  } catch (error) {
    console.error('Error generating Excel export:', error);
    throw error;
  }
}

/**
 * Helper to export single table to CSV
 */
export function exportBookingListToCsv(bookings: BookingRequest[], filename?: string): void {
  const rows = bookings.map((b, index) => ({
    'ลำดับ': index + 1,
    'รหัสคำขอ': b.id,
    'ผู้ขอใช้รถ': b.bookerName,
    'ฝ่าย/หน่วยงาน': b.department,
    'เบอร์โทร': b.phone,
    'ผู้โดยสาร (ท่าน)': b.passengers,
    'วันออกเดินทาง': b.departureDate,
    'เวลาออก': b.departureTime,
    'วันเดินทางกลับ': b.returnDate,
    'เวลากลับ': b.returnTime,
    'จุดรับ': b.pickupLocation,
    'ปลายทาง': b.destinationLocation,
    'วัตถุประสงค์': b.purpose,
    'สถานะ': STATUS_THAI_MAP[b.status] || b.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  
  // Add UTF-8 BOM so Excel opens Thai characters cleanly
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `รายการคำขอใช้รถ_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
