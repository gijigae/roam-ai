import toConfigPageName from "roamjs-components/util/toConfigPageName";
import runExtension from "roamjs-components/util/runExtension";
import addStyle from "roamjs-components/dom/addStyle";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import getCurrentPageUid from "roamjs-components/dom/getCurrentPageUid";

import getParentUidByBlockUid from "roamjs-components/queries/getParentUidByBlockUid";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

import { render as renderMenu } from "./RoamAIMenu";

const extensionId = "roam-ai";
const CONFIG = toConfigPageName(extensionId);

let lastEditedBlockUid: string;
let valueToCursor: string;

let OPEN_AI_API_KEY = '';

const sendRequest = (option: any, model: any) => {
  const parentBlockUid = getParentUidByBlockUid(lastEditedBlockUid);
  const siblings = getBasicTreeByParentUid(parentBlockUid);

  let prompt = option.preset || '';
  prompt += getTextByBlockUid(parentBlockUid);
  prompt += '\n';
  // add sibling blocks BEFORE the current block
  siblings.find((b) => {
    prompt += getTextByBlockUid(b.uid).replace(new RegExp('qq$'), '')
    prompt += '\n';
    return b.uid === lastEditedBlockUid;
  })
  prompt += option.presetSuffix || '';

  // if there are no other siblings
  if (siblings.length <= 1) {
    prompt += valueToCursor.replace(new RegExp('qq$'), '');
  }

  const data = {
    model: model.name,
    prompt: prompt,
    temperature: 0.7,
    max_tokens: option.maxTokens || 60
  }

  console.log("sending request payload", data)

  const url = 'https://api.openai.com/v1/completions'
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPEN_AI_API_KEY}`
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) return;

    const lines = data.choices[0].text.trim().split("\n");
    lines.reverse().map((line: any) => {
      if (line.trim().length === 0) return; // skip blank line

      if (option.operation === 'updateParent') {
        updateBlock({
          text: line.trim(),
          uid: parentBlockUid
        })
      }
      else {
        createBlock({
          node: { text: line.trim() },
          parentUid: lastEditedBlockUid
        })
      }
    })
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

export default runExtension({
  extensionId, 
  run: ({ extensionAPI }) => {
    const updateAPIKey = (value: string) => {
      if (!value) return;

      OPEN_AI_API_KEY = value.trim();
    }

    updateAPIKey(extensionAPI.settings.get("api_key") as string);

    extensionAPI.settings.panel.create({
      tabTitle: "Roam AI",
      settings: [
        {
          action: {
            type: "input",
            onChange: (e) => updateAPIKey(e.target.value),
            placeholder: "sk-u80asgdf780ga3uipgrh1089y",
          },
          id: "api_key",
          name: "API key",
          description:
            "Your Open AI API key",
        },
      ],
    });

    // detect keys
    const appRoot = document.querySelector<HTMLDivElement>(".roam-app");
    const appRootKeydownListener = async (e: KeyboardEvent) => {
      // resetting if the menu is stuck
      if (e.key === 'Escape') {
        menuLoaded = false;
      }
    };
    appRoot?.addEventListener("keydown", appRootKeydownListener);

    // read document input
    let menuLoaded = false;
    let trigger = 'qq';
    let triggerRegex = new RegExp(`${trigger}(.*)$`);;

    const documentInputListener = (e: InputEvent) => {
      const target = e.target as HTMLElement;
      if (
        !menuLoaded &&
        target.tagName === "TEXTAREA" &&
        target.classList.contains("rm-block-input")
      ) {
        const textarea = target as HTMLTextAreaElement;
        const location = window.roamAlphaAPI.ui.getFocusedBlock();
        valueToCursor = textarea.value.substring(
          0,
          textarea.selectionStart
        );

        lastEditedBlockUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"]
    
        const match = triggerRegex.exec(valueToCursor);
        if (match) {
          menuLoaded = true;

          renderMenu({
            textarea,
            triggerRegex,
            triggerStart: match.index,
            sendRequest,
            extensionAPI,
            onClose: () => {
              menuLoaded = false;
            },
          });
        }
      }
    };
    document.addEventListener("input", documentInputListener);

    return {
      domListeners: [
        { type: "input", listener: documentInputListener, el: document },
        { type: "keydown", el: appRoot, listener: appRootKeydownListener },
      ]
    };
  },
  unload: () => {
  },
});
  