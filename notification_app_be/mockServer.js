const http = require("http");

const startMockServer = () => {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/api/stream/notifications" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });

        const types = ["Event", "Result", "Placement"];
        const now = Date.now();
        const mockData = Array.from({ length: 50 }).map((_, i) => ({
          notificationId: `evt_${1000 + i}`,
          type: types[Math.floor(Math.random() * types.length)],
          title: `Campus Update: ${types[Math.floor(Math.random() * types.length)]} Info`,

          createdAt: new Date(now - Math.floor(Math.random() * 48 * 3600 * 1000)).toISOString()
        }));

        res.end(JSON.stringify({ data: mockData }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(8080, () => resolve(server));
  });
};

module.exports = { startMockServer };
