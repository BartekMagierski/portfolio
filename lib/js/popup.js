class Popup{
  constructor() {
    this.register = {
      windows: {},
      exist(wID) { return wID in this.windows; },
      set save(obj) {
        if(obj instanceof Object) {
          if(!(obj.id in this.windows)) {
            this.windows[obj.id] = obj;
          } else throw "Something went wrong, ID of window instance was duplicated";
        } else throw "Instance of window has to be instance of object";
      },
      getWindow(wID) {
        if(wID) {
          if(wID in this.windows) {
            let instance = {};
            temp.set(instance, this.windows[wID]);
            return instance;
          } else throw `There is no such window as: ${wID}`;
        } else console.warn("Can't get window instance without its ID");
      },
      clean(wID) {
        if(wID) {
          if(this.exist(wID)) {
            return Reflect.deleteProperty(this.windows, wID);
          } else console.warn(`There is no such window instance as: ${wID}`);
        } else console.warn("Can't clean after popup instance because, its ID wasn't provided");
      }
    }
  }

  /** Render wait box or alert box
   * @param {String} type alertBox or waitBox
   * @param {WeakMap} state functions to pass to the mount function
   * @param {WeakMap} state parameters to pass to the mount function
   */
  async showBox(type, stateFunc, parms) {

    let boxID, css, name; 
    try {

      if(type !== "alertBox" && type !== "waitBox")
        throw "At this moment, only alertBox && waitBox are supported by this function";
      
      if(type === "waitBox") {
        boxID = window.siteData.waitBoxID;
        css   = "waitBox";
        name  = "Wait box";
      } else {
          boxID = window.siteData.alertBoxID;
          css   = "alertBox";
          name  = "Alert box";
      }
   
      if(!boxID) throw "Missing default window ID, I don't know what to render";

      if(!window.NavBasic.register.dataExist("other", boxID))
        throw `Missing the ${name} entity`;

      let {template, lang} = temp.get(window.NavBasic.register.getData("other", boxID, ["CLONE"]));
      let vNode = Core.makeNode(template);

      await window.Language.translate("node", lang, vNode);
      
      if(type === "alertBox") {
        let {close} = temp.get( Core.findRef(vNode, false, false, "ref", false) );
        return this.mount(vNode, close, css, stateFunc, parms, "IN_BOX");
      } else return this.mount(vNode, null, css, stateFunc, parms, ["IN_BOX","NO_CLOSE_EVENT"]);
      
    } catch(e) {
        console.group("Making the "+name);
        console.info("Wait window cannot be rendered");
        console.error(e);
        console.groupEnd();
        return null;
    }
  
	}

  /**
   * 
   * @param {Element} vNode 
   * @param {Element} closeTrigger Element that closes the window after click
   * @param {String} style CSS style id for popup window
   * @param {WeakMap} func State functions beforeMount, afterMount, beforeUnmout, afterUnmount 
   * @param {*} parms Additional parameters, they are also passed to the state functions
   * @param {Array} flag 
   * Flag:  
   * - NO_CLOSE_EVENT
   * - NO_STORE
   * - IN_BOX => Mount in box instead of window
   * 
   */
  mount(vNode, closeTrigger, style, func, parms, flag) {

    try {

      if(!(vNode instanceof Element)) throw "Can't mount that node";
      if(!(closeTrigger instanceof Element) && !Core.arrHas(flag, "NO_CLOSE_EVENT")) 
        throw "Can't mount window, because there is nothing to close the window";
      if(!style) console.info("Render window without css style");

      // Make array from flag if only one flag was passed(makes it easier)
      if(!Array.isArray(flag)) flag = [flag];
      if(!Array.isArray(style)) style = [style]
      
      let wID = Core.token(3);
      let stateFunc = temp.get(func);
      let stateParams = temp.get(parms);

      let windowNode = document.createElement("div");
      windowNode.setAttribute("id", wID);

      // Add genaral style (window or box)
      style.unshift( Core.arrHas(flag, "IN_BOX") ? "popupBox" : "popupWindow");
      style.filter( function(s) {
        if(typeof s !== "string") {

            console.warn("Popup window's style have to be type of string");
            return false;
        
        } else return true; 
      }).forEach(function(s){

          windowNode.classList.add(String(s));
      
      });

      // Save window instance
      if(!Core.arrHas(flag, "NO_STORE")) {
        this.register.save = {
          id: wID,
          vNode: windowNode,
          closeTrigger: closeTrigger,
          stateParams: parms,
          stateFunc: stateFunc
        };
      }
      
      // Setup vNode (HTML tree)
      let contentWrapper = document.createElement("div");
      contentWrapper.classList.add("wrapper");

      contentWrapper.appendChild(vNode);
      windowNode.appendChild(contentWrapper);

      if(!Core.arrHas(flag, "NO_CLOSE_EVENT"))
        closeTrigger.addEventListener("click", () => { this.unmount(wID) })

      // Before Mount
      if(stateFunc && "beforeMount" in stateFunc) stateFunc.beforeMount(wID, stateParams.beforeMount);

      // Render window
      document.body.append(windowNode);

      // After Mount
      if(stateFunc && "afterMount" in stateFunc) stateFunc.afterMount(wID, stateParams.afterMount);

      return wID;

    } catch(e) {

        console.group("Mount popup window");
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

      let wData, stateFunc, stateParams, vNode; 

      if(!Core.arrHas(flag, "NO_DATA")) {
        wData = temp.get(this.register.getWindow(wID));
        stateFunc = wData.stateFunc;
        stateParams = temp.get(wData.stateParams);
        vNode = wData.vNode;
      } else if(Core.arrHas(flag, "NO_DATA")) vNode = prm;
 
      let transitionDurr = Core.getCssProperty(vNode, "animation-duration", "TIME");
      vNode.classList.add("close");

      // Wait till window animation ends and then unmount
      return new Promise((success) => {

        window.setTimeout(() => {

          // Before Unmount 
          if(stateFunc && "beforeUnmount" in stateFunc) 
            stateFunc.beforeUnmount(wID, stateParams.beforeUnmount);
          // Remove window from DOM
          document.body.removeChild(vNode);
          // After Unmount
          if(stateFunc && "afterUnmount" in stateFunc) 
            stateFunc.afterUnmount(wID, stateParams.afterUnmount);
          // Remove data from register
          if(!Core.arrHas(flag, "JUST_DOM")) this.register.clean(wID);
          
          success();

        }, transitionDurr);

      }).then(function() {

          // Remove nodes from translations list
          let textNodes = Core.findRef(vNode, true, true, "ii", true);
          window.Language.switchData.nodesToTranslate.clean(textNodes);

      })
    
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