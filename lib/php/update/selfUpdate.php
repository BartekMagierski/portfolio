<?php

$GLOBALS['parentPath'] =  $_SERVER['SERVER_ADDR'].':80';
$GLOBALS['basePath']   = $_SERVER['SERVER_ADDR'].$_SERVER['SERVER_PORT'];

  include_once '../requests.php';
  include_once '../core.php';

  class SelfUpdateException extends Exception { }
  class UpdateException extends Exception { }

  try {

    $updateCall = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'updateCall',
        'key'    => 5683
      )
    );

    $updateBody = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'updateBody',
        'key'    => 3645
      )
    );

  } catch(RequestException $e) { echo 'Self update fail, reason: Request exception '. $e->getMessage(); }

  try {

    $file = fopen('./updateCall.php', 'w') or die("Unable to open update call file!");
    fwrite($file, $updateCall);
    fclose($file);

    $file = fopen('./updateBody.php', 'w') or die("Unable to open update body file!");
    fwrite($file, $updateBody);
    fclose($file);

  } catch(FileException $e) { echo 'Self update fail, reason: File exception '. $e->getMessage(); }

  echo 'Self update succeeded'. PHP_EOL;
  
  include_once './updateBody.php';
  afterSelfUpdate();

?>