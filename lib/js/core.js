const  workers = {

  routes: {},
  queue:[],
  limit: 2,
  waitForSlotTime: 50,
  get isSpaceInQueue () { return this.queue.length < this.limit; },

  requestSlot: async function(ID) {

    await this.waitForSlot();
    let worker;
    
    if(ID in this.routes) {
      worker = new Worker(this.routes[ID]);
    } else if(ID in window) {
        worker = new Worker(window[ID]);
        this.routes[ID] = window[ID];
        delete window[ID];
    } else throw new Error(`No such blob file as ${ID}`);

    this.queue.push(worker);
    return worker;

  },

  releseSlot: function(worker) {

    let index =  this.queue.indexOf(worker);
    worker.terminate();
    this.queue.splice(index, 1);
    return true;

  },

  waitForSlot: function() {

    return new Promise((slotFree) => {
      if(!this.isSpaceInQueue) {
        let wait = window.setInterval(() => {
          if(isSpaceInQueue){
            clearInterval(wait);
            slotFree();
          }
        }, this.waitForSlotTime);
      } else slotFree();
    });

  }

}


class Core {
	
	static async ajax(id, requestData) {

    let tmp;
    return new Promise(async function(success, failure) {
      const worker = await workers.requestSlot("AjaxBlobURL");
      worker.postMessage(requestData);
      worker.onmessage = async function(response) {
        workers.releseSlot(worker);
        tmp = await response.data.text();
        tmp = JSON.parse(tmp);
        success(tmp);
      };
      worker.onerror = function(response) { 
        workers.releseSlot(worker);
				console.group("Error on worker return");
        console.error(response.message);
				console.groupEnd();
        worker.terminate();
      }
     
    });

	}

  static makeNode(rawHTML) {

    if(rawHTML) {
      let fake = document.createElement("div");
      fake.innerHTML = rawHTML;
      return fake.firstElementChild;
    }

  }

  static findRef(node, inArray, justValues, targets, clear) {

    if(!node instanceof Element) {
      console.warn("Node cannot be mapped, provided node isn't instance of element");
      return undefined;
    } else if(!targets) {
        console.warn("Missing targets to fetch");
        return undefined;
    }

    const container = {};
    temp.set(container, {});

    if(justValues && !inArray) inArray = true;
    if(!(targets instanceof Array)) targets = [targets];
    targets.forEach(function(target){ peek(container)[target] = inArray ? [] : {} })

    let current, queue, safety;
    queue = [];
    temp.set(queue, [node]);
    safety = 50000;

    // Map node
    while(safety-- !== 0 && peek(queue).length !== 0) {
      current = peek(queue).shift();
      if(current === null) break;
      // Go deeper through DOM
      if(current.firstElementChild)
       temp.set(queue,  peek(queue).concat(  Array.from( current.children ) ));
        // Save results in proper way
      targets.forEach(function(mark){
        if(current.hasAttribute(mark)) {
          inArray
            ? peek(container)[mark].push( justValues ? current.getAttribute(mark) : current )
            : peek(container)[mark][current.getAttribute(mark)] = current
          if(clear) current.removeAttribute(mark);
        }
      });

    }

    // If there was only one target requested, than flat the object
    if(Object.keys(peek(container)).length === 1){
      for(let key in peek(container)) {
        temp.set(container, peek(container)[key]);
      }
    }

    function peek(obj) {
      return temp.get(obj);
    }

    return container;

  }

