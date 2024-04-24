<?php
/** Handler for client for scripts sharing */
try {
  if(isset($_GET['callCore']) && !empty($_GET['callCore'])) {
    switch($_GET['callCore']) {
      case 'GetAjaxWorker':
        response('success', Request::getSharedFile(
          array (
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'ajax',
            'key'    => 55
          )
        ), FALSE);
      break;
      case 'Language':
        response('success', Request::getSharedFile(
          array(
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'language',
            'key'    => 53
          )
        ), TRUE);
      break;
      case 'GetCore':
        response('success', Request::getSharedFile( 
          array (
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'coreJS',
            'key'    => 82
          )
        ), FALSE);
      break;
      case 'GetBasicNav':
        response('success', Request::getSharedFile( 
          array (
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'basicNav',
            'key'    => 896
          )
        ), FALSE);
      break;
      case 'GetPopup':
        response('success', Request::getSharedFile( 
          array (
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'popup',
            'key'    => 658
          )
        ), FALSE);
      break;
      case 'GetForm':
        response('success', Request::getSharedFile( 
          array(
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'formCls',
            'key'    => 829
          )
        ), FALSE);
      break;
      case 'loadAccounts':
        response('success', Request::getSharedFile( 
          array(
            'secret' => 22,
            'return' => 'base64',
            'fetch'  => 'accountsJS',
            'key'    => 567
          )
        ), FALSE);
      break;
      default:
        response("failure", "No such definition in shared lib", FALSE);
      break;
    }
  }
} catch(ShareException $e) { response("failure", $e->getMessage()); }
?>