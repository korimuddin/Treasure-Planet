"use client";

import { useMemo, useState } from "react";
import type { AuditLog, Deal, Listing, Profile, SarFlag } from "@/types/database";

type Tab = "LISTINGS" | "USERS" | "DEALS" | "SAR FLAGS" | "AUDIT LOG";
const tabs: Tab[] = ["LISTINGS", "USERS", "DEALS", "SAR FLAGS", "AUDIT LOG"];

export function AdminPanelClient({
  listings,
  users,
  deals,
  flags,
  auditLog,
}: {
  listings: Listing[];
  users: Profile[];
  deals: Deal[];
  flags: SarFlag[];
  auditLog: AuditLog[];
}) {
  const [tab, setTab] = useState<Tab>("LISTINGS");
  const [query, setQuery] = useState("");

  const filteredAudit = useMemo(
    () =>
      auditLog.filter((entry) =>
        `${entry.action} ${entry.entity_type} ${entry.user_id ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [auditLog, query],
  );

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="border border-border bg-[rgba(7,15,26,0.88)] p-4">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-gold">Admin</p>
          <nav className="grid gap-2">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                className={`border px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.14em] ${
                  tab === item ? "border-gold bg-gold-dim text-gold" : "border-border text-muted"
                }`}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 border border-border bg-[rgba(7,15,26,0.88)] p-5">
          <h1 className="mb-5 font-display text-display-sm uppercase text-cream">{tab}</h1>
          {tab === "LISTINGS" && <ListingsTable listings={listings} users={users} />}
          {tab === "USERS" && <UsersTable users={users} />}
          {tab === "DEALS" && <DealsTable deals={deals} users={users} listings={listings} />}
          {tab === "SAR FLAGS" && <FlagsTable flags={flags} />}
          {tab === "AUDIT LOG" && (
            <>
              <input
                className="auth-input mb-4"
                placeholder="Filter by user, action type, entity type"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <AuditTable auditLog={filteredAudit} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ListingsTable({ listings, users }: { listings: Listing[]; users: Profile[] }) {
  const sellerMap = new Map(users.map((user) => [user.id, user.full_name ?? user.email ?? user.id]));
  return (
    <Table
      headers={["Created", "Platform", "Category", "Price", "Status", "Seller", "Views", "Actions"]}
      rows={listings.map((listing) => [
        date(listing.created_at),
        listing.platform,
        listing.category_label,
        money(listing.asking_price_gbp),
        <StatusSelect key={listing.id} value={listing.status} endpoint={`/api/admin/listings/${listing.id}`} />,
        sellerMap.get(listing.seller_id) ?? listing.seller_id,
        listing.views_count,
        <ActionButtons key={`${listing.id}-actions`} endpoint={`/api/admin/listings/${listing.id}`} viewLabel="View full listing" />,
      ])}
    />
  );
}

function UsersTable({ users }: { users: Profile[] }) {
  return (
    <Table
      headers={["Name", "Email", "Role", "Country", "KYC", "Deals", "Joined", "Actions"]}
      rows={users.map((user) => [
        user.full_name ?? "Unknown",
        user.email ?? "No email",
        user.role,
        user.country ?? "-",
        user.kyc_status,
        user.deal_count,
        date(user.created_at),
        <div key={user.id} className="flex flex-wrap gap-2">
          <PatchButton endpoint={`/api/admin/users/${user.id}`} body={{ suspended: !user.suspended_at }} label={user.suspended_at ? "Unsuspend" : "Suspend account"} />
          <PatchButton endpoint={`/api/admin/users/${user.id}`} body={{ kyc_status: "verified" }} label="Override KYC" />
        </div>,
      ])}
    />
  );
}

function DealsTable({ deals, users, listings }: { deals: Deal[]; users: Profile[]; listings: Listing[] }) {
  const userMap = new Map(users.map((user) => [user.id, user.full_name ?? user.email ?? user.id]));
  const listingMap = new Map(listings.map((listing) => [listing.id, listing.category_label]));
  return (
    <Table
      headers={["Deal ID", "Buyer", "Seller", "Listing", "Amount", "Status", "Created", "Actions"]}
      rows={deals.map((deal) => [
        deal.id.slice(0, 8),
        userMap.get(deal.buyer_id) ?? deal.buyer_id,
        userMap.get(deal.seller_id) ?? deal.seller_id,
        listingMap.get(deal.listing_id) ?? deal.listing_id.slice(0, 8),
        money(deal.agreed_price_gbp),
        deal.status,
        date(deal.created_at),
        <div key={deal.id} className="flex flex-wrap gap-2">
          <PatchButton endpoint={`/api/admin/deals/${deal.id}`} body={{ voyage_manager_name: "Voyage Manager", voyage_manager_email: "ops@treasureplanet.io" }} label="Assign Voyage Manager" />
          <PatchButton endpoint={`/api/admin/deals/${deal.id}`} body={{ flag: true }} label="Flag deal" />
        </div>,
      ])}
    />
  );
}

function FlagsTable({ flags }: { flags: SarFlag[] }) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return (
    <Table
      headers={["Created", "Entity Type", "Entity ID", "Reason", "Severity", "Reviewed", "Actions"]}
      rows={[...flags].sort((a, b) => order[a.severity] - order[b.severity]).map((flag) => [
        date(flag.created_at),
        flag.entity_type,
        flag.entity_id?.slice(0, 8) ?? "-",
        flag.flag_reason,
        flag.severity,
        flag.reviewed ? "Yes" : "No",
        <div key={flag.id} className="flex flex-wrap gap-2">
          <PatchButton endpoint={`/api/admin/sar-flags/${flag.id}`} body={{ reviewed: true, notes: "Reviewed in admin console." }} label="Mark reviewed" />
          <PatchButton endpoint={`/api/admin/sar-flags/${flag.id}`} body={{ severity: "critical" }} label="Escalate severity" />
        </div>,
      ])}
    />
  );
}

function AuditTable({ auditLog }: { auditLog: AuditLog[] }) {
  return (
    <Table
      headers={["Timestamp", "User", "Action", "Entity", "Metadata Summary"]}
      rows={auditLog.map((entry) => [
        date(entry.created_at),
        entry.user_id?.slice(0, 8) ?? "System",
        entry.action,
        `${entry.entity_type}:${entry.entity_id?.slice(0, 8) ?? "-"}`,
        JSON.stringify(entry.metadata).slice(0, 100),
      ])}
    />
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/60">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 text-sm text-cream2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusSelect({ value, endpoint }: { value: string; endpoint: string }) {
  return (
    <select
      className="border border-border bg-ink2 px-2 py-1 text-cream"
      defaultValue={value}
      onChange={(event) => fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: event.target.value }) })}
    >
      {["draft", "live", "under_offer", "sold", "withdrawn"].map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function ActionButtons({ endpoint, viewLabel }: { endpoint: string; viewLabel: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-cream2">{viewLabel}</button>
      <PatchButton endpoint={endpoint} body={{ status: "live" }} label="Approve" />
      <PatchButton endpoint={endpoint} body={{ status: "withdrawn" }} label="Reject" />
      <PatchButton endpoint={endpoint} body={{ flag: true }} label="Flag for review" />
    </div>
  );
}

function PatchButton({ endpoint, body, label }: { endpoint: string; body: object; label: string }) {
  return (
    <button
      className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-cream2 hover:border-gold hover:text-gold"
      onClick={() => fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })}
      type="button"
    >
      {label}
    </button>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value / 100);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
