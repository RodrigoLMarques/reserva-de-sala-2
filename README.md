# Reserva de Sala

Sistema de reserva de salas via linha de comando.

## Estrutura do Projeto

O fluxo de reservas agora passa por um Proxy de proteção em `src/services/ReservationServiceProxy.ts`.
Ele controla o usuário ativo, restringe alterações de política para professores e limita a visualização de reservas para o usuário logado.

Na execução da CLI, o primeiro passo é escolher o usuário ativo.

## Como executar

**1. Instale as dependências:**

```bash
npm install
```

**2. Execute o projeto:**

```bash
npm start
```

Alunos:

- Rodrigo Lopes Marques
- Valber Marcelino Filho
