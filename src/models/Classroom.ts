import { randomUUID } from "crypto";
import { Reservation } from "./Reservation";
import { User } from "./User";
import { Notification } from "./Notification";

export abstract class Classroom {
  private id: string;
  private reservations: Reservation[] = [];
  private interested: User[] = [];

  constructor(public number: number) {
    this.id = randomUUID();
  }

  abstract getType(): string;

  abstract requiresApproval(): boolean;

  getId(): string {
    return this.id;
  }

  getNumber(): number {
    return this.number;
  }

  getReservations(): Reservation[] {
    return this.reservations;
  }

  addReservation(reservation: Reservation): void {
    this.reservations.push(reservation);
  }

  removeReservation(reservationId: string): void {
    this.reservations = this.reservations.filter((r) => r.getId() !== reservationId);
  }

  attach(user: User): void {
    if (!this.interested.includes(user)) this.interested.push(user);
  }

  remove(user: User): void {
    this.interested = this.interested.filter((u) => u !== user);
  }

  notifyAll(message: string) {
    this.interested.forEach((u) => u.notify(this, message));
  }
}

export class StudyClassroom extends Classroom {
  constructor(number: number) {
    super(number);
  }
  getType(): string {
    return "Estudo Individual";
  }
  requiresApproval(): boolean {
    return false;
  }
}

export class ExamClassroom extends Classroom {
  constructor(number: number) {
    super(number);
  }
  getType(): string {
    return "Prova";
  }
  requiresApproval(): boolean {
    return true;
  }
}

export class GroupStudyClassroom extends Classroom {
  constructor(number: number) {
    super(number);
  }
  getType(): string {
    return "Trabalho em Grupo";
  }
  requiresApproval(): boolean {
    return false;
  }
}

export class LaboratoryClassroom extends Classroom {
  constructor(number: number) {
    super(number);
  }
  getType(): string {
    return "Laboratório";
  }
  requiresApproval(): boolean {
    return true;
  }
}
