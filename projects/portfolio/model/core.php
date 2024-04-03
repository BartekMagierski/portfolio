<?php

  class CoreException extends Exception { }
  class RequestException extends Exception { }
  class FileException extends Exception { }
  class ShareException extends Exception { }

  class File {
    public static function read(string $path, $mode):string {
    
      if(file_exists($path)) {
        if(filesize($path) > 0) {
          $r;
          $file = fopen($path, "r");
          switch($mode) {
            // Line by line
            case 'lbl':
              $r = '';
              while (!feof($file)) {
                $x = fgets($file);
                $r .=  $x . PHP_EOL;
              }
              break;
            default;
              $r = fread($file, filesize($path));
              break;
          }
          fclose($file);
          return $r;
        } else return 'File is empty';
      } else return "File doesn't exist ($path)";
    }
    public function write(string $path, string $content): bool {
      if(file_exists($path)) {
        if(is_writable($path)) {
          $file = fopen($path, "w");
          $response = fwrite($file, $content);
          fclose($file);
          return TRUE;
        } else return 'File isn\'t writable';
      } else return "File doesn't exist ($path)";
    }
    public function append(string $path, string $content):bool{
      if(file_exists($path)) {
        $file = fopen($path, "a");
        $response = fwrite($file, $content);
        fclose($file);
        return TRUE;
      } else return FALSE;
    
    }
  }


  /** Make module's extended config */
  function getExtendedConfig(string $extendType, string $cfg):stdClass {
    $cfg = json_decode($cfg);
    $file = new File();
    switch($extendType) {
      case 'templates': 
        foreach($cfg->templates as $id=>$templatePath) {
          $cfg->templates->{$id} = $file->read($templatePath, NULL);
        }
      break;
      default: break;
    }
    return $cfg;
  }

  
  /** Response format  */
  function response(string $state, $data, $isEncoded):bool {
    $r = array( 'status' => &$state );
    $r[$state === 'success' ? 'data' : 'message'] = $isEncoded ? json_decode($data) : $data;
    echo json_encode($r);
    return TRUE;
  }

?>