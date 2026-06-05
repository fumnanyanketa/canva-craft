import {
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { NETWORKS } from "@/services/networks";
import type { NetworkId } from "@/services/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NetworkId, LucideIcon> = {
  instagram: Instagram,
  x: Twitter,
  facebook: Facebook,
  tiktok: Music2,
  linkedin: Linkedin,
  youtube: Youtube,
};

interface Props {
  network: NetworkId;
  className?: string;
  /** Render a filled colored chip instead of a bare icon. */
  chip?: boolean;
  size?: number;
}

export function NetworkIcon({ network, className, chip, size = 16 }: Props) {
  const Icon = ICONS[network];
  const meta = NETWORKS[network];

  if (chip) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md text-white",
          className
        )}
        style={{ backgroundColor: meta.color, width: size + 12, height: size + 12 }}
        title={meta.label}
      >
        <Icon size={size} />
      </span>
    );
  }

  return (
    <Icon
      size={size}
      className={className}
      style={{ color: meta.color }}
      aria-label={meta.label}
    />
  );
}
