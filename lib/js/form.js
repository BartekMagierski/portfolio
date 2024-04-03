class Form {
  constructor() {
    this.register = {
      list: {},
      isForm(fID) {
        if(fID) {
          return Reflect.has(this.list, fID);
        } else throw "Calling without of parameter";
      },
      getForm(fInstanceID) {
        if(fInstanceID) {
          if(this.isForm(fInstanceID)) {
            let x = {};
            temp.set(x, this.list[fInstanceID]);
            return x;
          } else throw `nNo such form as ${fInstanceID}`;
        } else throw "Getting without of parameter";
      },
      saveForm(fObj) {
        if(fObj && fObj.instanceID) {
          if(!this.isForm(fObj.instanceID)){
            return Reflect.set(this.list, fObj.instanceID, fObj);
          } else throw `Something went wrong, form id ${fObj.instanceID} is already in use`;
        } else throw "Saving without of parameter";
      },
      clearForm(fInstanceID) {
        if(fInstanceID) {
          if(this.isForm(fInstanceID)) {
            let fData  = temp.get(this.getForm(fInstanceID));
            let fields = temp.get(fData.fields); 
            fields.forEach(function(field) {
              field.value = "";
            });
            return true;
          } else console.warn(`No such form as ${fInstanceID}`);
        } else throw "Calling 'form clean', without of parameter";
      }
    }
    this.pattern = {
      text: /\D+/,
      mail: /\w+[^\^ #$%&*!{}[\]\(\)]\@\w+\.\w{2,3}/,
      phone: /(\d{9})|(\d{3}\s*\d{3}\s*\d{3})|(\d{3}\s*\-\s*\d{3}\s*\-\s*\d{3})/
    }
  }

  async prepare(fID) {
    try {
      
      await window.NavBasic.isReady();

      if(window.NavBasic.register.dataExist("other", fID)) {
        
        let fInstanceID = Core.token(3);
        let data = temp.get(window.NavBasic.register.getData("other", fID));
        let ref = temp.get( Core.findRef(data.vNode, false, false, "form", false) );
        let fields = Core.findRef(data.vNode, true, false, "field", true);

        ref.submit.addEventListener("click", () => { this.submit(fInstanceID) }, true);
        
        // Save instance
        data.instanceID = fInstanceID;
        data.fields = fields;
        data.submitBtn = ref.submit;
        if(!this.register.saveForm(data)) throw "Something went wrong, form wasn't saved";
        // Return instance
        return this.register.getForm(fInstanceID);

      } else throw `No such form as ${fID}`;
      
    } catch(e) {
        console.group("Prepare form");
        console.info(`Form id: ${fID}`);
        console.error(e);
        console.groupEnd();
        return undefined;
    }
  }

  submit(fInstanceID) {
    try {
      if(this.register.isForm(fInstanceID)) {
        
        let 
         fData = temp.get( this.register.getForm(fInstanceID) ),
         fields = temp.get(fData.fields),
         /** Id of alert box may differ, so... it is kept in domain config */ 
         alertBoxId = window.siteData.alertBoxId,
         isValid = this.validate(fields);
        
        fData.submitBtn.setAttribute("disabled", true);

        if(isValid) {

          this.sendForm(fields).then((response) => {
            mountWindow(response.data); 
            this.register.clearForm(fInstanceID);
          }).catch(function(response) { mountWindow(response.message); });

        } else mountWindow(fData.cfg.regexpFailMsg);

        function mountWindow(messageCode) {

          if(window.NavBasic.register.dataExist("other", alertBoxId)) {
            
            let wData = window.NavBasic.register.getData("other", alertBoxId, ["CLONE"]);
            let vNode = Core.makeNode( temp.get(wData).template );
            let refs = Core.findRef(vNode, false, false, "ref", true);
            let langID = temp.get(wData).lang;
            temp.get(refs).message.setAttribute("trn", messageCode);
            
            window.Language.translate("node", langID, vNode).then( function() {
              window.Popup.mount(vNode, temp.get(refs).close, alertBoxId, popupStateFunc(), fData.submitBtn, "IN_BOX");
            })
                    
          } else console.error(`Missing entity for ${alertBoxId}`);

          function popupStateFunc() {
            let obj = {};
            temp.set(obj, {
              afterUnmount(wID, submitFormBtn) {
                submitFormBtn.removeAttribute("disabled");
              }
            });
            return obj;
          }

        }

      } else throw "Something went wrong, form instance wasn't store in app cache";
    } catch(e) {
        console.group("Submit form");
        console.info(`Form instance id: ${fInstanceID}`);
        console.error(e);
        console.groupEnd();
    }
  }

  validate(fields) {

    let fieldType;
    let incorrectFieldStyle = "fail";
    let isValid = true;

    for(let field of fields) {
      if(field.hasAttribute("type") && field.hasAttribute("req")) {
        fieldType = field.getAttribute("type");            
        if(fieldType in this.pattern) {
          if(this.pattern[fieldType].test(field.value)) {
            if(Array.from(field.classList).includes(incorrectFieldStyle))
              field.classList.remove(incorrectFieldStyle);
          } else {
              field.classList.add(incorrectFieldStyle);
              isValid = false;
          }
        } else console.warn(`No pattern for field with type ${type}`);
      }
    }

    return isValid;

  }

  sendForm(fields) {
    
    let form = { call: "SendContactForm" };
    fields.forEach(function(field) { form[field.id] = field.value; });
    
    return Core.ajax("Contact form",{
      address: MainPhp,
      options: { method: "POST" },
      values: form
    })

  }

}


// File ready
window.Build.scripts.ready = "form";