(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/tiny-react.ts
  function workLoop(deadline) {
    let shouldYield = false;
    while (wipRoot && !shouldYield) {
      wipRoot = performUnitOfWork(wipRoot);
      shouldYield = deadline.timeRemaining() < 1;
    }
    if (!wipRoot && currentRoot) {
      commitRoot();
    }
    requestIdleCallback(workLoop);
  }
  function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }
    if (fiber.child) return fiber.child;
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) return nextFiber.sibling;
      nextFiber = nextFiber.parent || null;
    }
    return null;
  }
  function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  }
  function updateHostComponent(fiber) {
    if (!fiber.dom) fiber.dom = createDom(fiber);
    reconcileChildren(fiber, fiber.props.children);
  }
  function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);
    updateDom(dom, {}, fiber.props);
    return dom;
  }
  function updateDom(dom, prevProps, nextProps) {
    Object.keys(prevProps).filter(isEvent).filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key)).forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
    Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach((name) => {
      dom[name] = "";
    });
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach((name) => {
      dom[name] = nextProps[name];
    });
    Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
  }
  function reconcileChildren(wipFiber2, elements) {
    let index = 0;
    let oldFiber = wipFiber2.alternate?.child;
    let prevSibling = null;
    while (index < elements.length || oldFiber != null) {
      const element = elements[index];
      let newFiber = null;
      const sameType = oldFiber && element && element.type === oldFiber.type;
      if (sameType) {
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: wipFiber2,
          alternate: oldFiber,
          effectTag: "UPDATE"
        };
      }
      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: void 0,
          parent: wipFiber2,
          alternate: void 0,
          effectTag: "PLACEMENT"
        };
      }
      if (oldFiber && !sameType) {
        oldFiber.effectTag = "DELETION";
        deletions.push(oldFiber);
      }
      if (oldFiber) oldFiber = oldFiber.sibling;
      if (index === 0) {
        wipFiber2.child = newFiber;
      } else if (element && prevSibling) {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
      index++;
    }
  }
  function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(currentRoot?.child);
    currentRoot = null;
  }
  function commitWork(fiber) {
    if (!fiber) return;
    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) domParentFiber = domParentFiber.parent;
    const domParent = domParentFiber.dom;
    if (fiber.effectTag === "PLACEMENT" && fiber.dom)
      domParent.appendChild(fiber.dom);
    else if (fiber.effectTag === "UPDATE" && fiber.dom)
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    else if (fiber.effectTag === "DELETION") commitDeletion(fiber, domParent);
    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }
  function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      commitDeletion(fiber.child, domParent);
    }
  }
  function render(element, container) {
    wipRoot = {
      dom: container,
      props: { children: [element] },
      alternate: currentRoot
    };
    deletions = [];
    currentRoot = wipRoot;
  }
  function useState(initial) {
    const oldHook = wipFiber?.alternate?.hooks?.[hookIndex];
    const hook = {
      state: oldHook ? oldHook.state : initial,
      queue: []
    };
    const actions = oldHook ? oldHook.queue : [];
    actions.forEach((action) => {
      hook.state = action(hook.state);
    });
    const setState = (action) => {
      const newAction = typeof action === "function" ? action : () => action;
      hook.queue.push(newAction);
      wipRoot = {
        ...currentRoot,
        alternate: currentRoot
      };
      deletions = [];
    };
    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
  }
  function createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.flat().map(
          (child) => typeof child === "object" ? child : createTextElement(child)
        )
      }
    };
  }
  function createTextElement(text) {
    return { type: "TEXT_ELEMENT", props: { nodeValue: text, children: [] } };
  }
  var wipRoot, currentRoot, deletions, wipFiber, hookIndex, isEvent, isProperty, isNew, isGone;
  var init_tiny_react = __esm({
    "src/tiny-react.ts"() {
      wipRoot = null;
      currentRoot = null;
      deletions = [];
      wipFiber = null;
      hookIndex = null;
      requestIdleCallback(workLoop);
      isEvent = (key) => key.startsWith("on");
      isProperty = (key) => key !== "children" && !isEvent(key);
      isNew = (prev, next) => (key) => prev[key] !== next[key];
      isGone = (prev, next) => (key) => !(key in next);
    }
  });

  // src/index.tsx
  var require_index = __commonJS({
    "src/index.tsx"() {
      init_tiny_react();
      function Counter() {
        const [count, setCount] = useState(0);
        return /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("h1", null, "Counter"), /* @__PURE__ */ createElement("p", null, "Count: ", count), /* @__PURE__ */ createElement("button", { onClick: () => setCount(count + 1) }, "Increment"));
      }
      var container = document.getElementById("root");
      render(/* @__PURE__ */ createElement(Counter, null), container);
    }
  });
  require_index();
})();
