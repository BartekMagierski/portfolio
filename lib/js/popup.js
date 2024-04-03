class Popup{
  constructor() {
    this.register = {
      windows: {},
      set save(obj) {
        if(obj instanceof Object) {
          if(!(Reflect.has(this.windows, obj.id))) {
            this.windows[obj.id] = obj;
          } else throw "Something went wrong, ID of window instance was duplicated";
        } else throw "Instance of window wasn't saved properly";
      },
      exist(wID) {
        if(wID) {
          return wID in this.windows;
        } else throw "Window id is missing while searching popup";
      },
      getWindow(wID) {
        if(wID) {
          if(wID in this.windows) {
            let instance = {};
            temp.set(instance, this.windows[wID]);
            return instance;
          } else throw `There is no such window as: ${wID}`;
        } else throw "Window id is missing while geting popup";
      },
      clean(wID) {
        if(wID) {
          if(this.exist(wID)) {
            return Reflect.deleteProperty(this.windows, wID);
          } else console.warn(`There is no such mounted window as: ${wID}`);
        } else console.warn("Window id is missing while unmounting popup");
      }
    }
  }

  /**
   * 
   * @param {*} vNode 
   * @param {Element} closeTrigger Element that closes the window after click
   * @param {String} style CSS style id for popup window
   * @param {WeakMap} func State functions beforeMount, afterMount, beforeUnmout, afterUnmount 
   * @param {} parms Additional parameters, they are also passed to the state functions
   * @param {Array} flag 
   * Flag:  
   * - NO_CLOSE_EVENT
   * - NO_STORE
   * - IN_BOX => Mount in box instead of window
   * 
   */
  mount(vNode, closeTrigger, style, func, parms, flag) {

    try {

      // Make array from flag if only one flag was passed(makes it easier)
      if(!Array.isArray(flag)) flag = [flag];

      if(!(vNode instanceof Element)) throw "Can't mount that node";
      if(!(closeTrigger instanceof Element) && !Core.arrHas(flag, "NO_CLOSE_EVENT")) 
        throw "Can't mount window, because there is nothing to close the window";

      // Setup window
      let wID = Core.token(3);
      let stateFunc = temp.get(func);

      if(!Core.arrHas(flag, "NO_CLOSE_EVENT"))
        closeTrigger.addEventListener("click", () => { this.unmount(wID) })

      let pWindow = document.createElement("div");
      pWindow.setAttribute("id", wID);
      
      if(!(Array.isArray(style))) style = [style]
      style.unshift(
        Core.arrHas(flag, "IN_BOX") ? "popupBox" : "popupWindow"
      );
      
      style.filter(function(s){return s}).forEach(function(s){
        pWindow.classList.add(String(s));
      });
      if(style.length === 1) console.warn("There is no defined styles class for popup window")

      let wrapper = document.createElement("div");
      wrapper.classList.add("wrapper");
      
      // Before Mount
      if(stateFunc && "beforeMount" in stateFunc) stateFunc.beforeMount(wID, parms);

      // Render window
      wrapper.appendChild(vNode);
      pWindow.appendChild(wrapper);
      document.body.append(pWindow);

      
      if(!Core.arrHas(flag, "NO_STORE")) {
        this.register.save = {
          id: wID,
          vNode: pWindow,
          closeTrigger: closeTrigger,
          parms: parms,
          stateFunc: stateFunc
        };
      }
     
      // After Mount
      if(stateFunc && "afterMount" in stateFunc) stateFunc.afterMount(wID, parms);

      return wID;

    } catch(e) {
        console.group("Popup window");
        console.info("While attempt to mount window");
        console.error(e)
        console.groupEnd();
    }

  }

  /**
   * 
   * @param {String} wID Window id
   * @param {Array} flag 
   * Flag:
   * - JUST_DOM => unmount just in DOM, leave data in register
   * - NO_DATA => There is no window data in app cache
   */
  unmount(wID, flag, prm) {

    try {

      // Make array from flag if only one flag was passed(makes it easier)
      if(!Array.isArray(flag)) flag = [flag]; 

      let wData, stateFunc, vNode; 

      if(!Core.arrHas(flag, "NO_DATA")) {
        wData = temp.get(this.register.getWindow(wID));
        stateFunc = wData.stateFunc;
        vNode = wData.vNode;
      } else if(Core.arrHas(flag, "NO_DATA")) vNode = prm;
 
      let transitionDurr = Core.getCssProperty(vNode, "animation-duration", "TIME");

      vNode.classList.add("close");

      // Wait till window animation ends and then unmount
      window.setTimeout(() => {

        // Before Unmount 
        if(stateFunc && "beforeUnmount" in stateFunc) 
          stateFunc.beforeUnmount(wID, wData.parms);
        // Remove window from DOM
        document.body.removeChild(vNode);
        // After Unmount
        if(stateFunc && "afterUnmount" in stateFunc) 
          stateFunc.afterUnmount(wID, wData.parms);
        // Remove data from register
        if(!Core.arrHas(flag, "JUST_DOM")) this.register.clean(wID);

      }, transitionDurr);

      // Remove nodes from translations list
      let textNodes = Core.findRef(vNode, true, true, "ii", true);
      window.Language.switchData.nodesToTranslate.clean(textNodes);
      
    } catch(e) {
        console.group("Popup window");
        console.info("While attempt to unmount window");
        console.error(e);
        console.groupEnd();
    }
    
  }

 

}

// File ready
window.Build.scripts.ready = "popup";