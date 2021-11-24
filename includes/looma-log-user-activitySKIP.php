<?php
require_once 'includes/mongo-connect.php';
date_default_timezone_set('UTC');

//notes and future features:

// also add a page-hit counter to each Looma page for pie chart of page usage
// also add a filetype-hit counter for each filetype [textbook, lesson, video, phet, epaath, pdf] for pie chart of filetype usage

// To be implemented as a Dashboard for admins:
/*
 Displays
- Pie charts
    relative usage of looma pages
    relative usage of looma filetypes

*** pie chart of countries of origin

- map
- activity line chart
    (Radio) time frame (d/w/m/all),
    (Radio) resolution (h/d/w/m),
    (Checkbox) uniqs and/or visits,
    left arrow, right arrow. (moves to next/prev period)
Later: activity by geography (province or district) if possible
 */

function logPageHit($page) {
    global $pages_collection;
    mongoUpdate($pages_collection,
        array('page'=>$page),
        array('$inc'        => array('hits' => 1)));
} // end logPageHit()

function logFiletypeHit($ft) {
    global $filetypes_collection;
    mongoUpdate($filetypes_collection,
        array('ft'=>$ft),
        array('$inc'        => array('hits' => 1)));
} // end logFiletypeHit()

// call logUser() each time looma-home.php is opened
function logUser($utc)
{   global $users_collection;
    $ip = userIP();

    $geo['lat'] = "";$geo['long']="";$geo['country']="";

    $geo = getLatLong($ip);

        // update USERS collection in the LOG database
                //if IP not in user collection
                //      insert IP, first-time=<now>, visits=1 to users collection
                // else save latest-time=<now> and increment visits in user document of users collection
    $user =   mongoFindOne($users_collection, array('ip' => $ip));
    if ($user) {
        $prevUTC = $user['latest'];
        mongoUpdate($users_collection,
                    $user,
                    array('$inc' => array('visits' => 1),
                              '$set' => array('latest' => $utc))
        );
    } else {  // this is a new user
        $prevUTC = null;
        mongoInsert($users_collection,
                     array('ip'      => $ip,
                                'first'   => $utc,
                                'latest'  => $utc,
                                'lat'     => $geo['lat'],
                                'long'    => $geo['long'],
                                'country' => $geo['country'],
                                'visits'  => 1));
        };
    return $prevUTC;
} // end logUser()

function logHour($utc, $prevUTC){
    global $hours_collection;
    $utc = $utc - ($utc % (60*60));
    $now = date("Y:m:W:d:h", $utc);  //  year-month-day-hour

  // update HOURS collection in the LOG database
    //if hour not in activity collection
    //      insert hour, visits=1 in activity collection
    //else increment visits in hour document of activity collection
    $hour = mongoFindOne($hours_collection,array('time' => $now));
    if ($hour)  {
        $increments['visits'] = 1;
        if ( $prevUTC && date("Y:m:W:d:h",$prevUTC) < $hour['time']) $increments['uniques']=1;
        mongoUpdate($hours_collection,
                    $hour,
                    array('$inc'=>$increments));
        } else
            mongoInsert($hours_collection, array('time' => $now, 'utc'=>$utc,'visits' => 1, 'uniques' => 1));
} // end logHour()

function logDay($utc, $prevUTC){
    global $days_collection;
    $utc = $utc - ($utc % (24*60*60));
    $now = date("Y:m:W:d", $utc);  //  year-month-day

    // update DAYS collection in the LOG database
    //if hour not in activity collection
    //      insert hour, visits=1 in activity collection
    //else increment visits in hour document of activity collection
    $day = mongoFindOne($days_collection,array('time' => $now));
    if ($day)  {
        $increments['visits'] = 1;
        if ( $prevUTC && date("Y:m:W:d",$prevUTC) < $day['time']) $increments['uniques']=1;
        mongoUpdate($days_collection,
                    $day,
                    array('$inc'=>$increments));
        } else
            mongoInsert($days_collection, array('time' => $now, 'utc'=>$utc,'visits' => 1, 'uniques' => 1));
} // end logDay()

function logWeek($utc, $prevUTC){
    global $weeks_collection;
    $utc = $utc - ($utc % (7*24*60*60));
    $now = date("Y:m:W", $utc); // year-month-year

    // update WEEKS collection in the LOG database
    //if hour not in activity collection
    //      insert hour, visits=1 in activity collection
    //else increment visits in hour document of activity collection
    $week = mongoFindOne($weeks_collection,array('time' => $now));
    if ($week)  {
        $increments['visits'] = 1;
        if ( $prevUTC && date("Y:m:W",$prevUTC) < $week['time']) $increments['uniques']=1;
        mongoUpdate($weeks_collection,
                    $week,
                    array('$inc'=>$increments));
        } else
            mongoInsert($weeks_collection, array('time' => $now, 'utc'=>$utc, 'visits' => 1, 'uniques' => 1));
} // end logWeek()

function logMonth($utc, $prevUTC){
    global $months_collection;

    /*
     mktime(
    int $hour,
    ?int $minute = null,
    ?int $second = null,
    ?int $month = null,
    ?int $day = null,
    ?int $year = null
): int|false
     */
    $utc = mktime(0,0,0,(int) date('m',$utc),1, date('Y',$utc)); //round to beginning of month
    $now = date("Y:m", $utc);  // year-month

    // update MONTHS collection in the LOG database
    //if hour not in activity collection
    //      insert hour, visits=1 in activity collection
    //else increment visits in hour document of activity collection
    $month = mongoFindOne($months_collection,array('time' => $now));
    if ($month)  {
        $increments['visits'] = 1;
        if ( $prevUTC && date("Y:m",$prevUTC) < $month['time']) $increments['uniques']=1;
        mongoUpdate($months_collection,
                    $month,
                    array('$inc'=>$increments));
        } else
            mongoInsert($months_collection, array('time' => $now, 'utc'=>$utc, 'visits' => 1, 'uniques' => 1));
} // end logMonth()

function userIP() {
    if     (!empty($_SERVER['HTTP_CLIENT_IP']))        $address=$_SERVER['HTTP_CLIENT_IP'];
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR']))  $address=$_SERVER['HTTP_X_FORWARDED_FOR'];
    else                                               $address=$_SERVER['REMOTE_ADDR'];
    return $address;
}  // end userIP()

function getLatLong ($userIP) {

    // https://freegeoip.app/json/{IP_or_hostname}

    $apiURL = 'https://freegeoip.app/json/'.$userIP;
    $ch = curl_init($apiURL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $apiResponse = curl_exec($ch);
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
    } else
        return array('IP'=>$userIP,'country'=>null,'lat'=>null,'long'=>null);
}  // end getLatLong()

function logUserActivity () {
    $utc = time(); // this is the UTC linux timestamp
    // WARNING: UTC values in PHP are in SECONDS, in JS they are in MILLIseconds
    $prevUTC = logUser($utc);
    logHour ($utc, $prevUTC);
    logDay  ($utc, $prevUTC);
    logWeek ($utc, $prevUTC);
    logMonth($utc, $prevUTC);
};
?>
