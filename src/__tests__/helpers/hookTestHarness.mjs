/**
 * Lightweight Hook Test Harness for Node.js Native Test Runner
 * Provides a React-compliant hook execution lifecycle:
 * - useState (state slots with setter triggers)
 * - useRef (persistent object reference across renders)
 * - useCallback (function memoization)
 * - useMemo (computed value memoization)
 * - useEffect (effect scheduling, dependency comparison, and unmount cleanups)
 */

import React from 'react';

export class HookHarness {
  constructor(hookFn, { initialProps = {} } = {}) {
    this.hookFn = hookFn;
    this.props = initialProps;
    this.states = [];
    this.refs = [];
    this.callbacks = [];
    this.memos = [];
    this.effects = [];
    this.isMounted = true;
    this.isRendering = false;
    this.result = { current: null };

    this._render();
  }

  _render() {
    if (!this.isMounted) return;
    this.isRendering = true;
    this.stateIndex = 0;
    this.refIndex = 0;
    this.callbackIndex = 0;
    this.memoIndex = 0;
    this.effectIndex = 0;
    this.pendingEffects = [];

    const hooks = {
      useState: (initial) => {
        const idx = this.stateIndex++;
        if (this.states.length <= idx) {
          const val = typeof initial === 'function' ? initial() : initial;
          this.states.push(val);
        }
        const setter = (update) => {
          const prev = this.states[idx];
          const next = typeof update === 'function' ? update(prev) : update;
          if (next !== prev) {
            this.states[idx] = next;
            if (this.isMounted && !this.isRendering) {
              this._render();
            }
          }
        };
        return [this.states[idx], setter];
      },

      useRef: (initial) => {
        const idx = this.refIndex++;
        if (this.refs.length <= idx) {
          this.refs.push({ current: initial });
        }
        return this.refs[idx];
      },

      useCallback: (fn, deps) => {
        const idx = this.callbackIndex++;
        if (this.callbacks.length <= idx) {
          this.callbacks.push({ fn, deps });
          return fn;
        }
        const prev = this.callbacks[idx];
        const changed = !deps || !prev.deps || deps.some((d, i) => d !== prev.deps[i]);
        if (changed) {
          this.callbacks[idx] = { fn, deps };
          return fn;
        }
        return prev.fn;
      },

      useMemo: (factory, deps) => {
        const idx = this.memoIndex++;
        if (this.memos.length <= idx) {
          const val = factory();
          this.memos.push({ val, deps });
          return val;
        }
        const prev = this.memos[idx];
        const changed = !deps || !prev.deps || deps.some((d, i) => d !== prev.deps[i]);
        if (changed) {
          const val = factory();
          this.memos[idx] = { val, deps };
          return val;
        }
        return prev.val;
      },

      useEffect: (effectFn, deps) => {
        const idx = this.effectIndex++;
        if (this.effects.length <= idx) {
          this.effects.push({ effectFn, deps, cleanup: null });
          this.pendingEffects.push(idx);
        } else {
          const prev = this.effects[idx];
          const changed = !deps || !prev.deps || deps.some((d, i) => d !== prev.deps[i]);
          if (changed) {
            if (typeof prev.cleanup === 'function') {
              prev.cleanup();
            }
            this.effects[idx] = { effectFn, deps, cleanup: null };
            this.pendingEffects.push(idx);
          }
        }
      },
    };

    const prevDispatcher = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H;
    try {
      if (React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = hooks;
      }
      this.result.current = this.hookFn(this.props, hooks);
    } finally {
      this.isRendering = false;
      if (React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = prevDispatcher;
      }
    }

    // Run pending effects synchronously after render
    for (const idx of this.pendingEffects) {
      const eff = this.effects[idx];
      const cleanup = eff.effectFn();
      if (typeof cleanup === 'function') {
        eff.cleanup = cleanup;
      }
    }
  }

  rerender(newProps) {
    if (newProps !== undefined) {
      this.props = newProps;
    }
    this._render();
  }

  unmount() {
    this.isMounted = false;
    for (const eff of this.effects) {
      if (typeof eff.cleanup === 'function') {
        eff.cleanup();
        eff.cleanup = null;
      }
    }
  }
}

export function renderHook(hookFn, options) {
  return new HookHarness(hookFn, options);
}

export async function act(asyncFn) {
  await asyncFn();
  await new Promise(r => setTimeout(r, 0));
}
