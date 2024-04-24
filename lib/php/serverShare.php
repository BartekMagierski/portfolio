<?php

  include_once './core.php';  

  class SharingService {

    protected $response;
    protected $routes;

    public function __construct() {
      $this->init();
    }
    
    protected function setRoutes() {
      $this->routes = (object) array(
        'ajax' => '../js/ajax.js',
        'popup' => '../js/popup.js',
        'coreJS' => '../js/core.js',
        'jsBuild' => '../js/build.js',
        'formCls' => '../js/form.js',
        'coreLib' => './core.php',
        'navExtra' => '../js/navExtra.js',
        'basicNav' => '../js/buildNav&Pages.js',
        'selfUpdate' => './update/selfUpdate.php',
        'installLib' => './install.php',
        'updateBody' => './update/updateBody.php',
        'updateCall' => './update/updateCall.php',
        'requestsLib' => './requests.php',
        'clientShare' => './clientShare.php',
        'accounts' => (object) array(
          'js' => '../../modules/accounts/model/js/index.js',
          'php' => '../../modules/accounts/model/php/share/clientSide.php'
        ),
        'language' => (object) array(
          'class' => '../js/language/class.js',
          'worker' => '../js/language/worker.js',
          'switch' => (object) array(
            'html' => '../js/language/switch/switch.html'
          )
        )
      );
    }

    public function init() {

      try {

        $headers = apache_request_headers();
        
        if(!$headers['Secret'] || !isset($_POST['fetch']) || !isset($_POST['key']) )
          throw new ShareException("Missing property");
        if($headers['Secret'] !== '22') throw new ShareException('Wrong secret');

        $this->setRoutes();

        if($this->share($_POST['key'], $_POST['fetch'])) {

          // Return base64 file if requested
          if($headers['Return'] && $headers['Return'] === 'base64') {
            if(gettype($this->response) === 'array') {
              $this->response = base64_encode(json_encode($this->response));
            } else $this->response = base64_encode($this->response); 
          }

          // Response
          echo json_encode (
            array(
              'status' => 'success',
              'data' => $this->response
            )
          );

        } else throw new ShareException('Something went wrong');

      } catch(ShareException $e) {
          echo json_encode(
            array(
              'status' => 'Failure',
              'message' => 'Sharing failed, '.$e->getMessage()
            )
          );
      }

    }

    private function share(string $key, string $id):bool {
      
      
      $requestFile_proto = function() use(&$id) {
        
        if(property_exists($this->routes, $id)) {
          
          try {

            $file = new File();
            $this->response = $file->read($this->routes->{$id}, NULL);

          } catch(FileException $e) { throw new ShareException("File exception: ".$e->getMessage); }
        
        } else throw new ShareException("Missing route '$id'"); 
        
      };

      $requestFile = Closure::bind($requestFile_proto, $this);
      $wrongKey = function() { throw new ShareException("Wrong file key"); };

      switch($id) {
        case 'ajax': $key === '55' ? $requestFile():$wrongKey();  break;
        case 'popup': $key === '658' ? $requestFile():$wrongKey();  break;
        case 'coreJS': $key === '82' ? $requestFile():$wrongKey();  break;
        case 'formCls': $key === '829' ? $requestFile():$wrongKey();  break;
        case 'coreLib': $key === '33' ? $requestFile():$wrongKey();  break;
        case 'jsBuild': $key === '2881' ? $requestFile():$wrongKey();  break;
        case 'navExtra': $key === '18' ? $requestFile():$wrongKey();  break;
        case 'basicNav': $key === '896' ? $requestFile():$wrongKey();  break;
        case 'selfUpdate': $key === '556' ? $requestFile():$wrongKey();  break;
        case 'updateCall': $key === '5683' ? $requestFile():$wrongKey();  break;
        case 'updateBody': $key === '3645' ? $requestFile():$wrongKey();  break;
        case 'installLib': $key === '228' ? $requestFile():$wrongKey();  break;
        case 'requestsLib': $key === '673' ? $requestFile():$wrongKey();  break;
        case 'clientShare': $key === '2891' ? $requestFile():$wrongKey();  break;
        case 'accountsJS':
          
          if($key !== '567') $wrongKey();

          if(!property_exists($this->routes, 'accounts')) throw new ShareException("Missing accounts module routes");
          if(!property_exists($this->routes->accounts, 'js')) throw new ShareException('Missing route for accounts JS file');

          $file = new File();
          $this->response = $file->read($this->routes->accounts->js, NULL);
          
        break;
        case 'accountsPHP': 
          
          if($key !== '532') $wrongKey();

          if(!property_exists($this->routes, 'accounts')) throw new ShareException("Missing accounts module routes");
          if(!property_exists($this->routes->accounts, 'php')) throw new ShareException('Missing route for accounts PHP file');

          $file = new File();
          $this->response = $file->read($this->routes->accounts->php, NULL);
          
        break;
        case 'language': 
          if($key === '53') {
  
            if(!property_exists($this->routes, 'language')) throw new ShareException("Missing language route");
            if(!property_exists($this->routes->language, 'class')) throw new ShareException('Missing language  "class" route');
            if(!property_exists($this->routes->language, 'worker')) throw new ShareException('Missing language "worker" route');
            if(!property_exists($this->routes->language, 'switch')) throw new ShareException('Missing language switch property');
            if(!property_exists($this->routes->language->switch, 'html')) throw new ShareException("Missing language switch's html route");

            $file = new File();
            $this->response = array(
              'worker' => $file->read($this->routes->language->worker, NULL),
              'class' => $file->read($this->routes->language->class, NULL),
              'html' => $file->read($this->routes->language->switch->html, NULL)
            );

          } else $wrongKey();
        break;
        default: $this->response = 'The file doesn\'t exist or is not shared';  break;
      }

      return TRUE;

    }

  }

  new SharingService();

?>