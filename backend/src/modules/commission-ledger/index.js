import { createCommissionLedgerRepository } from './commission-ledger.repository.js';
import { createCommissionLedgerService } from './commission-ledger.service.js';
import { createCommissionLedgerController } from './commission-ledger.controller.js';
import { registerCommissionLedgerRoutes } from './commission-ledger.routes.js';

export async function registerCommissionLedgerModule(app, { prefix, db, authGuard, producersApi }) {
  const repo = createCommissionLedgerRepository({ db });
  const service = createCommissionLedgerService({ repo, producersApi });
  const controller = createCommissionLedgerController(service);

  await app.register((scope) => registerCommissionLedgerRoutes(scope, { controller, authGuard }), { prefix });

  return {
    recordOrderCommission: (actor, payload) => service.recordOrderCommission(actor, payload)
  };
}
