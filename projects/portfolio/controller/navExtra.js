// This is a script dedicated to page / it is custom
class NavExtra {
  constructor() {
    this.register = {
      storage: {},
      instances: {
        list: {},
        set instance(key) {
          if(key) {
            this.list[key[0]] = key[1];
          } else console.warn("missing key pair");
        },
        getInstance(id) {
          if(id) {
            if(this.exist(id)) {
              return this.list[id];
            } else console.warn("There is no such instance");
          } else console.warn("missing instance ID");
        },
        exist(id) {
          if(id) {
            return id in this.list;
          } else console.warn("missing instance ID");
        }
      },
      socialLinks: {
        fromBannerForm: {
          facebook: null,
          linkedin: null,
        }
      }
    }
  }

  
  /** Setup trigger for... popup contact form from main banner */
  async setupBannerForm() {
    await window.NavBasic.isReady();
    // Setup trigger window
    if(window.NavBasic.register.dataExist("pages", "main")) {
      let pData = window.NavBasic.register.getData("pages", "main");
      temp.get(pData).refs.formTrigger.addEventListener("click", () => {
        this.initBannerForm();
      });
    };
  }

  /** When the user triggered the popup contact form from main banner */
  async initBannerForm() {
    try {

      if(!window.NavBasic.register.dataExist("other", "bannerform_popup")) throw "missing window data";

      let createWhatsappWindow = cww.bind(this);
      let socialRedirectionEvent = sre.bind(this);
      let windowData = await getPopupInstance();

      // If form was already built, fetch him instead of creating new
      if(this.register.instances.exist("initBannerForm")) {

        let fInstanceID = this.register.instances.getInstance("initBannerForm");
        // If such form instance exist
        if(window.Form.register.isForm(fInstanceID)) {
          // Add form instance to appropriate window container
          let fData = window.Form.register.getForm(fInstanceID);
          windowData.formBox.appendChild( temp.get(fData).vNode );
          console.info("Form instance was fetched from cache");
        } else throw "Something went wrong, form instance was registered, but can't fetch her";

      } else {

          // Create new form
          let fData = await window.Form.prepare("form");
          let formNode = temp.get(fData).vNode;
          let formRef = Core.findRef(formNode, false, false, "ref", true);
          // Add node to popup instance
          windowData.formBox.appendChild(formNode);
          // Save social links for later( for redirect )
          this.register.socialLinks.fromBannerForm.facebook = windowData.social.facebook
          this.register.socialLinks.fromBannerForm.linkedin = windowData.social.linkedin
          // Assign redirection event
          temp.get(formRef).social.addEventListener("click", socialRedirectionEvent, true);
          // Save form instance ID
          this.register.instances.instance = ["initBannerForm", temp.get(fData).instanceID];
      
      }

      window.Popup.mount(windowData.vNode, windowData.closeBtn, "bannerForm");

      async function getPopupInstance() {
        let pData = window.NavBasic.register.getData("other", "bannerform_popup", ["CLONE"]);
        let vNode = Core.makeNode( temp.get(pData).template );
        let refs  = Core.findRef(vNode, false, false, "ref", true);
        let langID = temp.get(pData).lang;
        await window.Language.translate("node", langID, vNode);
        return {
          vNode: vNode,
          formBox: temp.get(refs).form,
          closeBtn: temp.get(refs).close,
          social: temp.get(pData).cfg.social
        }
      }
      /** Cerate whatsapp window*/
      function cww() {
        if(window.NavBasic.register.dataExist("other", "myWhatsapp")) {
          let pData = window.NavBasic.register.getData("other", "myWhatsapp", ["CLONE"]);
          let vNode = Core.makeNode( temp.get(pData).template );
          let refs  = Core.findRef(vNode, false, false, "ref", true);
          let langID = temp.get(pData).lang;
          let closeBtn = temp.get(refs).close;
          window.Language.translate("node", langID, vNode).then(function() {
            window.Popup.mount(vNode, closeBtn, "myWhatsapp");
          })
        } else { console.warn("Whatsapp enitity is missing"); }
      }
      /** Social redirection event */
      function sre(event) {
        let target = event.target;
        if(target.localName === "img" && target.hasAttribute("target")) {
          let socialID = target.getAttribute("target");
          if(socialID in this.register.socialLinks.fromBannerForm) {
            // Facebook and linkedin redirect
            let link = this.register.socialLinks.fromBannerForm[socialID];
            window.open(link, '_blank');
          } else if(socialID === "whatsapp") {
              // Whatsapp is in popup
              createWhatsappWindow();
          } else console.warn(`Social link: ${socialID}, is missing in app cache`);
        }
      }
      
    } catch(e) {
        console.group("initBannerForm");
        console.info("During initializing contact form from main banner in popup");
        console.error(e);
        console.groupEnd();
    }
    
  }



}


class Portfolio extends NavExtra {
  constructor() {
    super();
    this.storage = {};
  }

  init() {
    try {

      if(window.NavBasic.register.dataExist("pages", "main")) {
        if(window.NavBasic.register.dataExist("other", "portfolio")) {
          
          let pData = window.NavBasic.register.getData("other", "portfolio");
          let container = temp.get(window.NavBasic.register.getData("pages", "main")).refs.pList;
          
          let projects = this.prepareNodes(pData, container);

          Object.values(projects).forEach(function (project) {
            container.appendChild(project.vNode);
          });

        } else throw "Entity 'portfolio' wasn't build"
      }
      
    } catch(e) {
        console.group("Portfolio initialization");
        console.error(e);
        console.groupEnd();
    }
  }

  prepareNodes(entityObj, container) {

    let cfg = temp.get(entityObj).cfg;
    let lang = temp.get(entityObj).lang;
    let vNode, refs;
    let projects = {};
    temp.set(projects, {});
    
    cfg.list.filter(function(project) {
      if(!project.template in cfg.templates) {
        console.warn(`Portfolio config error, ${project.id} project's template doesn't have prototype`);
        return false;
      } else return true;
    }).forEach( async (project) => {
    
        vNode = cfg.templates[project.template].vNode;
        refs  = temp.get(Core.findRef(vNode, false, false, "ref", true));
        project["vNode"] = vNode;
        project["refs"]  = refs;
        refs.title.setAttribute("trn", project.cfg.title);
        refs.go.setAttribute("go", project.cfg.href);  
        refs.poster.setAttribute("src", project.cfg.poster)
        temp.get(projects)[project.id] = project; 
        window.Language.translate("node", lang, vNode);
    
      });

    container.addEventListener("click", function(event) {
      let target = event.target;
      if(target.localName === "button" && target.hasAttribute("go")) {
        let link = target.getAttribute("go");
        window.open(link, '_blank');
      }
    });

    return temp.get(projects);

  }

}
