const http = require("http");

const req = http.request(
  {
    hostname: "localhost",
    port: 4000,
    path: "/api/v1/admin/configs/8dd172ee-1c93-4783-804d-c593cb9700da/rule-flags",
    method: "GET",
    headers: {
      // Assuming no auth is needed or we can bypass it if it's a dev server?
      // Wait, it has @Roles(UserRole.ADMIN) so it needs a valid token.
    },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => console.log("GET Response:", res.statusCode, data));
  },
);
req.end();
