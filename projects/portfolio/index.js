(async function(){
  
  Reflect.set(window, "Build", new Build());
  await window.Build.init()
  await window.NavBasic.isReady();

  

  window.NavExtra.setupBannerForm();

  Reflect.set(window, "Portfolio", new Portfolio());
  window.Portfolio.init();

  Core.findInitialURL();
  Core.rmoInitialLoader();

})();
