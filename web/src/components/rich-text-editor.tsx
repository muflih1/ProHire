import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $insertList,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode,
} from '@lexical/rich-text';
import React, {useEffect, useRef, useState} from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_LOW,
  EditorThemeClasses,
  FORMAT_TEXT_COMMAND,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {$getNearestNodeOfType, mergeRegister} from '@lexical/utils';
import {$setBlocksType} from '@lexical/selection';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import {Button} from './ui/button';
import {
  BoldIcon,
  HeadingIcon,
  ItalicIcon,
  ListCheckIcon,
  ListIcon,
  ListOrderedIcon,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

function onError(error: any) {
  console.error(error);
}

export default function RichTextEditor({
  value,
  onChange,
  id,
  ref,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  ref?: React.Ref<HTMLDivElement | null>;
} & React.AriaAttributes) {
  const initialConfig = {
    namespace: 'MyEditor',
    theme: {
      root: 'prose dark:prose-invert',
      text: {
        italic: 'italic',
      },
    } satisfies EditorThemeClasses,
    onError,
    nodes: [ListNode, ListItemNode, HeadingNode],
    editorState: () => $convertFromMarkdownString(value, TRANSFORMERS),
  };

  return (
    <div
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
      className='w-full min-w-0 rounded-lg border border-input bg-transparent relative transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,box-shadow] ease-in-out duration-150 outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-within:ring-3 aria-invalid:focus-within:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:focus-within:ring-destructive/40 overflow-hidden'
    >
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <div className='relative'>
              <ContentEditable
                ref={ref}
                id={id}
                aria-placeholder='Description'
                placeholder={
                  <div className='absolute outline-none pointer-events-none top-2.75 left-2 text-muted-foreground'>
                    Description
                  </div>
                }
                className='w-full p-2 focus-visible:outline-none min-h-40'
              />
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={editorState => {
            editorState.read(() => {
              const markdown = $convertToMarkdownString(TRANSFORMERS);
              onChange(markdown);
            });
          }}
        />
      </LexicalComposer>
    </div>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isList, setIsList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [isCheckList, setIsCheckList] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  function getActiveBlockType(selection: RangeSelection) {
    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    if ($isHeadingNode(element)) {
      return element.getTag();
    }

    return element.getType();
  }

  function getActiveListType(selection: RangeSelection): ListType | null {
    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    const listNode = $getNearestNodeOfType(element as any, ListNode);

    if (!listNode) return null;

    return listNode.getListType();
  }

  function $updateToolbar() {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setBlockType(getActiveBlockType(selection));

      const listType = getActiveListType(selection);
      setIsList(listType === 'bullet');
      setIsNumberedList(listType === 'number');
      setIsCheckList(listType === 'check');
    }
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor},
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          $insertList('bullet');
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateToolbar]);

  return (
    <div
      role='group'
      ref={toolbarRef}
      className='flex items-center gap-.5 p-0.5 dark:bg-transparent bg-secondary'
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type='button'
                variant={'ghost'}
                onClick={() =>
                  editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      const anchorNode = selection.anchor.getNode();
                      const node =
                        anchorNode.getKey() === 'root'
                          ? anchorNode
                          : anchorNode.getTopLevelElementOrThrow();

                      if ($isHeadingNode(node) && node.getTag() === 'h1') {
                        $setBlocksType(selection, () => $createParagraphNode());
                      } else {
                        $setBlocksType(selection, () =>
                          $createHeadingNode('h1'),
                        );
                      }
                    }
                  })
                }
                className={cn(
                  blockType === 'h1' && 'bg-primary text-primary-foreground',
                )}
              />
            }
          >
            <HeadingIcon />
          </TooltipTrigger>
          <TooltipContent>Heading 1</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type='button'
                variant={'ghost'}
                onClick={() =>
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                }
                className={cn(isBold && 'bg-primary text-primary-foreground')}
              />
            }
          >
            <BoldIcon />
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type='button'
              variant={'ghost'}
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
              }
              className={cn(isItalic && 'bg-primary text-primary-foreground')}
            />
          }
        >
          <ItalicIcon />
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type='button'
              variant={'ghost'}
              onClick={() =>
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const listType = getActiveListType(selection);

                    if (listType === 'bullet') {
                      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                      editor.dispatchCommand(
                        INSERT_UNORDERED_LIST_COMMAND,
                        undefined,
                      );
                    }
                  }
                })
              }
              className={cn(isList && 'bg-primary text-primary-foreground')}
            />
          }
        >
          <ListIcon />
        </TooltipTrigger>
        <TooltipContent>Bullet List</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type='button'
              variant={'ghost'}
              onClick={() =>
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const listType = getActiveListType(selection);

                    if (listType === 'number') {
                      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                      editor.dispatchCommand(
                        INSERT_ORDERED_LIST_COMMAND,
                        undefined,
                      );
                    }
                  }
                })
              }
              className={cn(
                isNumberedList && 'bg-primary text-primary-foreground',
              )}
            />
          }
        >
          <ListOrderedIcon />
        </TooltipTrigger>
        <TooltipContent>Ordered List</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type='button'
              variant={'ghost'}
              onClick={() =>
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const listType = getActiveListType(selection);

                    if (listType === 'check') {
                      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                    } else {
                      editor.dispatchCommand(
                        INSERT_CHECK_LIST_COMMAND,
                        undefined,
                      );
                    }
                  }
                })
              }
              className={cn(
                isCheckList && 'bg-primary text-primary-foreground',
              )}
            />
          }
        >
          <ListCheckIcon />
        </TooltipTrigger>
        <TooltipContent>Check List</TooltipContent>
      </Tooltip>
    </div>
  );
}
