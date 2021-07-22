
Tampermonkey® by Jan Biniok
v4.13
	
DG Tools - CUOS Better!
by You
1
// ==UserScript==
2
// @name         DG Tools - CUOS Better!
3
// @namespace    http://tampermonkey.net/
4
// @version      2021.06.09
5
// @description  try to take over the world!
6
// @author       You
7
// @match        https://ecuapps3.ecu.edu.au/ums/*
8
// @icon         https://www.google.com/s2/favicons?domain=ecu.edu.au
9
// @grant        none
10
// @grant        GM_getValue
11
// @grant        GM_setValue
12
// @require      http://code.jquery.com/jquery-3.4.1.min.js
13
// ==/UserScript==
14
​
15
//================ Global Variables & Constants ================
16
const debug = true;
17
cl("Debug = " + debug)
18
const current_year = "2021";
19
const bb_icon = "https://az495088.vo.msecnd.net/app-logo/blackboardlearn_215.png"
20
var dg_cycle_check = false;
21
​
22
​
23
//Run jQuery if not in page already
24
if (typeof jQuery == 'undefined' || typeof jQuery === undefined || typeof jQuery === null) {
25
    var headTag = document.getElementsByTagName("head")[0];
26
    var jqTag = document.createElement('script');
27
    jqTag.type = 'text/javascript';
28
    jqTag.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js';
29
    headTag.appendChild(jqTag);
30
    jqTag.onload = myJQueryCode;
31
} else {
32
    myJQueryCode();
33
}
34
​
35
​
36
//================ Main Function ================
37
function myJQueryCode() {
38
    $(document).ready(function(){
39
        // If on the unit offerings page
40
        if(document.location.pathname.indexOf("UnitOfferings.jspx")>0){
41
            cl("On the Unit offerings page");
42
​
43
            //get the current year value for the year select drop down
44
            var current_year_value = $('select:contains("' + current_year + '") > option:contains("' + current_year + '")').attr('value');
45
            cl("Current year[" + current_year + "] value: " + current_year_value);
46
​
47
            //Apply the current year to the search otpions
48
            cl("setting the current year value:" + current_year_value);
49
            $('select:contains("2021")').val(current_year_value);
50
​
51
            //Advanced search status
52
            //Created defualt search options
53
        }else if(document.location.pathname.indexOf("BlackboardSites.jspx")>0){
