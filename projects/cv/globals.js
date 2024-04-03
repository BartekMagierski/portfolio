const temp = new WeakMap();
const addr = location.host.split(":")[0];
const protocol = location.protocol;
const port = location.port;

const Host = location.origin;
const MainPhp = `${Host}/model/main.php`;
