import type { MemberDoc } from "@/lib/types";

type Flags = Pick<MemberDoc, "tabSwitches" | "fullscreenExits" | "deviceConflicts" | "fullscreenUnsupported">;

function tone(count: number): string {
  if (count === 0) return "";
  return count > 3 ? "badge-danger" : "badge-warning";
}

export function integrityRows(member: Flags) {
  return [
    { key: "tab", label: "Tab switches", short: "Tabs", count: member.tabSwitches ?? 0 },
    { key: "fullscreen", label: "Fullscreen exits", short: "Fullscreen", count: member.fullscreenExits ?? 0 },
    { key: "device", label: "Blocked second device", short: "Devices", count: member.deviceConflicts ?? 0 },
  ];
}

export function IntegrityFlags({ member }: { member: Flags }) {
  const rows = integrityRows(member);
  if (rows.every((row) => row.count === 0) && !member.fullscreenUnsupported) {
    return <span className="badge badge-success">Clean</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {rows
        .filter((row) => row.count > 0)
        .map((row) => (
          <span key={row.key} className={`badge ${tone(row.count)}`} title={row.label}>
            {row.short}: {row.count}
          </span>
        ))}
      {member.fullscreenUnsupported && (
        <span className="badge" title="The device did not support fullscreen, so it was not enforced">
          No fullscreen
        </span>
      )}
    </span>
  );
}
