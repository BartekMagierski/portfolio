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

						console.group("Nav basic register, get data");
						console.error(e)
						console.groupEnd();
				
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
			address: `${Protocol}${Host}:${Port}/${MainPhp}`,
			options: {
				method: "GET"
			},
			values: {
				call: "GetNavData"
			}
		});
	}

	async init() {
		
		this.register.initialblocks = temp.get(Core.findRef(document.body, false, false, "ref", true));

		let dat = {};
		temp.set(dat, await this.getNavData());
		if(temp.get(dat).status === "success") {
			
			let navCfg = {};
			let pagCfg = {};
			let otherCfg = {};

			temp.set(pagCfg, temp.get(dat).data.pages);
			temp.set(otherCfg, temp.get(dat).data.other.list);

			if(temp.get(dat).data.pages === null) new Error("There are no pages to create, and at least one is required");

			this.preparePages(pagCfg);
			this.prepareOther(otherCfg);

			// Prepare Navigation
			if(temp.get(dat).data.nav !== null) {
				
			} else this.modules.ready = "navigation";
				
		} else throw "Something is wrong on the server side, " + temp.get(cfg).message;
	}

	/** Prepare navigation */
	prepareNav() {

	}

	/** Prepare pages entities */
	preparePages(pageCfg) {

		// Set creation state observer
		let createdEntities = [];
		temp.set(createdEntities, []);
		let numberOfEntitiesToCreate = Reflect.ownKeys(temp.get(pageCfg).list).length;
		this.isEntityReady(createdEntities, numberOfEntitiesToCreate, "pages");

		// Proceed with pages creation
		Object.values(temp.get(pageCfg).list).filter(function(cfg, index) {
			
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

					// Build of that page failed, but rest of pages might be ok, so don't break the process
					console.group("Building pages in Nav basic");
					console.warn(`Creation of page with ID: "${cfg.id}" was skipped due to: ${err}`);
					temp.get(createdEntities).push(true);
					return false;

			} finally { console.groupEnd(); }

		}).forEach((cfg) => {

				cfg.vNode = Core.makeNode(cfg.template);
				cfg.link  = document.createElement("p")
				cfg.refs  = temp.get(Core.findRef(cfg.vNode, false, false, "ref", true));

				window.Language.prepare(cfg.lang, false).then((langID) => {
					window.Language.translate("textArray", langID, [cfg.label, cfg.title], null).then((res) => {
						cfg.lang = langID;
						cfg.label = res[0];
						cfg.title = res[1];
						if(cfg.url) {
							let route = {};
							temp.set(route, {
								key: cfg.url,
								langPkg: cfg.lang,
								ID: cfg.id,
								variants: temp.get( window.Language.packages.getAllTranslations(cfg.lang, cfg.url) )
							})
							this.register.routes.push(route);
						}
						this.register.pages[cfg.id] = cfg;
						temp.get(createdEntities).push(true);
					});
					window.Language.translate("node", langID, cfg.vNode, null);
				});
				
		});

	}

	/** Prepare other entites */
	prepareOther(otherCfg) {

		// Set creation state observer
		let createdEntities = [];
		temp.set(createdEntities, []);
		let numberOfEntitiesToCreate = Reflect.ownKeys(temp.get(otherCfg)).length;
		this.isEntityReady(createdEntities, numberOfEntitiesToCreate, "other");

		// Proceed with creation of others
		Object.values(temp.get(otherCfg)).forEach((entityObj) => {

			if(entityObj.lang) entityObj.lang = window.Language.prepare(entityObj.lang,"RETURN_NOW");

			if(entityObj.skipInitial) {
				this.register.saveData("other", entityObj);
				temp.get(createdEntities).push(true);
				return true;
			}

			if(entityObj.template) {
				entityObj.vNode = Core.makeNode(entityObj.template);
				if(entityObj.lang) {
					window.Language.translate("node", entityObj.lang, entityObj.vNode);
				}
			}
			
			if(entityObj.extended) entityObj.cfg = extendedCreation(entityObj.cfg, entityObj.lang);
				
			this.register.saveData("other", entityObj);
			temp.get(createdEntities).push(true);

		});

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


	/** Creation of entity might be asynchronous, so 
	*	in order to inform class that this module was finish built,
	*	first we have to wait till all entities were process
	*
	* @param {WeakMap} entityState Array containing states
	* @param {Number}  numberOfEntitiesToCreate 
	* @param {String} moduleID
	*
	*/
	isEntityReady(entityState, numberOfEntitiesToCreate, moduleID) {
		let wait = window.setInterval(() => {
			if( temp.get(entityState).length === numberOfEntitiesToCreate) {
				clearInterval(wait);
				this.modules.ready = moduleID;
			}
		}, 50);
		return true;
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
				clearInterval(wait);
				failure("Time out, Nav basic wasn't build");
			}, 10000)

		});
	
	}

}

// File ready
window.Build.scripts.ready = "navBasic";