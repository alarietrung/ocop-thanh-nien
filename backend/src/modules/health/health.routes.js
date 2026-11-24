export async function registerHealthRoutes(app, { controller }) {
  app.get('/health', controller.getHealth);
  app.get('/ready', controller.getReady);
}
