window.matchMedia = (query: string) => {
  return {
    matches: query === "(pointer: fine)",
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  } as MediaQueryList;
};

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as any;
}

// jsdom doesn't implement elementFromPoint; Supermouse's resettle path
// uses it after programmatic scope transitions. Returning null falls
// through to clearHover, which matches the pre-resettle behavior these
// tests were written against.
document.elementFromPoint = () => null;
