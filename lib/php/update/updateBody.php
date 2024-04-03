<?php 
/** Fetch core libs */
function fetchInitialLibs() {
  
  try {

    // That file is for php to create web requests
    $requests = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'requestsLib',
        'key'    => 673
      )
    );
    // That file contains common functions
    $core = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'coreLib',
        'key'    => 33
      )
    );
    // That file contains requests definitions for shared libraries
    $share = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'clientShare',
        'key'    => 2891
      )
    );
    // That file contains JS initial build
    $jsBuild = Request::getSharedFile( 
      array (
        'secret' => 22,
        'return' => 'base64',
        'fetch'  => 'jsBuild',
        'key'    => 2881
      )
    );
    // That file contains functions custom for project
    if(!is_file('../../controller/navExtra.js')) {
      $navExtra = Request::getSharedFile( 
        array (
          'secret' => 22,
          'return' => 'base64',
          'fetch'  => 'navExtra',
          'key'    => 18
        )
      );
    }
  } catch(RequestException $e) {
      throw new UpdateException("Installation failed, reason Request: ".$e->getMessage());
  }
  

  try {

    $file = fopen('../requests.php', 'w') or die("Unable to open file!");
    fwrite($file, $requests);
    fclose($file); 

    $file = fopen('../core.php', 'w') or die("Unable to open file!");
    fwrite($file, $core);
    fclose($file); 

    $file = fopen('../sharedLibs.php', 'w') or die("Unable to open file!");
    fwrite($file, $share);
    fclose($file); 
  
    $file = fopen('../build.js', 'w') or die("Unable to open file!");
    fwrite($file, $jsBuild);
    fclose($file);

    if(!is_file('../../controller/navExtra.js')) {
      $file = fopen('../../controller/navExtra.js', 'w') or die("Unable to open file!");
      fwrite($file, $navExtra);
      fclose($file);
      chmod("../../controller/navExtra.js", 774);
      chown("../../controller/navExtra.js", 'bartek');
    }

  } catch(FileException) {
      throw new UpdateException("Installation failed, reason File: ".$e->getMessage());
  }

  return TRUE;
    
}

function selfUpdate() {

  /* This is temporary file which is needed in order to update
   because, we can't modify file that is in use */
 
  $tmp = Request::getSharedFile( 
    array (
      'secret' => 22,
      'return' => 'base64',
      'fetch'  => 'selfUpdate',
      'key'    => 556
    )
  );

  $file = fopen('./temp.php', 'w') or die("Unable to open file!");
  fwrite($file, $tmp);
  fclose($file); 

  header('Location: '. "./temp.php");

}

function afterSelfUpdate() {

  try {
    fetchInitialLibs();
    echo 'Self update succeeded, with no error'. PHP_EOL;
  } catch(UpdateException $e) {
      echo 'Self update succeeded, with following errors'.PHP_EOL.$e->getMessage().PHP_EOL;
  } finally { unlink('./temp.php'); }
  
}


?>