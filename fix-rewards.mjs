import postgres from "postgres";

const sql = postgres("postgresql://neondb_owner:npg_CB3vKXLNAa1n@ep-winter-wind-atl2qeo6.us-east-1.aws.neon.tech/neondb?sslmode=require");

const result = await sql`
  UPDATE purchases 
  SET "rewardPointsExpected" = FLOOR("purchasePrice" / "pointsMultiple") * "pointsPerMultiple"
  WHERE "purchasePrice" > 0 AND "pointsMultiple" > 0 AND "pointsPerMultiple" > 0
  RETURNING id, brand, "purchasePrice", "pointsMultiple", "pointsPerMultiple", "rewardPointsExpected"
`;

console.log("[v0] Updated", result.length, "purchases in dev database");
result.slice(0, 3).forEach(r => {
  console.log(`  ${r.brand}: ₹${r.purchasePrice} ÷ ${r.pointsMultiple} × ${r.pointsPerMultiple} = ${r.rewardPointsExpected} pts`);
});

await sql.end();
