
class Build {
	constructor() {

		this.storage = {};
		this.scripts = {
			state: {
				core: false,
				navBasic: false,
				language: false,
				popup: false,
				form: false
			},
			set ready(id) {
				if(Reflect.has(this.state, id)) {
					this.state[id] = true;
				} else console.warn(`Initial build doesn't wait for Script ${id} to be loaded`);
			},
			isReady(ID) {
				if(ID in this.scripts) {
					return this.scripts[ID];
				} else throw "No such script";
			}
		}

	}

	/** Fetch scripts and make blobs */
	async init() {

		/* Main scripts wasn't loaded yet, so need to use generic xhr */
		function get(ID, inCoreShare) {	
			let call = inCoreShare ? `callCore=${ID}`:`call=${ID}`;
			return new Promise(function(res, rej){
				let req = new XMLHttpRequest();
				req.addEventListener("load", reqListener);
				req.open("GET", `${MainPhp}?${call}`);
				req.send();
				function reqListener() {
					let response = JSON.parse(this.responseText);
					if(response && response.status === "success") {
						res(response.data)
					} else rej(response.message);
				}
			});
		}

		get("GetSiteData").then( function(siteData) {
			Reflect.set(window, "siteData", siteData);
			document.body.setAttribute("lang", siteData.defaultLanguage);
		})

		function Requests(ID, name) {
			this.callID = ID;
			this.callName = name;
		}

		[

			new Requests("GetCore"      , "core"     ),
			new Requests("GetForm"      , "form"     ),
			new Requests("GetPopup"     , "popup"    ),
			new Requests("GetBasicNav"  , "navBasic" ),
			new Requests("GetAjaxWorker", "AjaxBlobURL" ),	

		].forEach( (request) => {

				let blob, urlObj;
				get(request.callID, true).then((responseData) => {
					blob = new Blob([responseData], {type: 'text/javascript'});
					urlObj = URL.createObjectURL(blob);
					
					// Ajax worker doesn't need to be loaded into DOM, just save his url
					if(request.callID !== "GetAjaxWorker") {

						let script = document.createElement("script");
						script.setAttribute("src", urlObj);
						script.setAttribute("type", "text/javascript");
						document.head.append(script);

						this.scripts.isReady = request.callName;

					} else Reflect.set(window, request.callName, urlObj);

				}).catch(function(e){

						console.group("Build");
						console.info(`While "${request.callName}" was fetched`);
						console.error(e);
						console.groupEnd();

				});
					
		});

		// Language entity is a bit different so create it and define it outside the loop
		get("Language", true).then( (langData) => {

			let blob, urlObj;

			blob = new Blob([langData.class], {type: 'text/javascript'});
			urlObj = URL.createObjectURL(blob);

			let script = document.createElement("script");
			script.setAttribute("src", urlObj);
			script.setAttribute("type", "text/javascript");
			document.head.append(script);
			
			blob = new Blob([langData.worker], {type: 'text/javascript'});
			urlObj = URL.createObjectURL(blob);
			Reflect.set(window, "LangBlobURL", urlObj);

			// Save for later, because it's async and class "Language" wasn't loaded jet
			let languageSwitch = {};
			temp.set(languageSwitch, {
				html: langData.html
			});
			this.storage['languageSwitch'] = languageSwitch;

		}).catch(function(e){

				console.group("Build");
				console.info("While language was fetched");
				console.error(e);
				console.groupEnd();

		});

		await this.waitForScriptsToLoad();

		Reflect.set(window, "Form", new Form());
    Reflect.set(window, "Popup", new Popup());
		Reflect.set(window, "Language", new Language());
		Reflect.set(window, "NavExtra", new NavExtra());
		Reflect.set(window, "NavBasic", new NavBasic());

		window.NavBasic.init();
		window.Language.initSwitch();

		let DOMref = Core.findRef(document.body, false, false, "ref", true);
    window.NavBasic.register.DOMref = temp.get(DOMref);		

	}


	waitForScriptsToLoad() {
		return new Promise((success, failure) => {

			let wait, timeout, ready;

			wait = window.setInterval(() => {

				ready = Object.values(this.scripts.state).every(function(prop) {
					return prop;
				});

				if(ready) {
					clearInterval(wait);
					clearTimeout(timeout);
					success();
				}

			}, 50);

			timeout = window.setTimeout(() => {
				clearInterval(wait);
				failure("Time out, navigation wasn't build");
			}, 5000)

		});
	}

}

