// ==UserScript==
// @name         DG Tools - ECU BB Improvements
// @namespace    https://blackboard.ecu.edu.au/*
// @version      2021.06.09
// @description  try to take over the world!
// @author       Daniel Gilogley
// @match        https://blackboard.ecu.edu.au/*
// @match        http://blackboard.ecu.edu.au/*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://static1.squarespace.com/static/55751873e4b04dc410497087/t/5599db23e4b0af241ed85154/1436146468429/27ef868543abf9c4e16439c1aeb8f0bd.jpg
// ==/UserScript==


//================ Global Variables & Constants ================
var debug = true;
cl("Debug = " + debug)
var urlParams = new URLSearchParams(window.location.search);
cl("URL Paramaters are: " + urlParams);


//Run jQuery if not in page already
if (typeof jQuery == 'undefined' || typeof jQuery === undefined || typeof jQuery === null) {
    var headTag = document.getElementsByTagName("head")[0];
    var jqTag = document.createElement('script');
    jqTag.type = 'text/javascript';
    jqTag.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js';
    headTag.appendChild(jqTag);
    jqTag.onload = myJQueryCode;
} else {
    myJQueryCode();
}


//================ Main Function ================
function myJQueryCode() {
    $(document).ready(function(){
        // If on the BB Search Page
        if(document.location.pathname == "/webapps/blackboard/execute/courseManager"){
            cl("I'm in the Courses search page...");
            //If DG Tools has sent through a search option
            cl("DG Search = " + returnUrlParam("dg_search") + " | Source Type = " + returnUrlParam("sourceType") + " | Search String = " + returnUrlParam("dg_bb_search"));
            if(returnUrlParam("dg_search") == "true" && returnUrlParam("sourceType") == "COURSES"){
                cl("Waiting...");
                setTimeout(function (){
                    //Get the course ID to search for
                    var bb_course_search = returnUrlParam("dg_bb_search");

                    //Debug and say whats been passed through
                    cl("DG tools has sent through the search Paramaters as: " + bb_course_search);

                    //Paste the course into the "Seach Box"
                    cl("Previous Search value: " + $('courseInfoSearchText').val());


                    $('#courseInfoSearchText').val(bb_course_search);
                    //Click search
                    $("#panelbutton1 > form > fieldset > div:nth-child(3) > input.button-4").click();

                },200);

            }
        }
    });
}


//================ Functions ================

//Encode and store and item in local stoage
function storeItem(storeName, storeValue) {
    storeValue = btoa(storeValue);
    //localStorage.setItem(storeName, storeValue);
    GM_setValue(storeName, storeValue);
    cl("Encoded name: " + storeName + "\nEncoded Value: " + storeValue);
    return true;
}

//Decode and retrieve stored item in local storage
function getItem(itemName) {
    //var retrievedObject = localStorage.getItem(itemName);
    var retrievedObject = GM_getValue(itemName, null);
    if (retrievedObject !== null) retrievedObject = atob(retrievedObject);
    cl("Decoded itme Name: " + itemName + "\nDecoded value: " + retrievedObject);
    return retrievedObject;
}

function returnUrlParam(search_term){
    var return_param = urlParams.get(search_term);
    //return_param = return_param.toLowerCase();
    if(return_param !== null) return_param = return_param.toString();
    return return_param;
}

//timeSamper
function timeStamp() {
    var now = new Date();
    var currentMonth = now.getMonth() + 1;
    if (currentMonth < 10) currentMonth = "0" + currentMonth;
    var date = [ now.getDate(), currentMonth, now.getFullYear() ];
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
    time[0] = time[0] || 12;
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

// Console Log time stamp
function cl(console_text){
    if(debug) console.log(timeStamp() +" | " + console_text);
    return false;
}