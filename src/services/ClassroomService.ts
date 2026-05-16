import { randomUUID } from "crypto";
import { Classroom } from "../models/Classroom";
import { ClassroomRepository } from "../repositories/ClassroomRepository";
import {
  FirstReservationPolitics,
  ReservationPolitics,
} from "../models/ReservationPolitics";
import { Reservation } from "../models/Reservation";
import { ReservationStatus } from "../models/ReservationState";
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

    if (!isAllowed) {
      console.log(`Reserva negada pela política: ${this.currentPolitic.id}`);
      return false;
    }

    classroom.addReservation(reservation);

    if (!classroom.requiresApproval()) {
      reservation.confirm();
      classroom.notifyAll(`Nova reserva confirmada na sala ${classroom.getNumber()}`);
    } else {
      classroom.notifyAll(`Nova reserva aguardando aprovação na sala ${classroom.getNumber()}`);
    }

    return true;
  }

  cancelReservation(reservationId: string): boolean {
    const found = this.repository.findReservation(reservationId);
    if (!found) return false;

    const { classroom, reservation } = found;
    reservation.cancel();
    classroom.removeReservation(reservationId);
    classroom.notifyAll(`Reserva cancelada na sala ${classroom.getNumber()}`);
    return true;
  }

  approveReservation(reservationId: string): boolean {
    const found = this.repository.findReservation(reservationId);
    if (!found) return false;

    const { classroom, reservation } = found;

    if (reservation.getStatus() !== ReservationStatus.Pending) {
      console.log("Apenas reservas pendentes podem ser aprovadas.");
      return false;
    }

    const others = classroom.getReservations().filter((r) => r.getId() !== reservationId);
    const hasConflict = others.some((r) => r.overlaps(reservation.startDate, reservation.endDate));
    if (hasConflict) {
      console.log("Conflito com reserva já confirmada. Aprovação negada.");
      return false;
    }

    reservation.confirm();
    classroom.notifyAll(`Reserva aprovada na sala ${classroom.getNumber()}`);
    return true;
  }

  rejectReservation(reservationId: string): boolean {
    const found = this.repository.findReservation(reservationId);
    if (!found) return false;

    const { classroom, reservation } = found;

    if (reservation.getStatus() !== ReservationStatus.Pending) {
      console.log("Apenas reservas pendentes podem ser rejeitadas.");
      return false;
    }

    reservation.cancel();
    classroom.removeReservation(reservationId);
    classroom.notifyAll(`Reserva rejeitada na sala ${classroom.getNumber()}`);
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
