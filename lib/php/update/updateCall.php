<?php

$GLOBALS['parentPath'] =  $_SERVER['SERVER_ADDR'].':80';
$GLOBALS['basePath']   = $_SERVER['SERVER_ADDR'].$_SERVER['SERVER_PORT'];

include_once '../requests.php';
include_once '../core.php';


class UpdateException extends Exception { }

try {
  if(isset($_POST['update']) && isset($_POST['key']) && isset($_POST['mode'])) {
    if(!empty($_POST['key']) && !empty($_POST['mode'])) {
      $key = "FqGJ,>:)-p{9Ro2}|*l[wv-nmjE*q8MC<d;1h]j%FgmN@}1G_7";
      if($_POST['key'] === $key) {
        include_once './updateBody.php';
        switch ($_POST['mode']) {
          case 'coreFiles':
            // Update client side request for shared library
            fetchInitialLibs();
          break;
          case 'self': 
            // Update the file with update initialization (this file)
            selfUpdate();
          break;
          default:
            throw new UpdateException("Unrecognized mode");
            break;
        }
      }
    } else throw new UpdateException("Wrong parameter"); 
  } else throw new UpdateException("Wrong request"); 

} catch(UpdateException $e) { die("Can't update: ".$e->getMessage()); }

echo 'Update succeeded'. PHP_EOL;

?>