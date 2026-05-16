import { randomUUID } from "crypto";
import * as readline from "readline";
import { Classroom } from "../models/Classroom";
import { Reservation } from "../models/Reservation";
import {
  FirstReservationPolitics,
  TeacherReservationPolitics,
} from "../models/ReservationPolitics";
import { User } from "../models/User";
import { ClassroomService } from "../services/ClassroomService";
import { ReservationServiceProxy } from "../services/ReservationServiceProxy";
import { ReportService } from "../services/ReportService";

export class ReservationCLI {
  private service = new ReservationServiceProxy(new ClassroomService());
  private reportService = new ReportService();
  private rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  private lineBuffer: string[] = [];
  private lineWaiters: ((line: string) => void)[] = [];
  private currentUser: User | null = null;

  constructor(
    private rooms: Classroom[],
    private users: User[],
  ) {
    this.rl.on("line", (line) =>
      this.lineWaiters.length > 0
        ? this.lineWaiters.shift()!(line)
        : this.lineBuffer.push(line),
    );
  }

  private ask(q: string): Promise<string> {
    process.stdout.write(q);
    return new Promise((res) =>
      this.lineBuffer.length > 0
        ? res(this.lineBuffer.shift()!)
        : this.lineWaiters.push(res),
    );
  }

  private parseDate(s: string): Date | null {
    const d = new Date(s.trim());
    return isNaN(d.getTime()) ? null : d;
  }

