// Shared by the "new booking" calendar and the "edit stay" form so
// availability is computed the same way in both places.

export type BookedRange = { from: Date; to: Date }; // `to` is the last actually-booked night (inclusive)
export type RoomWithBookings = { id: string; bookedRanges: BookedRange[] };

export function rangesOverlap(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) {
  return aFrom <= bTo && bFrom <= aTo;
}

export function isRoomFree(
  room: RoomWithBookings,
  from: Date,
  to: Date,
): boolean {
  return !room.bookedRanges.some((r) => rangesOverlap(from, to, r.from, r.to));
}
