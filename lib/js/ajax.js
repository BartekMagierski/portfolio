//todo Rebuild
onmessage = async function(job) {

  const request = new Ajax(job.data);
  let response  = null;

  new Promise(function(success, failure) {
    response = request.call(success, failure);
  }).then( function(data) {
      const blob = new Blob([data], {
        type: "application/json",
      }); 
      postMessage(blob);
  }).catch(function(err) {
      throw new Error(err);
  });
}



class Ajax {

  constructor(cfgData) {
    this.cfg = cfgData;
  } 
  
  async call(success, failure) {

    const requestData = this.cfg;
    const method = requestData.options.method;
    const addr = requestData.address;
    let tmp, response;

    if(method === "GET") {

      // Build URL
      tmp = String(addr) + "?";
      for( let[key, val] of Object.entries(requestData.values) ){ tmp += `${key}=${val}&`; }
      // Remove last '&' char from ajax target url( '&' comes from request values concatenation )
      tmp = tmp.replace(/[&]$/, "");
      // Make call
      response = await fetch( tmp, requestData.options );

    } else if(method === "POST") {

        // Build request body
        tmp = new FormData();
        for( let[key, val] of Object.entries(requestData.values) ){ tmp.append(key, val); }
        // Set request body
        requestData.options.body = tmp;
        // Make call
        response = await fetch( addr, requestData.options );

    } else failure("Unsupported method");
    
    return success(response.text());

  }
}
