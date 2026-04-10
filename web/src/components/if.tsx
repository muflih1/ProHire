import type React from 'react';

type Props = {
  condition: boolean;
  otherwise?: React.ReactNode;
  children: React.ReactNode;
};

export function If({condition, otherwise, children}: Props) {
  return condition ? children : otherwise;
}
