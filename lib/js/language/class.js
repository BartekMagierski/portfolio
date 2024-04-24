class Language {
	constructor(){
		this.currentLanguage = "pl";
		this.packages = {
			/** Ids of packages that was already built */
			ready: {},
			/** List of packagest */
			list:  {},
			getPackage(ID) {
				if(this.ready[ID]) {
					let x = {};
					temp.set(x, this.list[ID][this.currentLanguage()]);
					return x;
				} else throw `Package was processed, but its build failed`;
			},
			getAllTranslations(langID, translationID) {
				let instance = [];
				temp.set(instance, []);
				// For every language
				Object.values(this.list[langID]).forEach((pkg) => {
					// find requested key
					for(let[key, value] of Object.entries(pkg)) {
						if(key === translationID) {
							temp.get(instance).push(value);
						}
					}
				});
				return instance;
			},
			/** Refers to parent constructor */
			currentLanguage: () => { return this.currentLanguage; }
		};

		this.switchData = {
			super: () => { return this },
			activeClassID: "active",
			nodes: {},
			set activeBtn(ID) {
				if(ID in this.nodes) {
					Object.values(this.nodes).forEach( (node) => {
						node.classList.remove(this.activeClassID);
					});
					this.nodes[ID].classList.add(this.activeClassID)
				} else console.warn(`No such lang ID as: ${ID}`);
			},
			nodesToTranslate: {
				list: {},
				set add(instance) {
					try {

						if(!temp.has(instance) || !Array.isArray(temp.get(instance))) throw "Wrong instance";
						
						let[langID, pkgID, vNode] = temp.get(instance);
						if(!langID || typeof langID !== "string") throw "Parameter 'langID' is corrupted";
						if(!pkgID  || typeof pkgID !== "string") throw "Parameter 'pkgID' is corrupted";
						if(!vNode  || !vNode instanceof Element) throw "Parameter 'vNode' is corrupted";

						let token = Core.token(8);

						vNode.setAttribute("ii", token);
						this.list[token] = {
							id: token,
							pkg: pkgID,
							vNode: vNode,
							langID: langID
						};

					} catch(e) { console.warn(e); }
				},
				getItem(ID) {
					if(ID && ID in this.list) {
						let x = {};
						temp.set(x, this.list[ID]);
						return x;
					}
				},
				getList() {
					let x = {};
					temp.set(x, this.list);
					return x; 
				},
				clean(instanceID) {
					if(instanceID) {
						if(temp.has(instanceID)) {
							let textNodes = temp.get(instanceID);
							if(Array.isArray(textNodes)) {
								textNodes.forEach((ID) => {
									delete this.list[ID];
								});
								temp.delete(instanceID);
							}
						}
					}
				}
			},
		};

	}


	/**
	 * Make object from raw package string
	 * @param {String} data Language string (raw) 
	 * @param {Array} promise 0=> success 1=> failure
	 * @param {*} flag
	 * @param {String} info Info about what calls function(for debug) 
	 * @returns {String} package ID
	 * 
	 * Flags:
	 * RETURN_NOW
	 */
	prepare(data, flag, info) {

		if(!Array.isArray(flag)) flag = [flag];
		let init = functionBody.bind(this); 
		let id = Core.token(5);
		
		if(Core.arrHas(flag, "RETURN_NOW")) {

				init();
				return id;

		} else {

				return new Promise(function(success, failure) {
					init(success, failure);
				})

		}

    async function functionBody(success, failure) {

			let worker = await workers.requestSlot("LangBlobURL");
				
      worker.postMessage(data);
      worker.onmessage = async (response) => { 

        workers.releseSlot(worker);
        this.packages.list[id] = JSON.parse( await response.data.text() )
				this.packages.ready[id] = true;
				if(info) console.info(`Language package "${info}" was prepared as ${id}`);
				if(!(Core.arrHas(flag, "RETURN_NOW"))) success(id);
				
			};

      worker.onerror = function(response) { 
        SC.workers.releseSlot(worker);
				this.package.ready[id] = undefined;
				if(!(Core.arrHas(flag, "RETURN_NOW"))) failure(response)
      }

    }

	}

	/**
	 * @param {String} mode What to translate: text || textArray || node 
	 * @param {String} pkgId Id of package with translation keys 
	 * @param {*} param Parameter for function from mode
	 * @param {Array} promise 0=> success 1=> failure
	 */
	 translate(mode, pkgId, param){

		let pkg = {},
		response,
		getText = t.bind(this),
		translateNode = tn.bind(this);

		return new Promise((resolve, reject) => {

			Core.watch(this.packages.ready, pkgId).then( () => {

				pkg = this.packages.getPackage(pkgId);
				
				switch(mode){
					case "text": 
						response = getText(param); 
						break;
					case "node": 
						response = translateNode(param); 
						break;
					case "textArray": 
						// Translate text from array
						if(Array.isArray(param)) { 
							response = param.map(function(key) {
								return key ? getText(key) : undefined;
							});
						} else throw "When called for array translation, parameter has to be also an array";
					break;
					default: throw `No such function as: ${mode}`;
				}
				
				resolve(response);
	
			}).catch(function(e) {
	
					console.group("Translate");
					console.warn(`Can't translate form package: ${pkgId}`);
					console.error(e);
					console.groupEnd();
					reject(mode === "text" ? "undefined" : undefined);
	
			})

		});
		 
		
		/** Wait for package to be prepared */
		function w() {
			return Core.wait(this.packages.ready, pkgId);
		}
		/** Translate text */
		function t(strId) {
			if(!(strId in temp.get(pkg))) {
				console.warn(`No translation for node ${strId} in ${pkgId}`);
				return "Undefined lang ID";
			} else return temp.get(pkg)[strId];
		}
		/** Translate node */
		function tn(vNode) {

			let langCode;
			let refs = Core.findRef(vNode, true, false, "trn", false); 
			
			/**Instance to safe for translations */
			let nodeInstance = [];

			for(let vNode of temp.get(refs)) {
				try {
					langCode = vNode.getAttribute("trn");	

					if(langCode in temp.get(pkg)) {

						vNode.innerHTML = temp.get(pkg)[langCode];
						temp.set(nodeInstance, [langCode, pkgId, vNode])
						this.switchData.nodesToTranslate.add = nodeInstance;
					
					} else throw `No translation for node ${langCode} in ${pkgId}`;
				} catch(e) {
						console.warn(e);
						continue;
				}
			}
		}

	}

	/** Build and append language switch to DOM
	 * @returns {boolean}
	 */
	initSwitch() { 

		try {

			if(!("languageSwitch" in window.Build.storage)) throw "Can't create language switch, his data is missing";

			let data = temp.get( window.Build.storage.languageSwitch );
			delete window.Build.storage.languageSwitch;

			let vNode, refs, fragment;

			fragment = document.createDocumentFragment();
			vNode = Core.makeNode(data.html);
			refs  = Core.findRef(vNode, false, false, "ref", true);
			
			let opt_vNode, opt_vNodeWrapper;
			let optProt_vNode = document.createElement("button"); 
			let optProt_vNodeWrapper = document.createElement("div");

			window.siteData.availableLanguages.forEach( (language) => {
				
				opt_vNode = optProt_vNode.cloneNode();
				opt_vNode.innerHTML = language.label;
				opt_vNode.setAttribute("langid", language.id);

				opt_vNodeWrapper = optProt_vNodeWrapper.cloneNode();
				opt_vNodeWrapper.appendChild(opt_vNode);

				temp.get(refs).list.appendChild(opt_vNodeWrapper);
				this.switchData.nodes[language.id] = opt_vNode;
			
			});

			document.body.prepend(vNode);
		
			temp.get(refs).list.addEventListener("click", (event) => {
				let target = event.target;

				if(target.localName === "button" && target.hasAttribute("langid")) {
					let langID = target.getAttribute("langid");
					this.switchLanguage(langID);
					this.switchData.activeBtn = langID;
				}

			});
			this.switchData.nodes[window.siteData.defaultLanguage].click();

			return true;
			
		} catch(e) {
				console.group("Language switch");
				console.error(e)
				console.groupEnd();
				return false;
		}

	}


	/**
	 * @param {String} langID
	 * @returns {boolean}
	 */
	switchLanguage(langID) {
		
		this.currentLanguage = langID;
		
		let instances = this.switchData.nodesToTranslate.getList();
		let pkg;

		Object.values(temp.get(instances)).forEach( (instance) => {
			pkg = this.packages.getPackage(instance.pkg);
			if(instance.langID in temp.get(pkg)) {
				instance.vNode.innerHTML = temp.get(pkg)[instance.langID];
			} else console.warn(`Missing translation for ${instance.langID} in ${instance.pkg} on ${instance.id}`)
		})

		// Translate url
		if(history.state ) {
			let lang =  history.state.lang;
			let url  =  history.state.url;
			let path =  history.state.path;
			this.translate("text", lang, url).then(function(urlTarget) {
				history.replaceState(history.state, "", `${path}/${urlTarget}`);
			});
		}
		

		temp.delete(pkg);
		temp.delete(instances);

		return true;

	}

}

// File ready
window.Build.scripts.ready = "language";