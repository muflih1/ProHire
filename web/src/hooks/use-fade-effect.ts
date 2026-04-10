import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

const TRANSITION = 1000;

type State = {
  isTransitioning: boolean;
  shouldBeVisible: boolean;
};

type Action = {type: 'START'; value: boolean} | {type: 'FINISH'};

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'START':
      return {
        isTransitioning: true,
        shouldBeVisible: action.value,
      };
    case 'FINISH':
      return {
        ...state,
        isTransitioning: false,
      };
    default:
      return state;
  }
}

export function useFadeEffect(isVisibleProp: boolean) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [state, dispatch] = useReducer(reducer, {
    isTransitioning: false,
    shouldBeVisible: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousVisibilityRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current != null)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const finishTransition = useCallback(() => {
    dispatch({type: 'FINISH'});
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTransition = useCallback(
    (targetVisibility: boolean) => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        dispatch({type: 'START', value: targetVisibility});
        animationFrameRef.current = null;
        if (timeoutRef.current != null) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(finishTransition, TRANSITION);
      });
    },
    [finishTransition],
  );

  useLayoutEffect(() => {
    if (previousVisibilityRef.current !== isVisibleProp) {
      if (isVisibleProp && elementRef.current != null) {
        startTransition(true);
      } else {
        startTransition(false);
      }
      previousVisibilityRef.current = isVisibleProp;
    }
  }, [isVisibleProp]);

  const setElementRef = useCallback(
    (node: HTMLElement | null) => {
      const previousNode = elementRef.current;
      elementRef.current = node;

      if (node != null) {
        if (node.addEventListener != null) {
          node.addEventListener('transitionend', finishTransition);
          node.addEventListener('webkitTransitionEnd', finishTransition);
        }

        if (previousVisibilityRef.current === true) {
          startTransition(true);
        }
      } else if (
        previousNode != null &&
        previousNode.removeEventListener != null
      ) {
        previousNode.removeEventListener('transitionend', finishTransition);
        previousNode.removeEventListener(
          'webkitTransitionEnd',
          finishTransition,
        );
      }
    },
    [startTransition, finishTransition],
  );

  const isVisible = state.isTransitioning || state.shouldBeVisible;

  return [isVisible, state.shouldBeVisible, setElementRef] as const;
}