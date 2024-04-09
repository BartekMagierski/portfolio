/** Navigation and Pages basic build*/
class NavBasic {
	constructor() {
		this.modules = {
			state: {
				pages : false,
				navigation : false,
				other: false
			},
			set ready(id) {
				if(Reflect.has(this.state, id)) {
					this.state[id] = true;
				} else console.warn(`Navigation build doesn't wait for module ${id} to be build`);
			}
		}
		this.register = {
      pages: {},
      navs: {},
			other: {},
			routes: [],
			curentPageID: null,
			dataExist(group, id) {
				if(!(Reflect.has(this, group))) {
					console.warn(`No such group as ${group}`)
					return undefined;
				} else return Reflect.has(this[group], id);
			},
			saveData(group, data) {
				if(Reflect.has(this, group)) {
					this[group][data.id] = data;
				} else throw `No such group as ${group}`;
			},
			getData(group, id, flag) {
				try {

					if(group in this) {
						if(id in this[group]) {

							if(!Array.isArray(flag)) flag = [flag];

							let instance = {};
				
							temp.set(instance, Core.arrHas(flag, "CLONE")
								? structuredClone(this[group][id])
								: this[group][id]
							);

							return instance;

						} else throw `No such entity as ${id} in ${group} group`;
					} else throw `No such group as ${group}`;

				} catch(e) {
						console.error(e)
				}
			},
			/** head, main footer their wrapper*/
			initialblocks: {},
			getInitialblocks(ID) {
				if(ID in this.initialblocks) {;
					return this.initialblocks[ID];
				} else throw `DOM reference: ${ID} is missing`;
			}

    };	
	}

	/** Fetch configuration file */ 
	getNavData() {
		return Core.ajax("NavigationData",{
			address: MainPhp,
			options: {
				method: "GET"
			},
			values: {
				call: "GetNavData"
			}
		});
	}

	async init() {
		
		let dat = {};
		temp.set(dat, await this.getNavData());
		if(temp.get(dat).status === "success") {
			
			let navCfg = {};
			let pagCfg = {};
			let otherCfg = {};

			// Prepare Navigation
				if(temp.get(dat).data.nav !== null) {
					
				} else this.modules.ready = "navigation";
			// Prepare pages
				if(temp.get(dat).data.pages !== null) {
					try {
						temp.set(pagCfg, temp.get(dat).data.pages);
						await this.preparePages(pagCfg);
					} catch(er) { throw `Pages couldn't be built\n${er}`; }
				} else throw"There are no pages to create";
			// Prepare other
				if(temp.get(dat).data.other !== null) {
					try {
						temp.set(otherCfg, temp.get(dat).data.other.list);
						this.prepareOther(otherCfg);
					} catch(e) {
							console.group("Prepare other entries");
							console.warn("Additional content can't be built");
							console.error(e);
							console.groupEnd();
					}
				} else console.info("Site does not have additional content beside pages and navigation");

				// Content, Head, Main and Foot;
				
				this.register.initialblocks = temp.get(Core.findRef(document.body, false, false, "ref", true));
				
		} else throw "Something is wrong on the server side, " + temp.get(cfg).message;
	}

	/** Prepare navigation */
	prepareNav() {

	}