  private fmt(d: Date): string {
    return d.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  private async selecionarUsuario() {
    console.log("Escolha o usuário ativo:");
    this.users.forEach((u, i) => console.log(`  ${i + 1}. ${u.name} (${u.role})`));

    const id = parseInt(await this.ask("Usuário: ")) - 1;
    if (isNaN(id) || id < 0 || id >= this.users.length) {
      console.log("Inválido.");
      return false;
    }

    this.currentUser = this.users[id];
    this.service.setCurrentUser(this.currentUser);
    console.log(`Usuário ativo: ${this.currentUser.name} (${this.currentUser.role})`);
    return true;
  }

  private async listarDisponiveis() {
    const start = this.parseDate(await this.ask("Início (YYYY-MM-DDTHH:mm): "));
    const end = this.parseDate(await this.ask("Fim (YYYY-MM-DDTHH:mm): "));
    if (!start || !end || end <= start) {
      console.log("Data inválida.");
      return;
    }
    const available = this.service.listAvailable(start, end);
    if (available.length === 0) {
      console.log("Nenhuma sala disponível.");
      return;
    }
    available.forEach((r) =>
      console.log(`  Sala ${r.getNumber()} — ${r.getType()}`),
    );
  }

  private async criarReserva() {
    if (!this.currentUser) {
      console.log("Selecione um usuário antes de criar reservas.");
      return;
    }

    this.rooms.forEach((r, i) =>
      console.log(`  ${i + 1}. Sala ${r.getNumber()} — ${r.getType()}`),
    );
    const roomdId = parseInt(await this.ask("Sala: ")) - 1;
    if (isNaN(roomdId) || roomdId < 0 || roomdId >= this.rooms.length) {
      console.log("Inválido.");
      return;
    }

    const start = this.parseDate(await this.ask("Início (YYYY-MM-DDTHH:mm): "));
    const end = this.parseDate(await this.ask("Fim (YYYY-MM-DDTHH:mm): "));
    if (!start || !end || end <= start) {
      console.log("Data inválida.");
      return;
    }

    const reservation = new Reservation(
      start,
      end,
      this.currentUser,
      this.rooms[roomdId].getId(),
    );
    console.log(
      this.service.createReservation(reservation)
        ? "Reserva criada."
        : "Reserva negada.",
    );
  }

  private async modificarReserva() {
    const all = this.service.listAllReservations();
    if (all.length === 0) {
      console.log("Nenhuma reserva.");
      return;
    }
    all.forEach(({ classroom, reservation }, i) =>
      console.log(
        `  ${i + 1}. Sala ${classroom.getNumber()} — ${reservation.holder.name} — ${this.fmt(reservation.startDate)} até ${this.fmt(reservation.endDate)}`,
      ),
    );
    const id = parseInt(await this.ask("Reserva: ")) - 1;
    if (isNaN(id) || id < 0 || id >= all.length) {
      console.log("Inválido.");
      return;
    }

    const start = this.parseDate(
      await this.ask("Novo início (YYYY-MM-DDTHH:mm): "),
    );
    const end = this.parseDate(await this.ask("Novo fim (YYYY-MM-DDTHH:mm): "));
    if (!start || !end || end <= start) {
      console.log("Data inválida.");
      return;
    }

    console.log(
      this.service.updateReservation(all[id].reservation.getId(), start, end)
        ? "Reserva atualizada."
        : "Atualização negada.",
    );
  }

  private async cancelarReserva() {
    const all = this.service.listAllReservations();
    if (all.length === 0) {
      console.log("Nenhuma reserva.");
      return;
    }
    all.forEach(({ classroom, reservation }, i) =>
      console.log(
        `  ${i + 1}. Sala ${classroom.getNumber()} — ${reservation.holder.name} — ${this.fmt(reservation.startDate)} até ${this.fmt(reservation.endDate)}`,
      ),
    );
    const id = parseInt(await this.ask("Reserva: ")) - 1;
    if (isNaN(id) || id < 0 || id >= all.length) {
      console.log("Inválido.");
      return;
    }

    console.log(
      this.service.cancelReservation(all[id].reservation.getId())
        ? "Reserva cancelada."
        : "Não encontrada.",
    );
  }

  private async verNotificacoes() {
    this.users.forEach((u, i) => console.log(`  ${i + 1}. ${u.name}`));
    const id = parseInt(await this.ask("Usuário: ")) - 1;
    if (isNaN(id) || id < 0 || id >= this.users.length) {
      console.log("Inválido.");
      return;
    }
    const notifs = this.users[id].getNotifications();
    if (notifs.length === 0) {
      console.log("Sem notificações.");
      return;
    }
    notifs.forEach((n) => console.log(`  ${n.message}`));
  }

  private async relatorioDiario() {
    const input = await this.ask("Data (YYYY-MM-DD): ");
    const date = this.parseDate(input.trim() + "T00:00");
    if (!date) {
      console.log("Data inválida.");
      return;
    }
    this.reportService.dailyReport(date);
  }

  private async trocarPolitica() {
    console.log("  1. Primeiro a reservar");
    console.log("  2. Prioridade para professor");
    const opt = (await this.ask("Política: ")).trim();
    if (opt === "1") {
      this.service.setPolitics(new FirstReservationPolitics(randomUUID()));
      console.log("Política atualizada.");
    } else if (opt === "2") {
      this.service.setPolitics(new TeacherReservationPolitics(randomUUID()));
      console.log("Política atualizada.");
    } else console.log("Inválido.");
  }

  async run() {
    console.log("Reserva de Salas");

    const selected = await this.selecionarUsuario();
    if (!selected) {
      this.rl.close();
      return;
    }

    while (true) {
      console.log(`\nUsuário ativo: ${this.currentUser?.name} (${this.currentUser?.role})`);
      console.log("\n1. Listar salas disponíveis");
      console.log("2. Criar reserva");
      console.log("3. Modificar reserva");
      console.log("4. Cancelar reserva");
      console.log("5. Ver notificações");
      console.log("6. Relatório diário");
      console.log("7. Trocar política de reserva");
      console.log("0. Sair");

      const opt = (await this.ask("\nOpção: ")).trim();
      console.log();

      if (opt === "0") break;
      else if (opt === "1") await this.listarDisponiveis();
      else if (opt === "2") await this.criarReserva();
      else if (opt === "3") await this.modificarReserva();
      else if (opt === "4") await this.cancelarReserva();
      else if (opt === "5") await this.verNotificacoes();
      else if (opt === "6") await this.relatorioDiario();
      else if (opt === "7") await this.trocarPolitica();
      else console.log("Opção inválida.");
    }

    this.rl.close();
  }
}
