import { randomUUID } from "crypto";
import { Classroom } from "../models/Classroom";
import { ClassroomRepository } from "../repositories/ClassroomRepository";
import {
  FirstReservationPolitics,
  ReservationPolitics,
} from "../models/ReservationPolitics";
import { Reservation } from "../models/Reservation";
import { ReservationEntry, ReservationService } from "./ReservationService";

export class ClassroomService implements ReservationService {
  private repository = ClassroomRepository.getInstance();
  private currentPolitic = new FirstReservationPolitics(randomUUID());

  setPolitics(politics: ReservationPolitics): void {
    this.currentPolitic = politics;
  }

  createReservation(reservation: Reservation): boolean {
    const classroom = this.repository.findById(reservation.classroomId);
    if (!classroom) return false;

    const isAllowed = this.currentPolitic.validate(
      reservation,
      classroom.getReservations(),
    );

    if (isAllowed) {
      classroom.addReservation(reservation);
      classroom.notifyAll(
        `Nova reserva confirmada na sala ${classroom.getNumber()}`,
      );
      return true;
    }

    console.log(`Reserva negada pela política: ${this.currentPolitic.id}`);
    return false;
  }

  cancelReservation(reservationId: string): boolean {
    const found = this.repository.findReservation(reservationId);
    if (!found) return false;

    const { classroom } = found;
    classroom.removeReservation(reservationId);
    classroom.notifyAll(`Reserva cancelada na sala ${classroom.getNumber()}`);
    return true;
  }

  updateReservation(reservationId: string, newStart: Date, newEnd: Date): boolean {
    const found = this.repository.findReservation(reservationId);
    if (!found) return false;

    const { classroom, reservation } = found;
    const otherReservations = classroom.getReservations().filter((r) => r.getId() !== reservationId);
    const isAllowed = this.currentPolitic.validate(
      new Reservation(newStart, newEnd, reservation.holder, classroom.getId()),
      otherReservations,
    );

    if (!isAllowed) {
      console.log(`Atualização negada pela política: ${this.currentPolitic.id}`);
      return false;
    }

    reservation.startDate = newStart;
    reservation.endDate = newEnd;
    classroom.notifyAll(`Reserva atualizada na sala ${classroom.getNumber()}`);
    return true;
  }

  listAvailable(start: Date, end: Date): Classroom[] {
    return this.repository.listAvailable(start, end);
  }

  listAllReservations(): ReservationEntry[] {
    return this.repository.getAll().flatMap((classroom) =>
      classroom.getReservations().map((r) => ({ classroom, reservation: r })),
    );
  }
}
