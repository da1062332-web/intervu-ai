const BASE = "http://localhost:4000/api/v1";

async function getToken() {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@intervu.ai",
      password: "Intervu123!",
    }),
  });
  const body = await r.json();
  return body.data.accessToken;
}

async function main() {
  const token = await getToken();

  // Check template list response shape
  const tplRes = await fetch(`${BASE}/templates?page=1&limit=2`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tpl = await tplRes.json();
  console.log("=== TEMPLATE LIST item[0] ===");
  console.log(JSON.stringify(tpl.data?.items?.[0], null, 2));

  // Check blueprint list response shape
  const bpRes = await fetch(`${BASE}/admin/blueprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bp = await bpRes.json();
  console.log("\n=== BLUEPRINT LIST item[0] ===");
  console.log(
    JSON.stringify(bp.data?.[0] ?? bp.data?.items?.[0] ?? bp, null, 2),
  );

  // Also try non-admin
  const bpRes2 = await fetch(`${BASE}/blueprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bp2 = await bpRes2.json();
  console.log("\n=== BLUEPRINT (non-admin) item[0] ===");
  console.log(
    JSON.stringify(bp2.data?.[0] ?? bp2.data?.items?.[0] ?? bp2.data, null, 2),
  );
}

main().catch(console.error);
