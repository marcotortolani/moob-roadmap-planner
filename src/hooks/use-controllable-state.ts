'use client';

import * as React from 'react';

type UseControllableStateProps<T> = {
  prop?: T;
  defaultProp?: T;
  onChange?: (state: T) => void;
};

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {},
}: UseControllableStateProps<T>) {
  const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
    defaultProp,
    onChange,
  });
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledProp;

  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (nextValue) => {
      if (isControlled) {
        const setter = nextValue as (prevState: T) => T;
        const value =
          typeof nextValue === 'function' ? setter(prop) : nextValue;
        if (value !== prop) {
          onChange(value);
        }
      } else {
        setUncontrolledProp(nextValue);
      }
    },
    [isControlled, prop, setUncontrolledProp, onChange]
  );

  return [value, setValue] as const;
}

function useUncontrolledState<T>({
  defaultProp,
  onChange,
}: Omit<UseControllableStateProps<T>, 'prop'>) {
  const uncontrolledState = React.useState<T | undefined>(defaultProp);
  const [value] = uncontrolledState;
  const prevValueRef = React.useRef(value);
  const SPREAD_SYMBOL = Symbol('spread');
  const setState: React.Dispatch<React.SetStateAction<T | undefined>> =
    React.useCallback(
      (nextValue) => {
        const nextValueResolved =
          typeof nextValue === 'function'
            ? (nextValue as (prevState: T | undefined) => T | undefined)(
                prevValueRef.current
              )
            : nextValue;

        if (prevValueRef.current !== nextValueResolved) {
          prevValueRef.current = nextValueResolved;
          uncontrolledState[1](nextValue);
          if (onChange && nextValueResolved !== undefined) {
            onChange(nextValueResolved);
          }
        }
      },
      [onChange, uncontrolledState]
    );

  return [value, setState] as const;
}
