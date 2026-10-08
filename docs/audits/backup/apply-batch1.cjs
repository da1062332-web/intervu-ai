// Batch 1 (approved 2026-10-08): deactivate 41 fixtures + 127 untrustworthy-key MANUAL templates,
// archive ACTIVE questions whose template is inactive or soft-deleted.
// Backup first; per-row updatedAt guard; single transaction; no deletes; history tables untouched.
const path = require("path");
const fs = require("fs");
const ROOT = "C:/Users/Bhush/Desktop/intervu-ai";
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env") });
const { PrismaClient } = require(path.join(ROOT, "node_modules/@prisma/client"));
const p = new PrismaClient();
const DRY = process.argv.includes("--dry");
const ids = require("./pull_ids.json");
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "snapshot.json"), "utf8"));
const snapUpdated = Object.fromEntries(snap.templates.map((t) => [t.id, new Date(t.updatedAt).getTime()]));

(async () => {
  const tpl = await p.$queryRawUnsafe(`SELECT row_to_json(t) j, (extract(epoch from t."updatedAt")*1000)::bigint AS ms FROM "Template" t WHERE id = ANY($1)`, ids);
  const leakedQ = await p.$queryRawUnsafe(
    `SELECT row_to_json(q) j FROM questions q WHERE q.status='ACTIVE' AND (q.template_id = ANY($1) OR q.template_id IN (SELECT id FROM "Template" WHERE "isActive"=false OR "deletedAt" IS NOT NULL))`, ids);
  const stale = tpl.filter((r) => Math.abs(Number(r.ms) - snapUpdated[r.j.id]) > 1).map((r) => r.j.templateKey);
  const okIds = tpl.filter((r) => !stale.includes(r.j.templateKey)).map((r) => r.j.id);
  console.log(`templates found=${tpl.length}/${ids.length} changed-since-snapshot(skipped)=${stale.length} to-deactivate=${okIds.length} questions-to-archive(min)=${leakedQ.length}`);
  if (stale.length) console.log("SKIPPED (modified since snapshot):", stale);
  if (DRY) return;

  const dir = path.join(ROOT, "docs/audits/backup");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "2026-10-08-batch1-before.json");
  fs.writeFileSync(file, JSON.stringify({ takenAt: new Date().toISOString(), templates: tpl.map((r) => r.j), questions: leakedQ.map((r) => r.j) }));
  console.log("backup:", file);

  const res = await p.$transaction(async (tx) => {
    const t = await tx.$executeRawUnsafe(`UPDATE "Template" SET "isActive"=false, "updatedAt"=now() WHERE id = ANY($1) AND "isActive"=true`, okIds);
    const q = await tx.$executeRawUnsafe(
      `UPDATE questions SET status='ARCHIVED', updated_at=now() WHERE status='ACTIVE' AND template_id IN (SELECT id FROM "Template" WHERE "isActive"=false OR "deletedAt" IS NOT NULL)`);
    return { templatesDeactivated: t, questionsArchived: q };
  }, { timeout: 120000 });
  console.log("APPLIED", JSON.stringify(res));
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
