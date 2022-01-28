<?php
require_once 'includes/mongo-connect.php';
date_default_timezone_set('UTC');

/*
        activity logs are in mongo db='activitylog'
        collections 'pages' and 'filetypes' record hits to individual pages or opening of filetypes
            'pages' collection has documents for {'home', 'library', 'library-search', etc}
            'filetypes' collections has documents for {'pdf', 'video', 'lesson', etc}
            a document is {page:'home',hits:<number of hits>}or {ft:'home',hits:<number of hits>}
        collections 'hours', 'days', 'weeks', and 'months' record visits during those timeframes
            'hours' documents are:
                {   "time": "2021:10:06:09",
                    "utc": 1633554000,
                    "visits": 3,
                    "uniques": 1
                }
            where 'utc' is rounded to the timeframe (hours, etc)
            and 'time' is formatted to the timeframe (e.g. Y:m:d:H for hours, Y:m for months, Y:w for weeks)
 */


//////////   log page hit   //////////
function logPageHit($page) {
    global $pages_collection;
    mongoUpdate($pages_collection,
        array('page'=>$page),
        array('$inc'        => array('hits' => 1)));
} // end logPageHit()

//////////   log filetype hit   //////////
function logFiletypeHit($ft) {
    global $filetypes_collection;
    mongoUpdate($filetypes_collection,
        array('ft'=>$ft),
        array('$inc'        => array('hits' => 1)));
} // end logFiletypeHit()

//////////   log user access   //////////
function logUser($utc)
{   global $users_collection;
    global $LOOMA_SERVER;

    $ip = userIP();

        // update USERS collection in the LOG database
            //if IP not in user collection
            //      insert IP, first-time=<now>, visits=1 to users collection
            // else save latest-time=<now> and increment visits count

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
        $geo =  array(  'ip'      => $ip,
                        'first'   => $utc,
                        'latest'  => $utc,
                        'lat'     => null,
                        'long'    => null,
                        'city'    => null,
                        'province'=> null,
                        'country' => null,
                        'visits'  => 1);

        if ($LOOMA_SERVER !== 'looma local') {
            $location = userLatLong($ip);
            $geo['lat']      = $location['lat'];
            $geo['long']     = $location['long'];
            $geo['city']     = $location['city'];
            $geo['province'] = $location['province'];
            $geo['country']  = $location['country'];
            }
        mongoInsert($users_collection, $geo);
        }; // end new user
    return $prevUTC;
} // end logUser()

//////////   log hour hit   //////////
function logHour($utc, $prevUTC) {
    global $hours_collection;
    $utchour = $utc - ($utc % (60*60));
    $prevhour = $prevUTC ? $prevUTC - ($prevUTC % (60*60)) : null;
    $now = date("Y:m:d:H", $utchour);

    // update HOURS collection in the LOG database
    //      if hour not in activity collection
    //        insert hour, visits=1 in activity collection
    //      else increment visits in hour document of activity collection

    $hour = mongoFindOne($hours_collection,array('time' => $now));
    if ($hour)  {
        $increments['visits'] = 1;
        if ( $prevhour && $prevhour < $hour['utc']) $increments['uniques']=1;
        mongoUpdate($hours_collection,
                    $hour,
                    array('$inc'=>$increments));
    } else
        mongoInsert($hours_collection, array('time' => $now, 'utc'=>$utchour,'visits' => 1, 'uniques' => 1));
} // end logHour()

//////////   log day hit   //////////
function logDay($utc, $prevUTC){
    global $days_collection;
    $utcday = $utc - ($utc % (24*60*60));
    $prevday = $prevUTC - ($prevUTC % (24*60*60));
    $now = date("Y:m:d", $utc);  //  year-month-day
    $day = mongoFindOne($days_collection,array('time' => $now));
    if ($day)  {
        $increments['visits'] = 1;
        if ( $prevday && $prevday < $day['utc']) $increments['uniques']=1;
        mongoUpdate($days_collection,
                    $day,
                    array('$inc'=>$increments));
        } else
            mongoInsert($days_collection, array('time' => $now, 'utc'=>$utcday,'visits' => 1, 'uniques' => 1));
} // end logDay()

