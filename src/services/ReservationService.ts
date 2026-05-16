import { Classroom } from "../models/Classroom";
import { Reservation } from "../models/Reservation";
import { ReservationPolitics } from "../models/ReservationPolitics";

export type ReservationEntry = {
  classroom: Classroom;
  reservation: Reservation;
};

export interface ReservationService {
  setPolitics(politics: ReservationPolitics): void;

  createReservation(reservation: Reservation): boolean;

  cancelReservation(reservationId: string): boolean;

  updateReservation(reservationId: string, newStart: Date, newEnd: Date): boolean;

  listAvailable(start: Date, end: Date): Classroom[];

  listAllReservations(): ReservationEntry[];
}