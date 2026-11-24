import { registerHealthModule } from './health/index.js';
import { registerProducersModule } from './producers/index.js';
import { registerAffiliatesModule } from './affiliates/index.js';
import { registerCatalogSyncModule } from './catalog-sync/index.js';
import { registerCommissionLedgerModule } from './commission-ledger/index.js';
import { registerMediaJobsModule } from './media-jobs/index.js';
import { registerOrdersWebhookModule } from './orders-webhook/index.js';

export async function registerModules(app, { env, db, authGuard, verifyTurnstile, serviceName }) {
  const prefix = env.API_PREFIX;

  await registerHealthModule(app, { prefix, serviceName, db });

  const producersApi = await registerProducersModule(app, { prefix, db, authGuard, verifyTurnstile });
  const affiliatesApi = await registerAffiliatesModule(app, { prefix, db, authGuard, producersApi });
  await registerCatalogSyncModule(app, { prefix, db, authGuard, producersApi });
  const ledgerApi = await registerCommissionLedgerModule(app, { prefix, db, authGuard, producersApi });
  await registerMediaJobsModule(app, { prefix, db, authGuard, producersApi });
  await registerOrdersWebhookModule(app, { prefix, db, authGuard, producersApi, affiliatesApi, ledgerApi });
}
