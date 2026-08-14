import { BookingRequest, Vehicle, Driver } from '../types';

export interface BookingTimeRange {
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  vehicleConflict?: {
    vehicle: Vehicle;
    conflictingBooking?: BookingRequest;
    reason: 'booked' | 'maintenance';
  };
  driverConflict?: {
    driver: Driver;
    conflictingBooking?: BookingRequest;
    reason: 'booked' | 'leave';
  };
  details: string[];
}

/**
 * Parses date + time string to a Date object safely.
 */
export function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Checks if two date-time ranges overlap: [startA, endA] and [startB, endB]
 * Overlap formula: startA < endB && endA > startB
 */
export function isTimeOverlapping(
  rangeA: BookingTimeRange,
  rangeB: BookingTimeRange
): boolean {
  try {
    const startA = parseDateTime(rangeA.departureDate, rangeA.departureTime).getTime();
    const endA = parseDateTime(rangeA.returnDate, rangeA.returnTime).getTime();
    const startB = parseDateTime(rangeB.departureDate, rangeB.departureTime).getTime();
    const endB = parseDateTime(rangeB.returnDate, rangeB.returnTime).getTime();

    if (isNaN(startA) || isNaN(endA) || isNaN(startB) || isNaN(endB)) return false;
    return startA < endB && endA > startB;
  } catch {
    return false;
  }
}

/**
 * Checks whether a booking is considered actively taking up vehicle/driver slots
 */
export function isBookingActive(status: string): boolean {
  return status === 'pending' || status === 'approved' || status === 'in_transit';
}

/**
 * Checks if a specific vehicle is available during the given time range
 */
export function isVehicleAvailable(
  vehicleId: string,
  range: BookingTimeRange,
  bookings: BookingRequest[],
  excludeBookingId?: string
): { available: boolean; conflictBooking?: BookingRequest; reason?: 'booked' | 'maintenance' } {
  const activeBookings = bookings.filter(
    (b) =>
      b.vehicleId === vehicleId &&
      isBookingActive(b.status) &&
      b.id !== excludeBookingId
  );

  for (const b of activeBookings) {
    if (isTimeOverlapping(range, b)) {
      return { available: false, conflictBooking: b, reason: 'booked' };
    }
  }

  return { available: true };
}

/**
 * Checks if a specific driver is available during the given time range
 */
export function isDriverAvailable(
  driverId: string,
  range: BookingTimeRange,
  bookings: BookingRequest[],
  excludeBookingId?: string
): { available: boolean; conflictBooking?: BookingRequest; reason?: 'booked' | 'leave' } {
  const activeBookings = bookings.filter(
    (b) =>
      b.driverId === driverId &&
      isBookingActive(b.status) &&
      b.id !== excludeBookingId
  );

  for (const b of activeBookings) {
    if (isTimeOverlapping(range, b)) {
      return { available: false, conflictBooking: b, reason: 'booked' };
    }
  }

  return { available: true };
}

/**
 * Full check for requested vehicle, driver, and time range
 */
export function checkBookingConflict(
  vehicleId: string,
  driverId: string,
  range: BookingTimeRange,
  vehicles: Vehicle[],
  drivers: Driver[],
  bookings: BookingRequest[],
  excludeBookingId?: string
): ConflictCheckResult {
  const details: string[] = [];
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  let vehicleConflict: ConflictCheckResult['vehicleConflict'] = undefined;
  let driverConflict: ConflictCheckResult['driverConflict'] = undefined;

  // 1. Check vehicle maintenance status
  if (selectedVehicle && selectedVehicle.status === 'maintenance') {
    vehicleConflict = {
      vehicle: selectedVehicle,
      reason: 'maintenance',
    };
    details.push(`ยานพาหนะ "${selectedVehicle.name}" อยู่ระหว่างส่งซ่อมบำรุงรักษา ไม่สามารถให้บริการได้`);
  } else if (selectedVehicle) {
    // Check vehicle bookings collision
    const vehCheck = isVehicleAvailable(vehicleId, range, bookings, excludeBookingId);
    if (!vehCheck.available && vehCheck.conflictBooking) {
      const b = vehCheck.conflictBooking;
      vehicleConflict = {
        vehicle: selectedVehicle,
        conflictingBooking: b,
        reason: 'booked',
      };
      details.push(
        `รถยนต์ "${selectedVehicle.name} (${selectedVehicle.plateNumber})" ติดคิวจองแล้ว [${b.departureDate} ${b.departureTime} - ${b.returnDate} ${b.returnTime}] โดย ${b.bookerName} (${b.department})`
      );
    }
  }

  // 2. Check driver leave status
  if (selectedDriver && selectedDriver.status === 'leave') {
    driverConflict = {
      driver: selectedDriver,
      reason: 'leave',
    };
    details.push(`สารถี "${selectedDriver.name}" อยู่ระหว่างลาพักงาน/หยุดกะ`);
  } else if (selectedDriver) {
    // Check driver bookings collision
    const drvCheck = isDriverAvailable(driverId, range, bookings, excludeBookingId);
    if (!drvCheck.available && drvCheck.conflictBooking) {
      const b = drvCheck.conflictBooking;
      driverConflict = {
        driver: selectedDriver,
        conflictingBooking: b,
        reason: 'booked',
      };
      details.push(
        `สารถี "${selectedDriver.name}" ติดภารกิจขับรถคันอื่นแล้ว [${b.departureDate} ${b.departureTime} - ${b.returnDate} ${b.returnTime}] โดย ${b.bookerName}`
      );
    }
  }

  return {
    hasConflict: Boolean(vehicleConflict || driverConflict),
    vehicleConflict,
    driverConflict,
    details,
  };
}

