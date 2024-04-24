onmessage = async function(job) {

  const temp = new WeakMap();
  
  /** Package containing language string, directly from file */
  let package = String(job.data);
      package = package.match(/(?=\{II_\w{2,3}\}\n).*\n(\s*\w{10}\s*\[II_BEG\].*)*/g);
  /** Weak object that contains processed package */
  let langObj = {};
  let langID;
  let keyPairs;
  let keys;
  temp.set(langObj, {});
  
  package.forEach(function(langSet){
    try {
      // Split language set on id and raw keys pairs
      langSet = langSet.replace(/\{II_\w{2,3}\}/g, function(rawLangID, capture) {
        langID = rawLangID.match(/(?<=II_)\w{2,3}/)[0];
        temp.get(langObj)[langID] = {};
        return "";
      });
      // Process raw key pairs(make them object's properties ) 
      keyPairs = langSet.match(/\n*\s*(\w{10})\s*\[II_BEG\]\s*(.*)?\n*/g);
      for(let pair of keyPairs) {
        keys = pair.split("[II_BEG]");
        temp.get(langObj)[langID][keys[0].trim()] = keys[1].trim(); 
      }
    } catch(e) {
        console.group("Language worker")
          console.info("While package preparation");
          console.error(e);
        console.groupEnd();
    }
  });
  
  const blob = new Blob([JSON.stringify( temp.get(langObj) )], {
    type: "application/json",
  });

  postMessage(blob);

}