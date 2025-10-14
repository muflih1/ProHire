import { cn } from '@/lib/utils';
import React, { createContext, useMemo, useReducer } from 'react';

export type PageComponent<Props = object> = React.ComponentType<
  Props & { onReturn: (returnConfig?: ReturnConfig) => void; pageKey?: string }
>;
export type ReturnConfig = {
  index: number;
  pageKey?: string;
};

export type MultiPageViewContextValueType = {
  pushPage: (pageConfig: PageComponent, returnConfig?: ReturnConfig) => void;
  popPage?: (returnConfig?: ReturnConfig) => void;
};

const MultiPageViewContext =
  createContext<null | MultiPageViewContextValueType>(null);

export default MultiPageViewContext;

let id = 0;
function generateID() {
  return id++;
}

enum PageType {
  INITIAL_PAGE,
  PUSHED_PAGE,
}

enum ActionType {
  PUSH_PAGE,
  CLEAR_REMOVED_PAGES,
  POP_PAGE,
}

type Page = {
  key: number;
  type: PageType;
  component?: PageComponent;
  pageKey?: string;
  removed?: boolean;
};

type State = Page[];

type Action =
  | {
      type: ActionType.PUSH_PAGE;
      component: PageComponent;
      pageKey?: string;
    }
  | { type: ActionType.CLEAR_REMOVED_PAGES }
  | { type: ActionType.POP_PAGE; pageKey?: string; index?: number };

const initialState: State = [
  {
    key: generateID(),
    type: PageType.INITIAL_PAGE,
  },
];

function MultiPageViewReducer(state: State, action: Action) {
  const pages = state.filter(
    page => page.type !== PageType.PUSHED_PAGE || !page.removed
  );

  switch (action.type) {
    case ActionType.PUSH_PAGE: {
      const existingPage =
        action.pageKey != null
          ? pages.find(page => page.pageKey === action.pageKey)
          : null;

      if (existingPage != null) {
        throw new Error('Tried to push page with duplicate key.');
      }

      return [
        ...pages,
        {
          component: action.component,
          key: generateID(),
          pageKey: action.pageKey,
          removed: false,
          type: PageType.PUSHED_PAGE,
        },
      ];
    }
    case ActionType.CLEAR_REMOVED_PAGES:
      return pages;
    case ActionType.POP_PAGE: {
      const tailIndex = pages.length - 1;
      const tailPage = pages[tailIndex];

      if (tailPage.type === PageType.PUSHED_PAGE) {
        let popIndex = action.index;

        if (action.pageKey != null) {
          const index = pages.findIndex(
            page => page.pageKey === action.pageKey
          );
          popIndex = index > -1 ? index : popIndex;
        }

        return [
          ...pages.slice(0, popIndex != null ? Math.max(popIndex + 1, 1) : -1),
          { ...tailPage, removed: true },
        ];
      }
      break;
    }
  }

  return state;
}

export function MultiPageView(
  props: Pick<
    MultiPageViewContainerProps,
    'children' | 'className' | 'pageClassName'
  >
) {
  const [state, dispatch] = useReducer(MultiPageViewReducer, initialState);

  function handleAddPage(component: PageComponent, options?: ReturnConfig) {
    dispatch({
      type: ActionType.PUSH_PAGE,
      component,
      pageKey: options?.pageKey,
    });
  }

  function handlePopPage(options?: ReturnConfig) {
    dispatch({
      type: ActionType.POP_PAGE,
      index: options?.index,
      pageKey: options?.pageKey,
    });
  }

  function handleClearRemovedPages() {
    dispatch({ type: ActionType.CLEAR_REMOVED_PAGES });
  }

  return (
    <MultiPageViewContainer
      pageHistory={state}
      onAddPage={handleAddPage}
      onPopPage={handlePopPage}
      onClearRemovedPages={handleClearRemovedPages}
      {...props}
    />
  );
}

type MultiPageViewContainerProps = {
  pageHistory: State;
  onAddPage: (component: PageComponent, options?: ReturnConfig) => void;
  onPopPage: (options?: ReturnConfig) => void;
  onClearRemovedPages: () => void;
  children:
    | ((
        pushPage: (component: PageComponent, options?: ReturnConfig) => void
      ) => React.ReactNode)
    | React.ReactNode;
  className?: string;
  pageClassName?: string;
};

function MultiPageViewContainer({
  pageHistory,
  onAddPage,
  onPopPage,
  onClearRemovedPages,
  children,
  className,
  pageClassName,
}: MultiPageViewContainerProps) {
  const currentPageIndex = useMemo(() => {
    for (let i = pageHistory.length - 1; i >= 0; i--) {
      const page = pageHistory[i];
      if (page.type !== PageType.PUSHED_PAGE || !page.removed) return i;
    }
    return 0;
  }, [pageHistory]);

  function handlePushPage(component: PageComponent, options?: ReturnConfig) {
    onAddPage(component, options);
  }

  function handlePopPage(options?: ReturnConfig) {
    onPopPage(options);
    window.requestAnimationFrame(() => {
      onClearRemovedPages();
    });
  }

  return (
    <div
      className={cn('flex flex-col min-w-0 relative items-stretch', className)}
    >
      {pageHistory.map((page: any, index: number) => (
        <div
          key={page.key}
          className={cn(
            'rounded-[inherit] flex flex-col min-w-0 grow',
            index !== currentPageIndex &&
              'hidden [visibility:hidden] absolute top-0 pointer-events-none z-1',
            pageClassName
          )}
        >
          <MultiPageViewContext.Provider
            value={{ pushPage: handlePushPage, popPage: handlePopPage }}
          >
            {page.type === PageType.INITIAL_PAGE ? (
              typeof children === 'function' ? (
                children(handlePushPage)
              ) : (
                children
              )
            ) : page.type === PageType.PUSHED_PAGE ? (
              <page.component onReturn={handlePopPage} />
            ) : null}
          </MultiPageViewContext.Provider>
        </div>
      ))}
    </div>
  );
}