/**
 * Format Thai date representation (e.g. "วันเสาร์ 15 ส.ค. 2569")
 */
export function formatThaiDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${dayNames[date.getDay()]}ที่ ${d} ${monthNames[m - 1]}`;
  } catch {
    return dateStr;
  }
}

/**
 * Find the most relevant active booking for a vehicle
 */
export function getVehicleActiveBooking(
  vehicleId: string,
  bookings: BookingRequest[]
): BookingRequest | undefined {
  return bookings.find(
    (b) => b.vehicleId === vehicleId && isBookingActive(b.status)
  );
}

/**
 * Find the most relevant active booking for a driver
 */
export function getDriverActiveBooking(
  driverId: string,
  bookings: BookingRequest[]
): BookingRequest | undefined {
  return bookings.find(
    (b) => b.driverId === driverId && isBookingActive(b.status)
  );
}

/**
 * Dynamically computes real-time status of a vehicle from bookings
 */
export function getVehicleLiveStatus(
  vehicle: Vehicle,
  bookings: BookingRequest[]
): {
  status: 'available' | 'in_use' | 'maintenance';
  statusLabel: string;
  badgeClass: string;
  detail?: string;
  activeBooking?: BookingRequest;
} {
  if (vehicle.status === 'maintenance') {
    return {
      status: 'maintenance',
      statusLabel: 'ส่งซ่อมบำรุง',
      badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
      detail: 'อยู่ระหว่างส่งซ่อมบำรุงรักษา',
    };
  }

  const activeBooking = getVehicleActiveBooking(vehicle.id, bookings);
  if (activeBooking) {
    const thaiEnd = formatThaiDate(activeBooking.returnDate);
    const detail = `ติดงานถึง${thaiEnd} (${activeBooking.returnTime} น.) โดย ${activeBooking.bookerName}`;
    return {
      status: 'in_use',
      statusLabel: 'ติดงาน',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      detail,
      activeBooking,
    };
  }

  return {
    status: 'available',
    statusLabel: 'พร้อมใช้งาน',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    detail: 'พร้อมปฏิบัติงาน/สแตนด์บาย',
  };
}

/**
 * Dynamically computes real-time status of a driver from bookings
 */
export function getDriverLiveStatus(
  driver: Driver,
  bookings: BookingRequest[]
): {
  status: 'ready' | 'on_duty' | 'leave';
  statusLabel: string;
  badgeClass: string;
  detail?: string;
  activeBooking?: BookingRequest;
} {
  if (driver.status === 'leave') {
    return {
      status: 'leave',
      statusLabel: 'ลาพักงาน',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      detail: 'อยู่ระหว่างลาพักงาน/หยุดกะ',
    };
  }

  const activeBooking = getDriverActiveBooking(driver.id, bookings);
  if (activeBooking) {
    const thaiEnd = formatThaiDate(activeBooking.returnDate);
    const detail = `ติดภารกิจขับรถถึง${thaiEnd} (${activeBooking.returnTime} น.)`;
    return {
      status: 'on_duty',
      statusLabel: 'ติดงาน / กำลังปฏิบัติงาน',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      detail,
      activeBooking,
    };
  }

  return {
    status: 'ready',
    statusLabel: 'พร้อมปฏิบัติงาน',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    detail: 'พร้อมรับภารกิจใหม่',
  };
}

