<?php 
// NOTE:
  /*
    new Request((object) array(
      'method' => string => POST / GET,
      'url'    => string => where to call?,
      'useragent' => string => from what browser?, $_SERVER['HTTP_USER_AGENT']
      'headers' => (array),
      'returnType' => 'base64',
      'returntransfer' => boolean => with return data?,
      'params'=> array(
        'data' => TRUE
      ),
    ));

  */

class Request {

  protected $method;
  protected $url;
  protected $headers;
  protected $returntransfer;
  protected $useragent;
  protected $params;
  protected $response;
  protected $returnType;

  public function __construct(stdClass $cnfg) {
    foreach($cnfg as $key=>$val){
      $this->{$key} = $val;
    }
    $this->result = $this->call();
  }

  public function result(){
    try{
      return $this->response;
    } catch(Exception $e){
        die($e->getMessage());
    } finally{
        // Clear
        foreach(get_class_vars(__CLASS__) as $key=>$val){
          $this->{$key} = NULL;
        }
    }
  }

  /** Request for file from shared lib */
  public static function getSharedFile (array $params) {

    $coreRequest = new Request((object) array(
      'method' => 'POST',
      'url'    => "$GLOBALS[parentPath]/lib/php/serverShare.php",
      'useragent' => $_SERVER['HTTP_USER_AGENT'],
      'headers' => [
        "Secret: $params[secret]",
        "Return: $params[return]"
      ],
      'returntransfer' => TRUE,
      'returnType' => $params['return'],
      'params'=> array(
        'fetch' => $params['fetch'],
        'key' => $params['key']
      ),
    ));

    return $coreRequest->result();

  }

  private function call() {
    // Setup call base
    $params = array(
      CURLOPT_URL => $this->url,
      CURLOPT_USERAGENT => $this->useragent,
      CURLOPT_RETURNTRANSFER => $this->returntransfer,
      CURLOPT_HTTPHEADER => $this->headers,
      CURLOPT_TIMEOUT => '10'
    );

    // Setup params
    if($this->method === 'GET'){
      $urlParams = '?';
      foreach($this->params as $key=>$value)
        $urlParams .= "$key=$value" . '&';
      $params[CURLOPT_URL] .= substr($urlParams, 0, -1);
    }elseif($this->method === 'POST'){
      $params[CURLOPT_POST] = TRUE;
      $params[CURLOPT_POSTFIELDS] = array();
      foreach($this->params as $key=>$value)
        $params[CURLOPT_POSTFIELDS][$key] = $value;
    } else throw new RequestException('Undefined method ->' . $this->method);

    $curl = curl_init();
    curl_setopt_array($curl, $params);
    if(curl_errno($curl)) throw new RequestException('CURL_Error: "' . curl_error($curl) . '"' );

    $result = curl_exec($curl);
    curl_close($curl); 
    $data = json_decode($result);

    if($data && property_exists($data, 'status')) {
      if($data->status === 'success') {
        switch($this->returnType) {
          case 'base64':
            $this->response = base64_decode($data->data);
            break;
          default:
            $this->response = &$data->data;
            break;
        }
      } else {
          response('failure', $data->message, FALSE);
          die;
      }
    } else throw new RequestException('Data missing');
  
  }
}


?>