//////////   log week hit   //////////
function logWeek($utc, $prevUTC){
    global $weeks_collection;
    $utcweek = $utc - ($utc % (7*24*60*60));
    $prevweek = $prevUTC ? $prevUTC - ($prevUTC % (7*24*60*60)) : null;
    $now = date("Y:W", $utc); // year-month-year
    $week = mongoFindOne($weeks_collection,array('time' => $now));
    if ($week)  {
        $increments['visits'] = 1;
        if ( $prevweek && $prevweek < $week['utc']) $increments['uniques']=1;
        mongoUpdate($weeks_collection,
                    $week,
                    array('$inc'=>$increments));
        } else
            mongoInsert($weeks_collection, array('time' => $now, 'utc'=>$utcweek, 'visits' => 1, 'uniques' => 1));
} // end logWeek()

//////////   log month hit   //////////
function logMonth($utc, $prevUTC){
    global $months_collection;

    // mktime(int $hour,int $minute = null,int $second = null,int $month = null,int $day = null,int $year = null
    $utcmonth = mktime(0,0,0,(int) date('m',$utc),1, date('Y',$utc)); //round to beginning of month
    $prevmonth = mktime(0,0,0,(int) date('m',$prevUTC),1, date('Y',$prevUTC)); //round to beginning of month
    $now = date("Y:m", $utcmonth);  // year-month
    $month = mongoFindOne($months_collection,array('time' => $now));
    if ($month)  {
        $increments['visits'] = 1;
        if ( $prevmonth && $prevmonth < $month['utc']) $increments['uniques']=1;
        mongoUpdate($months_collection,
                    $month,
                    array('$inc'=>$increments));
        } else
            mongoInsert($months_collection, array('time' => $now, 'utc'=>$utcmonth, 'visits' => 1, 'uniques' => 1));
} // end logMonth()

function userIP() {
    if     (!empty($_SERVER['HTTP_CLIENT_IP']))        $address=$_SERVER['HTTP_CLIENT_IP'];
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR']))  $address=$_SERVER['HTTP_X_FORWARDED_FOR'];
    else                                               $address=$_SERVER['REMOTE_ADDR'];
    return $address;
}  // end userIP()

function userLatLong ($userIP) {
    // using https://freegeoip.app/json/{IP_or_hostname}?apikey=a89e3860-28cc-11ec-b614-2981d826f277
    /*
    $apiURL = 'https://api.freegeoip.app/json/' . $userIP . '?apikey=a89e3860-28cc-11ec-b614-2981d826f277';
    $ch = curl_init($apiURL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $apiResponse = curl_exec($ch);
    curl_close($ch);
    */

    // using https://ipinfo.io/{IP_or_hostname}?token=1b16a3c5bbd78e
    $apiResoonse = file_get_contents( "https://ipinfo.io/$userIP?token=1b16a3c5bbd78e");

    $ipData = json_decode($apiResoonse, true);

    if(!empty($ipData)){
       // $country_code = $ipData['country_code'];
        $country =   $ipData['country'];
        $province =  $ipData['region'];
        $city =      $ipData['city'];
        $location = explode (",", $ipData['loc']);
        $latitude =  $location[0];
        $longitude = $location[1];
        return array('IP'=>$userIP,'country'=>$country,'province'=>$province,'city'=>$city,'lat'=>$latitude,'long'=>$longitude);
    } else
        return array('IP'=>$userIP,'country'=>null,'province'=>null,'city'=>null,'lat'=>null,'long'=>null);
}  // end userLatLong()

function logUserActivity () {
    global $LOOMA_SERVER;

    if ($LOOMA_SERVER !== 'looma local') { // no logging for Looma boxes
        $utc = time(); // this is the UTC linux timestamp - seconds since the epoch (NOT milliseconds)
        // WARNING: UTC values in PHP are in SECONDS, in JS they are in MILLIseconds
        $utc = $utc - $utc % (60 * 60);  // round to the hour

        $prevUTC = logUser($utc);  // $prevUTC returns the last time this user accessed the site
        // in UTC seconds since the epoch rounded to hour
        logHour($utc, $prevUTC);
        logDay($utc, $prevUTC);
        logWeek($utc, $prevUTC);
        logMonth($utc, $prevUTC);
    }
};
?>
