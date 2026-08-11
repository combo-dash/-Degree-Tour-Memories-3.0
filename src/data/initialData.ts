import { Memory, Batchmate, TourSpot, ScheduleItem, TourPackage, BusPackage, BusSeat } from '../types';

export const INITIAL_MEMORIES: Memory[] = [];

export const INITIAL_BATCHMATES: Batchmate[] = [];

export const INITIAL_TOUR_SPOTS: TourSpot[] = [];

export const INITIAL_SCHEDULE: ScheduleItem[] = [];

export function createDefaultSeatsMap(capacity: number = 45): Record<string, BusSeat> {
  const seats: Record<string, BusSeat> = {};
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  let count = 0;
  for (const r of rows) {
    for (let col = 1; col <= 4; col++) {
      if (count >= capacity) break;
      const seatId = `${r}${col}`;
      seats[seatId] = {
        id: seatId,
        status: 'available'
      };
      count++;
    }
    if (count >= capacity) break;
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

