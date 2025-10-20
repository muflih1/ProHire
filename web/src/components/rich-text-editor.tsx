import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertList,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { useEffect, useRef, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { Button } from './ui/button';
import { BoldIcon, Divide, ItalicIcon, ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';

function onError(error: any) {
  console.error(error);
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const initialConfig = {
    namespace: 'MyEditor',
    theme: {},
    onError,
    nodes: [ListNode, ListItemNode],
    editorState: () => $convertFromMarkdownString(value, TRANSFORMERS),
  };

  return (
    <div className='rounded-md border border-input relative'>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <div className='relative'>
              <ContentEditable
                aria-placeholder='Description'
                placeholder={
                  <div className='absolute outline-none pointer-events-none top-2 left-2 text-muted-foreground'>
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

  function $updateToolbar() {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));

      const anchorNode = selection.anchor.getNode();
      const parentList = $getNearestNodeOfType(anchorNode, ListNode);

      setIsList(!!parentList && parentList.getListType() === 'bullet');
    }
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor }
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          $insertList('bullet');
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $updateToolbar]);

  return (
    <div
      role='group'
      ref={toolbarRef}
      className='flex items-center gap-.5 p-0.5 border-b border-b-input'
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant={'ghost'}
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
              }
              className={cn(
                isBold &&
                  'bg-black text-white hover:bg-black/85 hover:text-white'
              )}
            >
              <BoldIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant={'ghost'}
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
            }
            className={cn(
              isItalic &&
                'bg-black text-white hover:bg-black/85 hover:text-white'
            )}
          >
            <ItalicIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant={'ghost'}
            onClick={() =>
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            }
            className={cn(
              isList && 'bg-black text-white hover:bg-black/85 hover:text-white'
            )}
          >
            <ListIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>List</TooltipContent>
      </Tooltip>
    </div>
  );
}
