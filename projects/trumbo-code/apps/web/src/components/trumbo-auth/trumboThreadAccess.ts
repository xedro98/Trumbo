import type { TrumboAuthState } from "@trumbo-code/contracts";
import {
  hasActiveTrumboModelSubscription,
  resolveTrumboModelAccessMessage,
  TRUMBO_SIGN_IN_FOR_MODELS_MESSAGE,
  TRUMBO_SUBSCRIBE_FOR_MODELS_MESSAGE,
} from "@trumbo-code/shared/trumboSubscription";

export type TrumboThreadAccessBlock =
  | { readonly kind: "none" }
  | { readonly kind: "sign-in" }
  | { readonly kind: "subscribe" };

export function resolveTrumboThreadAccessBlock(input: {
  readonly isNativeDesktop: boolean;
  readonly authState: TrumboAuthState | undefined;
  readonly threadError: string | null;
  readonly providerMessage: string | null | undefined;
}): TrumboThreadAccessBlock {
  if (!input.isNativeDesktop) {
    return { kind: "none" };
  }

  const authState = input.authState ?? { status: "signed-out" as const };

  if (authState.status !== "signed-in") {
    return { kind: "sign-in" };
  }

  // If the renderer's auth state confirms an active paid subscription, trust it
  // and never show the subscribe screen — even if the server/provider sends a
  // stale "subscribe" message (e.g. the server's subscription cache hasn't
  // refreshed yet, or a transient network error caused the server's fetch to
  // return null). The user is subscribed; blocking them is a false negative.
  if (hasActiveTrumboModelSubscription(authState.subscription)) {
    return { kind: "none" };
  }

  const accessMessage = resolveTrumboModelAccessMessage(authState);
  if (accessMessage === TRUMBO_SUBSCRIBE_FOR_MODELS_MESSAGE) {
    return { kind: "subscribe" };
  }

  const combined = `${input.threadError ?? ""}\n${input.providerMessage ?? ""}`;
  if (combined.includes(TRUMBO_SUBSCRIBE_FOR_MODELS_MESSAGE)) {
    return { kind: "subscribe" };
  }
  if (combined.includes(TRUMBO_SIGN_IN_FOR_MODELS_MESSAGE)) {
    return { kind: "sign-in" };
  }

  return { kind: "none" };
}
