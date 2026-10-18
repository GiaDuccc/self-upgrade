declare module 'async-exit-hook' {
  function exitHook(callback: (done?: () => void) => void): void;
  export = exitHook;
}