	/** Prepare pages */
	preparePages(pageCfg) {
		
		/* Creation of pages is asynchronous, so in order to inform class 
		that this module was finish built, first we have to wait till 
		all pages were process
		*/
		let numberOfPages = Reflect.ownKeys(temp.get(pageCfg).list).length;
		let pagesState = [];
		temp.set(pagesState, []);

		let wait = setInterval(() => {
			if(temp.get(pagesState).length === numberOfPages) {
				clearInterval(wait);
				this.modules.ready = "pages";
			}
		}, 50);

		// Proceed with pages creation
		Object.values(temp.get(pageCfg).list).filter(function(cfg) {
			try {
				if(!cfg || !cfg instanceof Object) 
					throw "Object structure is corrupted";
				else if(!Reflect.has(cfg, "lang")) 
					throw "Missing language";
				else if(!Reflect.has(cfg, "template"))
					throw "Missing template";
				else if(!Reflect.has(cfg, "extraCfg"))
					throw "Missing detailed configuration";
				else if(!Reflect.has(cfg, "url"))
					throw "Missing url";
				else if(!Reflect.has(cfg, "label"))
					throw "Missing label";
				else return true;
			} catch(err) {
					console.group("Basic navigation / prepare pages");
					console.info(`Page: ${cfg.id} wasn't build`);
					console.warn(`Creation of page with ID: "${cfg.id}" was skipped due to: ${err}`);
					return false;
			} finally { console.groupEnd(); }
		}).forEach(async (cfg) => {

        try {
				
					let 
						vNode = Core.makeNode(cfg.template),
						link  = document.createElement("p"),
						lang  = await window.Language.prepare(cfg.lang, false),
						refs  = Core.findRef(vNode, false, false, "ref", true); 
						
					let [label, title] = 
						await window.Language.translate("textArray", lang, [
							cfg.label, cfg.title
						], null);
					
					if(cfg.url) {
						let route = {};
						temp.set(route, {
							key: cfg.url,
							langPkg: lang,
							ID: cfg.id,
							variants: temp.get( window.Language.packages.getAllTranslations(lang, cfg.url) )
						})
						this.register.routes.push(route);
					}
					
					cfg.vNode = vNode;
					cfg.link  = link;
					cfg.label = label;
					cfg.title = title;
					cfg.lang  = lang;
					cfg.refs  = temp.get(refs);
					this.register.pages[cfg.id] = cfg;

					window.Language.translate("node", lang, vNode, null);
					temp.get(pagesState).push(true);

        } catch(err){
            console.group("Basic navigation / prepare pages");
            console.info(`Page: ${cfg.id} wasn't build`);
            console.warn(`Creation of page with ID: "${cfg.id}" was skipped`);
						console.error(err);
						temp.get(pagesState).push(false);
						console.groupEnd();
				} 
				
		});

	}

	/** Prepare other entites */
	prepareOther(otherCfg) {

		/* Creation of other entities might be asynchronous, so 
		in order to inform class that this module was finish built,
		first we have to wait till all entities were process
		*/
		let numberOfEntities = Reflect.ownKeys(temp.get(otherCfg)).length;
		let otherState = [];
		temp.set(otherState, []);

		let wait = setInterval(() => {
			if(temp.get(otherState).length === numberOfEntities) {
				clearInterval(wait);
				this.modules.ready = "other";
			}
		}, 50);

		Object.values(temp.get(otherCfg)).forEach(async (entityObj) => {

			try {
				if(entityObj.lang) entityObj.lang = await window.Language.prepare(entityObj.lang, false);
				if(!entityObj.skipInitial) {
					if(entityObj.template) {
						if(typeof entityObj.template === "string") {
							entityObj.vNode = Core.makeNode(entityObj.template);
							window.Language.translate("node", entityObj.lang, entityObj.vNode, false);
						}
					}
					if(entityObj.extended) {
						entityObj.cfg = extendedCreation(entityObj.cfg, entityObj.lang);
					}
				}
				
				this.register.saveData("other", entityObj);

			} catch(e) {
					console.group("Creation of other entity");
					console.info(`Entity id: ${entityObj.id}`);
					console.error(e);
					console.groupEnd();
			}
			
			temp.get(otherState).push(true);

		})

		function extendedCreation(cfg, langId) {
			let vNode, refs;
			if("templates" in cfg) {
				for(let [id, template] of Object.entries(cfg.templates)) {
					vNode = Core.makeNode(template);
					cfg.templates[id] = {
						vNode: vNode
					}
					window.Language.translate("node", langId, vNode, false); 
				}
			}

			return cfg;
			
		}
		
	}


	/** Is this class ready? */
	isReady() {
		
		return new Promise((success, failure) => {

			let wait, timeout, ready;

			wait = window.setInterval(() => {

				ready = Object.values(this.modules.state).every(function(prop) {
					return prop;
				});

				if(ready) {
					clearInterval(wait);
					clearTimeout(timeout);
					success();
				}

			}, 500);

			timeout = window.setTimeout(() => {
				alert()
				clearInterval(wait);
				failure("Time out, navigation wasn't build");
			}, 10000)

		});
	
	}

}

// File ready
window.Build.scripts.ready = "navBasic";