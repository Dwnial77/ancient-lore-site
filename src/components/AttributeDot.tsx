import type { Attribute } from "@/db/schema";

const COLORS: Record<Attribute, string> = {
  str: "bg-str shadow-[0_0_8px] shadow-str/60",
  agi: "bg-agi shadow-[0_0_8px] shadow-agi/60",
  int: "bg-int shadow-[0_0_8px] shadow-int/60",
  all: "bg-all shadow-[0_0_8px] shadow-all/60",
};

export function AttributeDot({ attribute, className = "" }: { attribute: Attribute; className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-full ${COLORS[attribute]} ${className}`} />;
}
