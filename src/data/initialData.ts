import { Memory, Batchmate, TourSpot, ScheduleItem, TourPackage, BusPackage, BusSeat } from '../types';

export const INITIAL_MEMORIES: Memory[] = [];

export const INITIAL_BATCHMATES: Batchmate[] = [];

export const INITIAL_TOUR_SPOTS: TourSpot[] = [];

export const INITIAL_SCHEDULE: ScheduleItem[] = [];

export function createDefaultSeatsMap(capacity: number = 45): Record<string, BusSeat> {
  const seats: Record<string, BusSeat> = {};
  
  if (capacity === 45) {
    // 10 standard rows (A to J) with 4 seats each (2x2) = 40 seats
    const normalRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (const r of normalRows) {
      for (let col = 1; col <= 4; col++) {
        const seatId = `${r}${col}`;
        seats[seatId] = {
          id: seatId,
          status: 'available'
        };
      }
    }
    // Last row (Row K) has 5 seats: K1, K2, K3 (middle/aisle), K4, K5
    for (let col = 1; col <= 5; col++) {
      const seatId = `K${col}`;
      seats[seatId] = {
        id: seatId,
        status: 'available'
      };
    }
    return seats;
  }

  // Fallback for custom capacities
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const lastRowHas5 = capacity % 4 === 1;
  const numRows = lastRowHas5 ? Math.floor(capacity / 4) : Math.ceil(capacity / 4);
  let count = 0;

  for (let rIdx = 0; rIdx < numRows; rIdx++) {
    const r = rows[rIdx] || String.fromCharCode(65 + rIdx);
    const isLastRow = rIdx === numRows - 1 && lastRowHas5;
    const seatsInRow = isLastRow ? 5 : 4;

    for (let col = 1; col <= seatsInRow; col++) {
      if (count >= capacity) break;
      const seatId = `${r}${col}`;
      seats[seatId] = {
        id: seatId,
        status: 'available'
      };
      count++;
    }
  }
  return seats;
}

export function getNormalizedSeatsMap(bus: Partial<BusPackage>): Record<string, BusSeat> {
  const totalSeats = bus.totalSeats || 45;
  const defaultMap = createDefaultSeatsMap(totalSeats);

  if (!bus.seats) return defaultMap;

  let existingSeatsList: BusSeat[] = [];
  if (Array.isArray(bus.seats)) {
    existingSeatsList = bus.seats;
  } else if (typeof bus.seats === 'object' && bus.seats !== null) {
    existingSeatsList = Object.values(bus.seats);
  }

  const existingSeatsById: Record<string, BusSeat> = {};
  existingSeatsList.forEach((s) => {
    if (s && s.id && /^[A-Z]\d+$/.test(s.id)) {
      existingSeatsById[s.id] = s;
    }
  });

  if (typeof bus.seats === 'object' && !Array.isArray(bus.seats)) {
    Object.keys(bus.seats as Record<string, BusSeat>).forEach((k) => {
      if (/^[A-Z]\d+$/.test(k) && bus.seats && (bus.seats as Record<string, BusSeat>)[k]) {
        existingSeatsById[k] = (bus.seats as Record<string, BusSeat>)[k];
      }
    });
  }

  // One-time legacy migration from old 4-seat K row + L1 layout
  // ONLY run if K5 is NOT yet present and L1 is present
  if (existingSeatsById['L1'] && !existingSeatsById['K5']) {
    const oldL1 = existingSeatsById['L1'];
    const oldK3 = existingSeatsById['K3'];
    const oldK4 = existingSeatsById['K4'];

    existingSeatsById['K5'] = oldK4 ? { ...oldK4, id: 'K5' } : { id: 'K5', status: 'available' };
    existingSeatsById['K4'] = oldK3 ? { ...oldK3, id: 'K4' } : { id: 'K4', status: 'available' };
    existingSeatsById['K3'] = oldL1 ? { ...oldL1, id: 'K3' } : { id: 'K3', status: 'available' };
  }
  // Permanently ensure L1 never exists in normalized seat maps
  delete existingSeatsById['L1'];

  const finalMap: Record<string, BusSeat> = {};
  Object.keys(defaultMap).forEach((seatId) => {
    if (existingSeatsById[seatId]) {
      finalMap[seatId] = {
        ...defaultMap[seatId],
        ...existingSeatsById[seatId],
        id: seatId
      };
    } else {
      finalMap[seatId] = defaultMap[seatId];
    }
  });

  return finalMap;
}

export function sanitizeSeatsMapForFirestore(seatsMap: Record<string, BusSeat>): Record<string, any> {
  const cleanMap: Record<string, any> = {};
  Object.keys(seatsMap).forEach((seatId) => {
    if (seatId === 'L1') return; // Ensure obsolete L1 is never saved
    const seat = seatsMap[seatId];
    if (!seat || !seat.id) return;

    const cleanSeat: Record<string, any> = {
      id: seat.id,
      status: seat.status || 'available'
    };

    if (seat.status === 'booked') {
      if (seat.bookedBy) cleanSeat.bookedBy = seat.bookedBy;
      if (seat.bookedPhone) cleanSeat.bookedPhone = seat.bookedPhone;
      if (seat.bookedPhotoUrl) cleanSeat.bookedPhotoUrl = seat.bookedPhotoUrl;
      if (seat.gender) cleanSeat.gender = seat.gender;
    } else if (seat.status === 'male_only' || seat.status === 'female_only' || seat.status === 'locked') {
      if (seat.gender) cleanSeat.gender = seat.gender;
    }

    cleanMap[seatId] = cleanSeat;
  });
  return cleanMap;
}

export const INITIAL_BUSES: BusPackage[] = [
  {
    id: 'bus-1',
    name: 'Green Line Volvo - AC Luxury Coach',
    regNo: 'Dhaka Metro-Ba-14-9821',
    type: '2+2 AC Luxury Coach',
    totalSeats: 45,
    driverName: 'Md. Rafiqul Islam',
    driverPhone: '01711-223344',
    leaderName: 'Tanvir Tuhin',
    leaderPhone: '01700-112233',
    seats: createDefaultSeatsMap(45)
  },
  {
    id: 'bus-2',
    name: 'Shyamoli NR Travels - Scania AC',
    regNo: 'Dhaka Metro-Ba-15-4422',
    type: '2+2 AC Luxury Coach',
    totalSeats: 40,
    driverName: 'Kamrul Hasan',
    driverPhone: '01819-556677',
    leaderName: 'Sadia Tasnim',
    leaderPhone: '01912-334455',
    seats: createDefaultSeatsMap(40)
  }
];

export const INITIAL_TOURS: TourPackage[] = [];

