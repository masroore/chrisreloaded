#!/usr/bin/php
<?php
/**
 *
 *            sSSs   .S    S.    .S_sSSs     .S    sSSs
 *           d%%SP  .SS    SS.  .SS~YS%%b   .SS   d%%SP
 *          d%S'    S%S    S%S  S%S   `S%b  S%S  d%S'
 *          S%S     S%S    S%S  S%S    S%S  S%S  S%|
 *          S&S     S%S SSSS%S  S%S    d* S  S&S  S&S
 *          S&S     S&S  SSS&S  S&S   .S* S  S&S  Y&Ss
 *          S&S     S&S    S&S  S&S_sdSSS   S&S  `S&&S
 *          S&S     S&S    S&S  S&S~YSY%b   S&S    `S*S
 *          S*b     S*S    S*S  S*S   `S%b  S*S     l*S
 *          S*S.    S*S    S*S  S*S    S%S  S*S    .S*P
 *           SSSbs  S*S    S*S  S*S    S&S  S*S  sSS*S
 *            YSSP  SSS    S*S  S*S    SSS  S*S  YSS'
 *                         SP   SP          SP
 *                         Y    Y           Y
 *
 *                     R  E  L  O  A  D  E  D
 *
 * (c) 2012 Fetal-Neonatal Neuroimaging & Developmental Science Center
 *                   Boston Children's Hospital
 *
 *              http://childrenshospital.org/FNNDSC/
 *                        dev@babyMRI.org
 *
 */

define('__CHRIS_ENTRY_POINT__', 666);

require_once (dirname(dirname(dirname(__FILE__))).'/config.inc.php');
require_once '../pacs_pull/pacs.class.php';

// define the options
$shortopts = "o:n:a:y:u:e:s:i:p:m:d:";

$options = getopt($shortopts);

$output = "";
if(isset($options['o'])){
  $output = $options['o'];
}

$name = "";
if(isset($options['n'])){
  $name = $options['n'];
}

$aetitle = "";
if(isset($options['a'])){
  $aetitle = $options['a'];
}

$series_uid = "";
if(isset($options['e'])){
  $series_uid = $options['e'];
}

$modality = "";
if(isset($options['y'])){
  $modality = $options['y'];
}

$stu_des = "";
if(isset($options['u'])){
  $stu_des = $options['u'];
}

$ser_des = "";
if(isset($options['e'])){
  $ser_des = $options['e'];
}

$station = "";
if(isset($options['s'])){
  $station = $options['s'];
}

$ip = "";
if(isset($options['i'])){
  $ip = $options['i'];
}

$port = "";
if(isset($options['p'])){
  $port = $options['p'];
}

$mrn = "";
if(isset($options['m'])){
  $mrn = $options['m'];
}

$date = "";
if(isset($options['d'])){
  $date = $options['d'];
}

// instantiate PACS class
$pacs = new PACS($ip, $port, $aetitle);

// create study filters
$study_parameter = Array();
$study_parameter['PatientID'] = $mrn;
$study_parameter['PatientName'] = $name;
$study_parameter['PatientBirthDate'] = '';
$study_parameter['StudyDate'] = $date;
$study_parameter['StudyDescription'] = '';
$study_parameter['ModalitiesInStudy'] = $modality;
$study_parameter['PerformedStationAETitle'] = '';

// create series filters
$series_parameter = Array();
$series_parameter['NumberOfSeriesRelatedInstances'] = '';
$series_parameter['SeriesDescription'] = '';

// run query
$all_query = $pacs->queryAll($study_parameter, $series_parameter, null);

// post filter
$post_filter = Array();
if($station != ''){
  $post_filter['PerformedStationAETitle'] = $station;
}
if($stu_des != ''){
  $post_filter['StudyDescription'] = $stu_des;
}
if($ser_des != ''){
  $post_filter['SeriesDescription'] = $ser_des;
}

// Post process
$json = json_encode(PACS::postFilter("all",$all_query, $post_filter));

// need full path!
if($name == ''){
  $name = 'allMRN';
}
if($date == ''){
  $date = 'allDate';
}

$filename = $name."-".$date.".json";
$myFile = $output.$filename;
$fh = fopen($myFile, 'w') or die("can't open file");
fwrite($fh, $json);
fclose($fh);

echo $filename.PHP_EOL;
?>