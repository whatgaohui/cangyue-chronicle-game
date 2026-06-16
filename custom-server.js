const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`> Server listening on http://0.0.0.0:${port}`);
  });
  
  server.timeout = 60000;
  server.keepAliveTimeout = 60000;
});
