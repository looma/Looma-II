<?php
error_reporting(E_ALL);

function userIP() {
    if     (!empty($_SERVER['HTTP_CLIENT_IP']))        $address=$_SERVER['HTTP_CLIENT_IP'];
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR']))  $address=$_SERVER['HTTP_X_FORWARDED_FOR'];
    else                                               $address=$_SERVER['REMOTE_ADDR'];
    return $address;
}  // end userIP()

function getLatLong ($userIP) {


    /*
 SAMPLE cURL:

    curl "https://freegeoip.app/json/8.8.8.8"
    {"ip":"8.8.8.8",
        "country_code":"US",
        "country_name":"United States",
        "region_code":"","region_name":"",
        "city":"","zip_code":"",
        "time_zone":"America/Chicago",
        "latitude":37.751,
        "longitude":-97.822,
        "metro_code":0}
     */

    $apiURL = 'https://freegeoip.app/json/'.$userIP;
    $ch = curl_init($apiURL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $apiResponse = curl_exec($ch);

    print_r($apiResponse);

    curl_close($ch);
    $ipData = json_decode($apiResponse, true);

    //echo (string) $ipData;exit;

    if(!empty($ipData)){
        $country_code = $ipData['country_code'];
        $country_name = $ipData['country_name'];
        $latitude = $ipData['latitude'];
        $longitude = $ipData['longitude'];

        /*
        echo 'Continent Name: '.$continent.'<br/>';
        echo 'Country Name: '.$country_name.'<br/>';
        echo 'Country Alpha-2 Code: '.$country_code_alpha2.'<br/>';
        echo 'Country Alpha-3 Code: '.$country_code_alpha3.'<br/>';
        echo 'Country Numeric Code: '.$country_code_numeric.'<br/>';
        echo 'Country International Call Prefix Code: '
            . $international_prefix.'<br/>';
        echo 'Currency Code: '.$currency_code.'<br/>';
        echo 'Latitude: '.$latitude.'<br/>';
        echo 'Longitude: '.$longitude;
         */
        return array('IP'=>$userIP,'country'=>$country_name,'lat'=>$latitude,'long'=>$longitude);
    } else return array('IP'=>$userIP,'country'=>null,'lat'=>null,'long'=>null);
}  // end getLatLong()

echo 'looma-php-test.php: ' . $_SERVER['SERVER_NAME'] ;
$ip = userIp();
echo 'UTC is ' . time() . '<br>';
echo 'IP is ' . $ip  . '<br>';

$latlong = getLatLong($ip);

if (isset($latlong['latitude']) && isset($latlong['longitude'])) echo ' lat is ' . $latlong['latitude'] . '  and long is ' . $latlong['longitude'];
?>