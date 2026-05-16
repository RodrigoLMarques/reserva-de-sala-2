import { randomUUID } from "crypto";
import { User } from "./User";
import { PendingState, ReservationState, ReservationStatus } from "./ReservationState";

export class Reservation {
  private id: string;
  private state: ReservationState;

  constructor(
    public startDate: Date,
    public endDate: Date,
    public holder: User,
    public classroomId: string,
  ) {
    this.id = randomUUID();
    this.state = new PendingState();
  }

  confirm(): void {
    this.state.confirm((next) => { this.state = next; });
  }

  cancel(): void {
    this.state.cancel((next) => { this.state = next; });
  }

  getStatus(): ReservationStatus {
    return this.state.getStatus();
  }

  getId(): string {
    return this.id;
  }

  overlaps(start: Date, end: Date): boolean {
    if (this.state.getStatus() !== ReservationStatus.Confirmed) return false;
    return this.startDate < end && this.endDate > start;
  }
}
