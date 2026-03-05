import { Moon, Cpu, Palette, Heart, Clock } from "lucide-react";
import type { ComponentType } from "react";

export interface Room {
  id: string;
  name: string;
  tagline: string;
  icon: ComponentType<{ className?: string }>;
  premium: boolean;
  peakHours: string;
}

export const rooms: Room[] = [
  {
    id: "night-owls",
    name: "Night Owls",
    tagline: "For those who come alive after dark. Late-night conversations with fellow insomniacs and stargazers.",
    icon: Moon,
    premium: false,
    peakHours: "10 PM – 2 AM",
  },
  {
    id: "tech-professionals",
    name: "Tech Professionals",
    tagline: "Engineers, designers, and builders who appreciate intellect and ambition in equal measure.",
    icon: Cpu,
    premium: false,
    peakHours: "7 PM – 11 PM",
  },
  {
    id: "creatives-makers",
    name: "Creatives & Makers",
    tagline: "Artists, writers, musicians, and anyone who creates. Where imagination meets connection.",
    icon: Palette,
    premium: false,
    peakHours: "6 PM – 12 AM",
  },
  {
    id: "over-35",
    name: "Over 35",
    tagline: "A space for those past the noise. Refined taste, established lives, genuine intent.",
    icon: Heart,
    premium: true,
    peakHours: "8 PM – 11 PM",
  },
  {
    id: "introvert-hours",
    name: "Introvert Hours",
    tagline: "Lower energy, longer pauses welcome. For those who connect deeply, not loudly.",
    icon: Clock,
    premium: true,
    peakHours: "9 PM – 1 AM",
  },
];

export function getSuggestedRoom(): Room {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 3) return rooms[0];
  if (hour >= 9 && hour < 18) return rooms[1];
  if (hour >= 18 && hour < 21) return rooms[2];
  return rooms[3];
}
