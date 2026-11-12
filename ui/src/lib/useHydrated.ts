import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false f server w f l-hydration, true mn ba3d.
 * Kansta3mloh bach ma nrendriw text mtarjem 9bel l-hydration
 * (sinon ila l-user khtar 3arbiya, l-HTML dyal server (fr) ma kaytsawach m3a client -> React #418).
 */
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);