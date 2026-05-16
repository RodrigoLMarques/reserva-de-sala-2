export enum ReservationStatus {
  Pending = "PENDENTE",
  Confirmed = "CONFIRMADA",
  Cancelled = "CANCELADA",
}

type SetState = (state: ReservationState) => void;

export interface ReservationState {
  confirm(setState: SetState): void;
  cancel(setState: SetState): void;
  getStatus(): ReservationStatus;
}

export class PendingState implements ReservationState {
  confirm(setState: SetState): void {
    setState(new ConfirmedState());
  }

  cancel(setState: SetState): void {
    setState(new CancelledState());
  }

  getStatus(): ReservationStatus {
    return ReservationStatus.Pending;
  }
}

export class ConfirmedState implements ReservationState {
  confirm(_setState: SetState): void {
    console.log("Reserva já está confirmada.");
  }

  cancel(setState: SetState): void {
    setState(new CancelledState());
  }

  getStatus(): ReservationStatus {
    return ReservationStatus.Confirmed;
  }
}

export class CancelledState implements ReservationState {
  confirm(_setState: SetState): void {
    console.log("Reserva cancelada não pode ser confirmada.");
  }

  cancel(_setState: SetState): void {
    console.log("Reserva já está cancelada.");
  }

  getStatus(): ReservationStatus {
    return ReservationStatus.Cancelled;
  }
}
