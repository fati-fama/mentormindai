import { prisma } from "@/lib/prisma";

export type ThemeLayout = "FOCUS" | "CLASSIC" | "COMPACT";

export type ThemeInput = {
  layout: ThemeLayout;
  primaryColor: string;
  secondaryColor: string;
  blendedPalette?: string | null;
  avatarColor?: string;
  highContrast?: boolean;
  reducedMotion?: boolean;
};

export type ContrastCheck = {
  pass: boolean;
  ratio: number;
  suggestedTextColor?: string;
};

export type ThemeSaveResult = {
  theme: NonNullable<Awaited<ReturnType<typeof getTheme>>>;
  contrastWarning: ContrastCheck | null;
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(hex: string): boolean {
  return HEX_RE.test(hex);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null;
  const cleaned = hex.slice(1);
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

function srgbChannel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const r = srgbChannel(rgb.r);
  const g = srgbChannel(rgb.g);
  const b = srgbChannel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickReadableTextColor(background: string): "white" | "black" {
  if (!isValidHex(background)) return "black";
  return relativeLuminance(background) > 0.4 ? "black" : "white";
}

export function checkContrast(primary: string, secondary: string): ContrastCheck {
  if (!isValidHex(primary) || !isValidHex(secondary)) {
    return { pass: false, ratio: 0 };
  }
  const ratio = contrastRatio(primary, secondary);
  const pass = ratio >= 3;
  return {
    pass,
    ratio: Math.round(ratio * 100) / 100,
    suggestedTextColor: pass ? undefined : pickReadableTextColor(primary),
  };
}

export async function getTheme(userId: string) {
  return prisma.themePreference.findUnique({ where: { userId } });
}

export async function saveTheme(userId: string, input: ThemeInput): Promise<ThemeSaveResult> {
  if (!isValidHex(input.primaryColor)) throw new Error("Invalid primary color");
  if (!isValidHex(input.secondaryColor)) throw new Error("Invalid secondary color");
  if (input.avatarColor && !isValidHex(input.avatarColor)) throw new Error("Invalid avatar color");

  const contrastWarning = checkContrast(input.primaryColor, input.secondaryColor).pass
    ? null
    : checkContrast(input.primaryColor, input.secondaryColor);

  const theme = await prisma.themePreference.upsert({
    where: { userId },
    update: {
      layout: input.layout,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      blendedPalette: input.blendedPalette ?? null,
      avatarColor: input.avatarColor ?? "#7C3AED",
      highContrast: input.highContrast ?? false,
      reducedMotion: input.reducedMotion ?? false,
    },
    create: {
      userId,
      layout: input.layout,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      blendedPalette: input.blendedPalette ?? null,
      avatarColor: input.avatarColor ?? "#7C3AED",
      highContrast: input.highContrast ?? false,
      reducedMotion: input.reducedMotion ?? false,
    },
  });

  return { theme, contrastWarning };
}

export async function resetTheme(userId: string) {
  return prisma.themePreference.upsert({
    where: { userId },
    update: {
      layout: "CLASSIC",
      primaryColor: "#4F46E5",
      secondaryColor: "#10B981",
      blendedPalette: null,
      avatarColor: "#7C3AED",
      highContrast: false,
      reducedMotion: false,
    },
    create: {
      userId,
      layout: "CLASSIC",
      primaryColor: "#4F46E5",
      secondaryColor: "#10B981",
      blendedPalette: null,
      avatarColor: "#7C3AED",
      highContrast: false,
      reducedMotion: false,
    },
  });
}
