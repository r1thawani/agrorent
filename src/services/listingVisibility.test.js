import { beforeEach, describe, expect, it, vi } from "vitest";

// A listing an owner deletes after it has bookings is archived (deleted_at is
// set) rather than removed, so past bookings still show its name. Every query
// that feeds a page of listings, or a count of them, must therefore leave
// archived rows out. These tests record the queries the services send.
const { log, builder } = vi.hoisted(() => {
  const log = [];
  const builder = (table) => {
    const entry = { table, calls: [] };
    log.push(entry);
    const proxy = new Proxy({}, {
      get(_, prop) {
        if (prop === "then") return (resolve) => resolve({ data: [], count: 0, error: null });
        return (...args) => {
          entry.calls.push([prop, ...args]);
          return proxy;
        };
      },
    });
    return proxy;
  };
  return { log, builder };
});

vi.mock("../lib/supabaseClient", () => ({ supabase: { from: builder, rpc: vi.fn() } }));

import { adminService } from "./adminService";
import { equipmentService } from "./equipmentService";

const hidesArchived = (entry) => entry.calls.some(([m, col, val]) => m === "is" && col === "deleted_at" && val === null);
const equipmentQueries = () => log.filter((q) => q.table === "equipment");

describe("archived listings stay hidden", () => {
  beforeEach(() => {
    log.length = 0;
  });

  it("the admin listings page does not show them", async () => {
    await adminService.getAllListings();
    expect(equipmentQueries()).toHaveLength(1);
    expect(hidesArchived(equipmentQueries()[0])).toBe(true);
  });

  it("the admin dashboard does not count them", async () => {
    await adminService.getStats();
    expect(equipmentQueries()).toHaveLength(1);
    expect(hidesArchived(equipmentQueries()[0])).toBe(true);
  });

  it("opening one by its link does not work", async () => {
    await equipmentService.getById("some-id").catch(() => {});
    expect(equipmentQueries()).toHaveLength(1);
    expect(hidesArchived(equipmentQueries()[0])).toBe(true);
  });

  it("the public lists and an owner's own list already leave them out", async () => {
    await equipmentService.getAll();
    await equipmentService.getMine("owner-id");
    expect(equipmentQueries()).toHaveLength(2);
    expect(equipmentQueries().every(hidesArchived)).toBe(true);
  });
});
