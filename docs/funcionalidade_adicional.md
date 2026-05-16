# Funcionalidade Adicional: Ciclo de Vida de Reservas

## O que é

Reservas agora têm estados: **PENDENTE**, **CONFIRMADA** e **CANCELADA**.

Salas comuns (Estudo, Grupo) confirmam automaticamente ao criar. Salas especiais (Laboratório, Prova) ficam pendentes até um professor aprovar ou rejeitar pelo menu 8.

Só reservas **CONFIRMADAS** bloqueiam outros horários.

## Padrão: State

Cada estado é uma classe (`PendingState`, `ConfirmedState`, `CancelledState`) que implementa `confirm()` e `cancel()`. A `Reservation` delega para o estado atual — sem `if/switch` espalhado no código.

```typescript
const r = new Reservation(start, end, user, roomId); // PENDENTE
r.confirm(); // CONFIRMADA
r.cancel();  // CANCELADA
r.confirm(); // "Reserva cancelada não pode ser confirmada."
```

## Como testar

1. `npm start` - entrar como João (aluno)
2. Criar reserva na **Sala 101** - confirma automaticamente
3. Criar reserva na **Sala 301** (lab) - fica pendente
4. Trocar para Prof. Silva - menu **8. Gerenciar reservas pendentes**: aprovar ou rejeitar
