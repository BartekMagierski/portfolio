<?php
header('Access-Control-Allow-Origin:'.$_SERVER['SERVER_ADDR'].$_SERVER['SERVER_PORT']);
$GLOBALS['parentPath'] = $_SERVER['SERVER_ADDR'].':80';
$GLOBALS['basePath']   = $_SERVER['SERVER_ADDR'].$_SERVER['SERVER_PORT'];
$response;

$update = true;

include_once './core.php';
include_once './requests.php';
include_once './sharedLibs.php';

if(isset($_GET) && !empty($_GET) && $_GET['call']) {
  switch($_GET['call']) {
    
    case 'GetSiteData':

      if(is_file('./json/siteData.json')) {
        try {
          $file = new File();
          $siteData = json_decode($file->read('./json/siteData.json', NULL));
          response('success', $siteData, FALSE);
        } catch(FileException $e){ response('failure', 'File exception: '.$e->getMessage(), FALSE); }
      } else response('failure', 'site data file is missing', FALSE);

    break;
    case 'GetNavData':

      $paths = array(
        ['../view/nav/index.json', 'nav'],
        ['../view/pages/index.json', 'pages'],
        ['../view/other/index.json', 'other']
      );
      foreach($paths as $filePath) {
        if(!file_exists($filePath[0])) {
          response('failure', "Site data for $filePAth[1] file is missing", FALSE);
          break;
        }
      }

      try {
        $file = new File();
        $navEntity = json_decode($file->read('../view/nav/index.json', NULL));
        $pageEntity = json_decode($file->read('../view/pages/index.json', NULL));
        $otherEntity = json_decode($file->read('../view/other/index.json', NULL));
      } catch(FileException $e) { response('failure', 'File exception: '.$e->getMessage(), FALSE); }

      // Prepare navigation data to export
      if($navEntity->list !== NULL) {

      } else $navEntity = NULL;

      // Prepare pages data to export
      if($pageEntity->list !== NULL) {
        foreach ($pageEntity->list as $pageId => $pageData) {

          foreach(['template','lang','config'] as $property) {
            if(property_exists($pageData, $property)) {
              $pageData->{$property} = $file->read($pageData->$property, NUll);
            } else $pageData->{$property} = 'Missing';
          }

        }
      } else response('failure', 'There are no pages in configuration', FALSE);

      // Prepare other data to export
      if($otherEntity->list !== NULL) {
        foreach ($otherEntity->list as $moduleID => $moduleData) {

          foreach($moduleData as $propId => $propValue) {
            if(!is_string($propValue)) continue;
            // String "R>" means that this is something to read
            if(preg_match("/^R\>/", $propValue)){
              $moduleData->{$propId} = $file->read(preg_replace("/^R\>/","",$propValue), NUll);
            }
          }

          if(property_exists($moduleData, "extended") && $moduleData->extended) {
            $moduleData->cfg = getExtendedConfig($moduleData->extended, $moduleData->cfg);
          }

        }
      } else $otherEntity = NULL;

      response('success', array (
        'nav' => &$navEntity,
        'pages' => &$pageEntity,
        'other' => &$otherEntity
      ), FALSE);

    break;

    default:
      response('failure', 'Wrong GET request format (call undefined)', FALSE);
    break;
  }

  

} elseif(isset($_POST) && !empty($_POST) && $_POST['call']) {

    switch($_POST['call']) {

      
      default:
        response('failure', 'Wrong POST request format (call undefined)', FALSE); 
      break;
    }

    echo json_encode($response);

}

?>
