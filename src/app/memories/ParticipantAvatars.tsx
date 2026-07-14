import { branchColor } from "@/lib/branchColors";

type Person = { id: string; first_name: string | null; family_branch: string | null };

export default function ParticipantAvatars({
  people,
  size = "sm",
}: {
  people: Person[];
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  return (
    <div className="flex -space-x-2">
      {people.map((p) => {
        const color = branchColor(p.family_branch ?? "");
        const initial = p.first_name?.trim().charAt(0).toUpperCase() || "?";
        return (
          <span
            key={p.id}
            title={p.first_name ?? undefined}
            className={`flex ${dim} shrink-0 items-center justify-center rounded-full border-2 border-white font-semibold text-white`}
            style={{ backgroundColor: color.dark }}
          >
            {initial}
          </span>
        );
      })}
    </div>
  );
}
