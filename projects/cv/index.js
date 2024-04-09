(async function(){

  Reflect.set(window, "Build", new Build());
  await window.Build.init();
  await window.NavBasic.isReady();

  Core.findInitialURL();
  Core.rmoInitialLoader();

})();