	static mutationOccurs(haystack, needles, watchInterval, timeOut, promise) {

    if(!needles || !haystack) return null;
    if(!(needles instanceof Array)) needles = [needles];

    if(promise) {
      watch(promise[0], promise[1]);
    } else {
      return new Promise(function(success, failure) {
        watch(success, failure);
      });
    }

    function watch(success, failure) {
      let observer, stopObserve;
      let done = false;

      // Observation duration
      stopObserve = setTimeout(() => {
        clearInterval(observer);
        failure("Mutation watching timeout");
      }, timeOut ? timeOut : 5000);

      // Observation body
      observer = setInterval(() => {

        needles.forEach(function(needle, index) {
          if(haystack instanceof Object) {
            if(needle in haystack)
              needles[index] = true;
          } else {
              if(haystack.includes(needle))
                needles[index] = true;
          }
        });

        done = needles.every(function(needle){ return needle === true });
        if(done) {
          clearInterval(observer);
          clearTimeout(stopObserve);
          success(true);
        }

      }, watchInterval ? watchInterval : 200);
    }

  }

	static token(tokenLength, flag) {

		if(typeof tokenLength !== "number" || tokenLength <= 0 ) tokenLength = 5;
		const ascii = {
		numbers: [48, 49, 51, 52, 53, 54, 55, 56, 57],
		chars: [33, 35, 36, 37, 38, 40, 41, 44, 45, 46, 60, 61, 62, 63, 64, 91, 92, 93, 94, 95, 123, 124, 125],
		sLetters: [97, 98, 99, 100, 101, 102, 103, 104, 105, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122],
		bLetters: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]
		};

		let haystack = [];

		switch (flag) {
		case 'expression':

			break;

		default:
			temp.set( haystack, Object.values(ascii).flat(2) );
			break;

		}

		let token, index, char;
		token = "";

		for(let i = tokenLength; i != 0; i--) {
			index = Math.floor(Math.random() * temp.get(haystack).length -1);
			char = temp.get(haystack)[Math.abs(index)];
			token += String.fromCharCode( char );
		}

