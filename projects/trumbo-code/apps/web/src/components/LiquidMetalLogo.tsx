import { LiquidMetal } from "@paper-design/shaders-react";
import { Component, Suspense, useMemo, useState, type ReactNode } from "react";

import { cn } from "~/lib/utils";
import { TrumboLogoSvg } from "./TrumboLogoSvg";

const DIAMOND_MASK_URL = "https://shaders.paper.design/images/logos/diamond.svg";

const baseLiquidMetalProps = {
  colorBack: "#aaaaac00",
  colorTint: "#3adf55",
  repetition: 2,
  softness: 0.1,
  shiftRed: 0.3,
  shiftBlue: 0.3,
  distortion: 0.07,
  contour: 0.4,
  angle: 70,
  speed: 1,
  scale: 0.6,
  fit: "contain" as const,
  suspendWhenProcessingImage: true,
};

function resolveTrumboMaskUrl(): string {
  if (typeof window === "undefined") {
    return DIAMOND_MASK_URL;
  }
  try {
    return new URL("trumbo-logo.svg", window.location.href).href;
  } catch {
    return DIAMOND_MASK_URL;
  }
}

function LogoFallback({ size }: { readonly size: number }) {
  return <TrumboLogoSvg className={cn("text-[#2BBF77]")} style={{ width: size, height: size }} />;
}

function LiquidMetalLogoInner({
  maskUrl,
  size,
}: {
  readonly maskUrl: string;
  readonly size: number;
}) {
  return (
    <LiquidMetal
      {...baseLiquidMetalProps}
      width={size}
      height={size}
      image={maskUrl}
      className="block"
    />
  );
}

class ShaderErrorBoundary extends Component<
  { readonly children: ReactNode; readonly onError: () => void; readonly fallback: ReactNode },
  { readonly hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {
    this.props.onError();
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

type MaskTier = "trumbo" | "diamond" | "static";

/**
 * LiquidMetalLogo — the Trumbo "T" lettermark rendered as a futuristic liquid
 * metal material via @paper-design/shaders-react. The official trumbo-logo.svg
 * (transparent background) is the shader mask, tinted with the Trumbo brand
 * green. Falls back to the static SVG mark if WebGL/shader init fails.
 */
export function LiquidMetalLogo({
  size = 64,
  className,
}: {
  readonly size?: number;
  readonly className?: string;
}) {
  const trumboMaskUrl = useMemo(() => resolveTrumboMaskUrl(), []);
  const [maskTier, setMaskTier] = useState<MaskTier>("trumbo");

  if (maskTier === "static") {
    return <LogoFallback size={size} />;
  }

  const maskUrl = maskTier === "trumbo" ? trumboMaskUrl : DIAMOND_MASK_URL;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <ShaderErrorBoundary
        key={maskTier}
        fallback={<LogoFallback size={size} />}
        onError={() => {
          setMaskTier((current) => (current === "trumbo" ? "diamond" : "static"));
        }}
      >
        <Suspense fallback={<LogoFallback size={size} />}>
          <LiquidMetalLogoInner maskUrl={maskUrl} size={size} />
        </Suspense>
      </ShaderErrorBoundary>
    </div>
  );
}
