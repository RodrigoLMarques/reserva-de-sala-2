import { Classroom } from "../models/Classroom";
import { Reservation } from "../models/Reservation";
import { ReservationPolitics } from "../models/ReservationPolitics";
import { User, UserRole } from "../models/User";
import { ReservationEntry, ReservationService } from "./ReservationService";

export class ReservationServiceProxy implements ReservationService {
  private currentUser: User | null = null;

  constructor(private readonly realService: ReservationService) {}

  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  private hasActiveUser(): boolean {
    return this.currentUser !== null;
  }

  private isTeacher(): boolean {
    return this.currentUser?.role === UserRole.Teacher;
  }

  setPolitics(politics: ReservationPolitics): void {
    if (!this.hasActiveUser()) {
      console.log("Selecione um usuário antes de alterar a política.");
      return;
    }

    if (!this.isTeacher()) {
      console.log("Apenas professores podem alterar a política de reserva.");
      return;
    }

    this.realService.setPolitics(politics);
  }

  createReservation(reservation: Reservation): boolean {
    if (!this.hasActiveUser()) {
      console.log("Selecione um usuário antes de criar reservas.");
      return false;
    }

    if (reservation.holder !== this.currentUser) {
      console.log("Você só pode criar reservas em seu próprio nome.");
      return false;
    }

    return this.realService.createReservation(reservation);
  }

  cancelReservation(reservationId: string): boolean {
    if (!this.hasActiveUser()) {
      console.log("Selecione um usuário antes de cancelar reservas.");
      return false;
    }

    const found = this.realService.listAllReservations().find(
      ({ reservation }) => reservation.getId() === reservationId,
    );

    if (!found) return false;

    if (!this.isTeacher() && found.reservation.holder !== this.currentUser) {
      console.log("Você só pode cancelar suas próprias reservas.");
      return false;
    }

    return this.realService.cancelReservation(reservationId);
  }

  updateReservation(reservationId: string, newStart: Date, newEnd: Date): boolean {
    if (!this.hasActiveUser()) {
      console.log("Selecione um usuário antes de atualizar reservas.");
      return false;
    }

    const found = this.realService.listAllReservations().find(
      ({ reservation }) => reservation.getId() === reservationId,
    );

    if (!found) return false;

    if (!this.isTeacher() && found.reservation.holder !== this.currentUser) {
      console.log("Você só pode atualizar suas próprias reservas.");
      return false;
    }

    return this.realService.updateReservation(reservationId, newStart, newEnd);
  }

  listAvailable(start: Date, end: Date): Classroom[] {
    return this.realService.listAvailable(start, end);
  }

  listAllReservations(): ReservationEntry[] {
    const reservations = this.realService.listAllReservations();

    if (!this.hasActiveUser() || this.isTeacher()) {
      return reservations;
    }

    return reservations.filter(({ reservation }) => reservation.holder === this.currentUser);
  }
}