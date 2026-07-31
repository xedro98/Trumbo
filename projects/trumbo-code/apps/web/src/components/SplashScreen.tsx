import { LiquidMetalLogo } from "./LiquidMetalLogo";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="flex size-24 items-center justify-center"
        aria-label="Trumbo Code splash screen"
      >
        <LiquidMetalLogo size={64} />
      </div>
    </div>
  );
}
