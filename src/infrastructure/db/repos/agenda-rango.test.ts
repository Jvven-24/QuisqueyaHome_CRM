import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {PgDialect,pgTable,timestamp} from "drizzle-orm/pg-core";
import {solapamientoAgenda} from "./agenda-rango.ts";
test("SQL de agenda incluye multidiarias activas, excluye fin exacto y trata sin fin",()=>{
 const events=pgTable("events",{startsAt:timestamp("starts_at",{withTimezone:true}),endsAt:timestamp("ends_at",{withTimezone:true})});
 const query=new PgDialect().sqlToQuery(solapamientoAgenda(events,new Date("2026-10-19T04:00:00Z"),new Date("2026-10-20T04:00:00Z"))!);
 const db=new DatabaseSync(":memory:");
 try {
 db.exec("CREATE TABLE events(id INTEGER PRIMARY KEY,starts_at TEXT,ends_at TEXT)");
 const insert=db.prepare("INSERT INTO events VALUES(?,?,?)");
 const rows=[
 [1,"2026-10-18T10:00:00.000Z","2026-10-19T05:00:00.000Z"],
 [2,"2026-10-18T10:00:00.000Z","2026-10-19T04:00:00.000Z"],
 [3,"2026-10-19T04:00:00.000Z",null],
 [4,"2026-10-18T10:00:00.000Z",null],
 [5,"2026-10-20T04:00:00.000Z","2026-10-20T05:00:00.000Z"],
 [6,"2026-10-19T10:00:00.000Z","2026-10-21T05:00:00.000Z"],
 ] as const;
 for(const row of rows)insert.run(...row);
 const statement=db.prepare("SELECT id FROM events WHERE "+query.sql.replace(/\$\d+/g,"?")+" ORDER BY id");
 const params=query.params.map(value=>String(value));
 assert.deepEqual(statement.all(...params).map(row=>row.id),[1,3,6]);
 } finally {db.close();}
});
