import {cn} from '@/lib/utils';
import {mergeProps, useRender} from '@base-ui/react';

const directionStyles = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
} as const;

const displayStyles = {
  flex: 'flex',
  'inline-flex': 'inline-flex',
} as const;

const wrapStyles = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
} as const;

const justifyStyles = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
  stretch: 'justify-stretch',
} as const;

const alignItemsStyles = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
} as const;

const alignContentStyles = {
  start: 'content-start',
  end: 'content-end',
  center: 'content-center',
  between: 'content-between',
  around: 'content-around',
  evenly: 'content-evenly',
  stretch: 'content-stretch',
} as const;

const alignSelfStyles = {
  auto: 'self-auto',
  start: 'self-start',
  end: 'self-end',
  center: 'self-center',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
} as const;

const gapYStyles = {
  0: 'gap-y-0',
  0.5: 'gap-y-0.5',
  1: 'gap-y-1',
  1.5: 'gap-y-1.5',
  2: 'gap-y-2',
  3: 'gap-y-3',
  4: 'gap-y-4',
  5: 'gap-y-5',
  6: 'gap-y-6',
  7: 'gap-y-7',
  8: 'gap-y-8',
  9: 'gap-y-9',
  10: 'gap-y-10',
} as const;

const gapXStyles = {
  0: 'gap-x-0',
  0.5: 'gap-x-0.5',
  1: 'gap-x-1',
  1.5: 'gap-x-1.5',
  2: 'gap-x-2',
  3: 'gap-x-3',
  4: 'gap-x-4',
  5: 'gap-x-5',
  6: 'gap-x-6',
  7: 'gap-x-7',
  8: 'gap-x-8',
  9: 'gap-x-9',
  10: 'gap-x-10',
} as const;

const growStyles = {
  0: 'grow-0',
  1: 'grow',
  2: 'grow-[2]',
  3: 'grow-[3]',
  4: 'grow-[4]',
} as const;

const shrinkStyles = {
  0: 'shrink-0',
  1: 'shrink',
  2: 'shrink-[2]',
  3: 'shrink-[3]',
  4: 'shrink-[4]',
} as const;

const basisStyles = {
  auto: 'basis-auto',
  0: 'basis-0',
  full: 'basis-full',
  content: 'basis-content',
  '1/2': 'basis-1/2',
  '1/3': 'basis-1/3',
  '2/3': 'basis-2/3',
  '1/4': 'basis-1/4',
  '3/4': 'basis-3/4',
} as const;

const orderStyles = {
  0: 'order-none',
  1: 'order-1',
  2: 'order-2',
  3: 'order-3',
  4: 'order-4',
  5: 'order-5',
} as const;

export function Flexbox({
  className,
  direction,
  display = 'flex',
  wrap,
  justifyContent,
  alignItems,
  alignContent,
  alignSelf,
  gap,
  rowGap,
  columnGap,
  grow,
  shrink,
  basis,
  order,
  defaultMinSize = 0,
  ...props
}: useRender.ComponentProps<'div'> & {
  direction?: keyof typeof directionStyles;
  display?: keyof typeof displayStyles;
  wrap?: keyof typeof wrapStyles;
  justifyContent?: keyof typeof justifyStyles;
  alignItems?: keyof typeof alignItemsStyles;
  alignContent?: keyof typeof alignContentStyles;
  alignSelf?: keyof typeof alignSelfStyles;
  gap?: keyof typeof gapXStyles;
  rowGap?: keyof typeof gapYStyles;
  columnGap?: keyof typeof gapXStyles;
  grow?: keyof typeof growStyles;
  shrink?: keyof typeof shrinkStyles;
  basis?: keyof typeof basisStyles;
  order?: keyof typeof orderStyles;
  defaultMinSize?: 0;
}) {
  const colGap = columnGap ?? gap;
  const rGap = rowGap ?? gap;
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          defaultMinSize === 0 && 'min-w-0 min-h-0',
          displayStyles[display],
          direction != null && directionStyles[direction],
          wrap != null && wrapStyles[wrap],
          justifyContent != null && justifyStyles[justifyContent],
          alignItems != null && alignItemsStyles[alignItems],
          alignContent != null && alignContentStyles[alignContent],
          alignSelf && alignSelfStyles[alignSelf],
          colGap != null && gapXStyles[colGap],
          rGap != null && gapYStyles[rGap],
          grow != null && growStyles[grow],
          shrink != null && shrinkStyles[shrink],
          basis != null && basisStyles[basis],
          order != null && orderStyles[order],
          className,
        ),
      },
      props,
    ),
    state: {
      slot: 'flexbox',
    },
  });
}