		return token;
	}

  /**
   * Get property value from css
   * @param {*} node Target node
   * @param {*} property Property to retrieve
   * @param {*} flag 
   * 
   * Flags:
   * TIME => return time in ms
   */
  static getCssProperty(node, property, flag) {
    try {

      if(!Array.isArray(flag)) flag = [flag]; 

      if(!node || !node instanceof Element)
        throw new Error("Parameter node is corrupt or missing");

      if(!property || !property instanceof String)
        throw new Error("Parameter property is corrupt or missing");


      let style = window.getComputedStyle(node);

      if(property in style) {
        
        let propValueParts;
        let propValue = style.getPropertyValue(property);

        if(Core.arrHas(flag, "TIME")) {

          propValueParts = String(propValue).split(/\B/);
          propValue = propValueParts.filter(function(val) {
            return /\d/.test(val);
          });
          propValue = parseFloat(propValue.join(""));
          if(Core.arrLastIndex(propValueParts) === "s") {
            return propValue * 1000
          } else if(Core.arrLastIndex(propValueParts) === "ms") return propValue;

        } else return propValue;

      } else throw `Node don't have property ${property}`;

    } catch(e) {
        console.group("get Css property");
        console.log("node", node);
        console.log("property", property);
        console.error(e);
        console.groupEnd();
        return null;
    }
  }

  /***********************************/
  /************ Loader ***************/
  /***********************************/

    /**
     * @param {String} loaderID
     * @returns {String} window ID
     */
    static mountLoader(loaderID) { 
      if(window.NavBasic.register.dataExist("other", loaderID)) {
        let wData = window.NavBasic.register.getData("other", loaderID);
        return window.Popup.mount(temp.get(wData).vNode, null, loaderID, null, null, "NO_CLOSE_EVENT");
      } else console.warn("Can't show loader, his instance is missing")
    }

    /**
     * @param {String} loaderID
     * @returns {void}
     */
    static unmountLoader(loaderID) {
      if(loaderID) {
        window.Popup.unmount(loaderID, null);
      }
    }
    
    static rmoInitialLoader() {
      // First check if loader even exist
      let vNode = document.getElementById("#Sh");
      if( Array.from(vNode.classList).includes("preloader") ) {
        window.Popup.unmount(null, ["JUST_DOM","NO_DATA"], vNode);
      } else console.info("Initial loader wasn't found")
    }

  /***********************************/

  /* I some cases i would like to check whether array contains item,
    without triggering exception when i pass undefined or array is undefined,
    its like Reflect.has() works
  */ 
  /** Works like Reflect.has(), only for arrays */
  static arrHas(arr, needle) {
    try {
      if(arr && needle && Array.isArray(arr)) {
        return arr.includes(needle);
      } else return false;
    } catch(e) { return false }
  }

  static arrLastIndex(arr) {
    if(arr && Array.isArray(arr)) {
      return arr[arr.length-1];
    } else return undefined
  }

  // Find requested page by (translated) url 
  static async findInitialURL() {
    let url = window.location.search;
    let pathFromURL = /^\?p=(.*)\+/;
    if(pathFromURL.test(url)) {
      // Find page (translated) url target
      let urlTarget = pathFromURL.exec(url)[1];
      // Find route and change page
      await window.NavBasic.isReady();
      for(let route of window.NavBasic.register.routes) {
        if(temp.get(route).variants.includes(urlTarget)) {
          Core.changePage("init", temp.get(route).ID);
          break;
        }
      }
    } else Core.changePage("init", window.siteData.homePage);
  }

  /**
   * 
   * @param {string} way it is the way that page will be change... init, normal, or history
   * @param {string} pageId 
   */
  static async changePage(way, pageId, urlPath) {

    try {
      
      if(!window.NavBasic.register.dataExist("pages", pageId))
        throw `No such page as ${pageId}`;

      let pData = temp.get( window.NavBasic.register.getData("pages", pageId) );

      /* Update title */
        try { 
          let space = String.fromCharCode(8211);
          let pageTitle = pData.title;
          let siteTitle;
          siteTitle = way === "init"
            ? Reflect.get(window.siteData, "title")
            : String (document.title).split(space)[0];
          document.title = pageTitle 
            ? `${siteTitle} ${space} ${pageTitle}`
            : siteTitle;
        } catch(e) { console.warn(`Cant update site title, ${e}`); }
      /***************************************************/

      /* Update content*/
        try {
          let body = window.NavBasic.register.getDOMref("mainBody");
          way === "init"
            ? body.appendChild(pData.vNode)
            : body.replaceChild(pData.vNode, body.firstElementChild);
          if(window.NavBasic.register.dataExist("other", "footers")) {
            let fData = temp.get( window.NavBasic.register.getData("other", "footers") );
            let foot  = window.NavBasic.register.getDOMref("mainFoot");
            let vNode = fData.cfg.templates[pData.css.mainFoot].vNode;
            way === "init"
              ? foot.appendChild(vNode)
              : foot.replaceChild(vNode, foot.firstElementChild);
          }
        } catch(e) { throw `While updating content, ${e}` }
      /***************************************************/

      /* Update CSS */
        try {
          let css  = {};
          temp.set(css, pData.css); 
          for(let[key, cssID] of Object.entries(temp.get(css))) {
            window.NavBasic.register.getDOMref(key)
              .setAttribute("css", cssID ? cssID : "default");
          }
        } catch(e) { throw `While updating CSS, ${e}`; } 
      /***************************************************/

      /* Update History */
      try {
       if(pData.url) {
        window.Language.translate("text", pData.lang, pData.url).then(function(urlTarget) {
          if(urlPath) {

          } else {

              history.pushState({
                lang: pData.lang, 
                url: pData.url,
                path: "."
              }, "", `./${urlTarget}`);
          
          }
        })
       }
      } catch(e) { throw `While updating History, ${e}`; } 
    /***************************************************/


      //console.log(pData);

    } catch(e) {
        console.group("Page cannot be changed");
        console.info("Page wasn't change");
        console.error(e);
        console.groupEnd();
    }

   

  }

}

// File ready
window.Build.scripts.ready = "core";