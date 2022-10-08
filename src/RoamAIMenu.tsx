import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import './index.css';

import { getCoords } from "./dom";
import { Menu } from '@headlessui/react'
import type { OnloadArgs } from "roamjs-components/types/native";

type Props = {
  textarea: HTMLTextAreaElement;
  triggerStart: number;
  triggerRegex: RegExp;
  extensionAPI: OnloadArgs["extensionAPI"];
  sendRequest: any;
};

const OPTIONS = [
  {
    id: 'completion_default',
    name: '🧠 Completion (60 words)',
    maxTokens: 60
  },
  {
    id: 'completion_120',
    name: '🧠 Completion (120 words)',
    maxTokens: 120
  },
  {
    id: 'label_from_examples',
    name: 'Label parent',
    maxTokens: 3,
    operation: 'updateParent',
    preset: `examples:\n- apple\n- orange\n- pear\n- watermelon\n- tomato\nlabel: fruits\n\nexamples:\n- acrylic paint\n- wood\n- canvas\n- oil paint\n- bronze\nlabel: art media\n\nexamples:\n- blue\n- red\n- yellow\n- green\n- white\nlabel: colors\n\nexamples:\n- French\n- Spanish\n- Italian\n- English\nlabel: languages\n\nexamples:\n`,
    presetSuffix: 'label: '
  },
  {
    id: 'devils_advocate',
    name: '😈 Devil\'s advocate',
    maxTokens: 80,
    preset: ``,
    presetSuffix: '^playing the devil\'s advocate, come up with the best arguments against the statement above: '
  }
]  

const MODELS = [
  {
    name: 'text-davinci-002',
    displayName: 'text-davinci-002'
  },
  {
    name: 'code-davinci-002',
    displayName: 'code-davinci-002 (private beta)'
  }
]

const RoamAIMenu = ({
  onClose,
  textarea,
  triggerStart,
  triggerRegex,
  extensionAPI,
  sendRequest,
  model
}: any) => {
  const { ["block-uid"]: blockUid, ["window-id"]: windowId } = useMemo(
    () => window.roamAlphaAPI.ui.getFocusedBlock(),
    []
  );
  const menuRef = useRef(null);
  const [modelIndex, setModelIndex] = useState(0);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const onSelect = useCallback(
    (option) => {
      // onClose()
      // sendRequest(option, MODELS[modelIndex])
    },
    [menuRef, blockUid, onClose, triggerStart, textarea]
  );

  const keydownListener = useCallback(

    (e: KeyboardEvent) => {

      console.log("keydownListener", e.key, e.ctrlKey, e.metaKey); 

      // switch mode
      // if (e.ctrlKey || e.metaKey) {
      //   const modelCount = MODELS.length;

      //   if (e.key === "ArrowUp") {
      //     console.log("modelIndex ", modelIndex, ", modelCount", modelCount, (modelIndex - 1 + modelCount) % modelCount)

      //     // setModelIndex(1)//(modelIndex - 1)
      //     setModelIndex((modelIndex - 1 + modelCount) % modelCount);
      //     e.stopPropagation();
      //     e.preventDefault();
      //     return;
      //   }

      //   if (e.key === "ArrowDown") {
      //     console.log("modelIndex ", modelIndex, ", modelCount", modelCount, (modelIndex + 1) % modelCount)

      //     setModelIndex((modelIndex + 1) % modelCount);
      //     // setModelIndex(1) // (modelIndex +1)

      //     e.stopPropagation();
      //     e.preventDefault();
      //   } 

      //   return;
      // }
      // else {
        console.log("keydown (no cmd), activeIndex: ", activeIndex); 

        if (e.key === "ArrowDown") {
          const index = Number(menuRef.current.getAttribute("data-active-index"));
          const count = menuRef.current.childElementCount;

          setActiveIndex((index + 1) % count);
          e.stopPropagation();
          e.preventDefault();
        } else if (e.key === "ArrowUp") {
          const index = Number(menuRef.current.getAttribute("data-active-index"));
          const count = menuRef.current.childElementCount;
          setActiveIndex((index - 1 + count) % count);
          e.stopPropagation();
          e.preventDefault();
        } else if (e.key == "ArrowLeft" || e.key === "ArrowRight") {
          // e.stopPropagation();
          // e.preventDefault();
        } else if (e.key === "Enter") {
          const index = Number(menuRef.current.getAttribute("data-active-index"));
          onSelect(OPTIONS[index]);
          e.stopPropagation();
          e.preventDefault();
        } else if (e.key === "Escape") {
          onClose();
        } else {
          const value =
            triggerRegex.exec(
              textarea.value.substring(0, textarea.selectionStart)
            )?.[1] || "";
          if (value) {
            setFilter(value);
          } else {
            onClose();
            return;
          }
        }
      // }
    },
    [menuRef, setActiveIndex, setFilter, onClose, triggerRegex, textarea, modelIndex, activeIndex]
  );

  useEffect(() => {
    const listeningEl = !!textarea.closest(".rm-reference-item")
      ? textarea.parentElement // Roam rerenders a new textarea in linked references on every keypress
      : textarea;
    listeningEl.addEventListener("keydown", keydownListener);
    return () => {
      listeningEl.removeEventListener("keydown", keydownListener);
    }; 
  }, [keydownListener]);
  
  const getCurrentModel = () => {
    return MODELS[modelIndex] //.find(model => model.name === currentModel)
  }

  return (
    <div 
      
      className="bg-white drop-shadow-lg"
      data-active-index={activeIndex}
    >
      {/*<div className="px-3 py-3 text-md text-neutral-500 bg-gray-100 border border-l-0 border-t-0 border-r-0 border-b-1 border-gray-300 mb-2 flex items-center gap-x-4">
        <div className="font-semibold text-gray-500">
          { getCurrentModel()?.name }
        </div>
        <div className="text-gray-500 text-sm">
          ⌘ + ↑/↓ to select model
        </div>
      </div>*/}

      <div className="py-1 px-1" ref={menuRef}>
        { 
          OPTIONS.map((option, index) => {
            return(
              <div 
                className={`text-lg bg-white text-neutral-900 hover:bg-blue-50 hover:text-blue-900 w-full cursor-pointer px-1.5 py-1.5 ${activeIndex === index && 'bg-blue-50 text-blue-900'}`}
                onClick={() => onSelect(option)}
              >
                { option.name }
              </div>
            )
          })
        }
      </div>
    </div>
  );
};

export const render = (props: any) => {
  const parent = document.createElement("span");
  const coords = getCoords(props.textarea);
  parent.style.position = "absolute";
  parent.style.zIndex = '10';
  parent.style.boxShadow = '0 0 0 1px rgb(16 22 26 / 10%), 0 2px 4px rgb(16 22 26 / 20%), 0 8px 24px rgb(16 22 26 / 20%)';
  parent.style.border = '1px solid rgb(213,218,222)';
  parent.style.width = '400px';
  parent.style.left = `${coords.left + 20}px`;
  parent.style.top = `${coords.top + 20}px`;
  props.textarea.parentElement.insertBefore(parent, props.textarea);

  ReactDOM.render(
    <RoamAIMenu
      {...props}
      onClose={() => {
        // props.onClose();
        // ReactDOM.unmountComponentAtNode(parent);
        // parent.remove();
      }}
    />,
    parent
  );
};

export default RoamAIMenu;