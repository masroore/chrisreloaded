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
require_once (joinPaths(CHRIS_CONTROLLER_FOLDER, 'template.class.php'));
require_once (joinPaths(CHRIS_MODEL_FOLDER, 'user.model.php'));

// define the options
$shortopts = "l:o:";

$options = getopt($shortopts);

$list = "";
if(isset($options['l'])){
  $list = $options['l'];
}

$output = "";
if(isset($options['o'])){
  $output = $options['o'];
}
// cp some files over
recurse_copy('css',$output.'css');
recurse_copy('js',$output.'js');
recurse_copy('gfx',$output.'gfx');

// update pacs.js to define json object to be loaded
$t = new Template($output.'js/pacs.js');
$t -> replace('LIST_JSON', $list);

$fh = fopen($output.'js/pacs.js', 'w') or die("can't open file");
fwrite($fh, $t);
fclose($fh);

$index = shell_exec('./index.php');
$fh = fopen($output.'index.html', 'w') or die("can't open file");
fwrite($fh, $index);
fclose($fh);

// generate index.html
// create link to top level dir
symlink($output.'index.html', $output.'../index.html');
?>