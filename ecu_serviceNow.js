// ==UserScript==
// @name         eLA and ServiceNow
// @namespace    http://tampermonkey.net/
// @version      2021.07.25
// @description  try to take over the world!
// @author       Daniel Gilogley
// @match        https://edithcowan.service-now.com/incident.do*
// @match        https://edithcowan.service-now.com/u_request.do*
// @icon         https://www.kindpng.com/picc/m/276-2764918_servicenow-icon-transparent-hd-png-download.png
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

// ===== Global Veriables =====
const debug = true;
var inc_req = "false";
var analyst_name = "false";
var assignment_group = "false";
var ticket_number = "false";
var person_name = "false";
const dear_to = "Hi ";

// ====== MAIN FUNCTION =========
$(document).ready(function(){
    //Determine if we're on the INC or REQ page...
    if(document.location.pathname === "/incident.do"){
        inc_req = "incident";
        cl("Welcome to the INCIDENTS page... inc_req = " + inc_req);
    }else if(document.location.pathname === "/u_request.do"){
        inc_req = "u_request";
        cl("Welcome to the REQUESTS page... inc_req = " + inc_req);
    }

    //Get the assigned analyst name and assignment group
    analyst_name = $('#sys_display\\.'+inc_req+'\\.assigned_to').attr('value'); //Get the analyst name name
    analyst_name = toTitleCase(analyst_name); // Title Case the user's Name
    assignment_group = $('#sys_display\\.'+inc_req+'\\.assignment_group').attr('value'); //Get the analyst name name
    ticket_number = $('#sys_readonly\\.'+inc_req+'\\.number').attr('value'); //Get the Ticket number
    person_name = $('#sys_display\\.'+inc_req+'\\.u_requestor').attr('value'); //Get the users name from the requestor field
    person_name = toTitleCase(person_name); // Title Case the user's Name
    cl("Requestor is: " + person_name);

    cl("Ticket: " + ticket_number +" which is a " + inc_req + " assinged to " + analyst_name + " in assignment group: " +assignment_group);

    //Load the dynamic items on the page
    load_the_items();

    return false;
});

//===== Request Functions =====

//===== Incident Functions =====

//===== Shared functions =====
function load_the_items(){
    cl("Load the dynamic page items...");
    //Add the "To/Dear Person" button
    dear_person();

    //Load the buttons within the page
    load_the_buttons();

    return false;
}

function load_the_buttons(){
    cl("Load the 'Load the buttons' function");

    //Load the resolve button
    var resolve_button_html = '<br><button class="form_action_button action_context btn btn-default" style="white-space: nowrap" type="submit" id="dg_resolve_button">ResolveNow</button>';
    $('span.label-text:contains("Customer solution")').after(resolve_button_html);

    //Load the Customer to perform action button
    var customer_step_html = '<br><button class="form_action_button action_context btn btn-default" style="white-space: nowrap" type="submit" id="dg_customer_step_button">Customer Next Step</button>';
    $('span.label-text:contains("Additional comments")').after(customer_step_html);

    //ResolveNow Function and actions
    $('#dg_resolve_button').click(function(e){
        e.preventDefault();
        cl("Someone click 'ResolveNow'");
        //disbable the button
        $('#dg_resolve_button').attr('disabled','disabled');

        //Change the resolution code
        $('#'+inc_req+'\\.u_resolution_code').val('Fulfilled - Remote/Phone');

        //Change the "Next Step" drop down to "Resolved"
        $('#'+inc_req+'\\.u_next_step').val($('option:contains("Set to Resolved")').val());

        //click "Save"
        $('#sysverb_update_and_stay').click();

    });

    //Customer to perform action button
    $('#dg_customer_step_button').click(function(e){
        e.preventDefault();
        cl("Someone click 'Customer to Perform action button'");
        //disbable the button
        $('#dg_customer_step_button').attr('disabled','disabled');

        //Change the "Next Step" drop down to "Resolved"
        $('#'+inc_req+'\\.u_next_step').val($('option:contains("Customer to perform action")').val());

        //click "Save"
        $('#sysverb_update_and_stay').click();

    });

    return false;
}

function dear_person(){
    //Function to create a "To" option for the comments

    cl("Start the Dear/To Person funcion and load the button and apply the rule to the link")

    //Dear / To person in the comments field
    //create the To User HTML object
    var to_user_html = '<a href="#" id="dg_to_user_comment" class="label-text">To: ' + person_name +'<br>';
    $('span#status\\.'+inc_req+'\\.comments').before(to_user_html);

    //increase the size of the "Comments" box - Too small!
    $('textarea#'+inc_req+'\\.comments').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:250px;')

    //Add the function to the link click
    //That adds "To user" in the field
    $('#dg_to_user_comment').click(function(e){
        cl("Clicked 'To user' in general comments");
        e.preventDefault();
        //Get the current comment Area
        var comment_text_area = $('textarea#'+inc_req+'\\.comments').val();

        //Build the new comment area
        var new_comment_text_area = dear_to + person_name + "\n\n";
        new_comment_text_area += comment_text_area + "\n\n";
        new_comment_text_area += "Regards\n" + analyst_name + "\n" + assignment_group;

        //increase the size of the "Comments" box - Too small!
        $('textarea#'+inc_req+'\\.comments').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:500px;')

        //replace the comment area with the new one
        $('textarea#'+inc_req+'\\.comments').val(new_comment_text_area);
        return true;
    });

    //Dear/to person in the closure field
    var to_user_resolve_html = '<a href="#" id="dg_to_user_resolve_comment" class="label-text">To: ' + person_name +'<br>';
    $('span.label-text:contains("Customer solution")').before(to_user_resolve_html);

    //increase the size of the "Comments" box - Too small!
    $('textarea#'+inc_req+'\\.u_solution').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:250px;')

    //Function that pushes the resolution comment
    $('#dg_to_user_resolve_comment').click(function(e){
        cl("Clicked 'To user' in the resolution");
        e.preventDefault();
        //Get the current comment Area
        var comment_text_area = $('textarea#'+inc_req+'\\.u_solution').val(); //u_request.u_solution

        //Build the new comment area
        var new_comment_text_area = dear_to + person_name + "\n\n";
        new_comment_text_area += comment_text_area + "\n\n";
        new_comment_text_area += "Regards\n" + analyst_name + "\n" + assignment_group;

        //increase the size of the "Comments" box - Too small!
        $('textarea#'+inc_req+'\\.u_solution').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:500px;')

        //replace the comment area with the new one
        $('textarea#'+inc_req+'\\.u_solution').val(new_comment_text_area);
        return true;
    });
}

//======Tool Functions======

//--- TitleCase function ---
function toTitleCase(str) {
    str = str.toLowerCase();
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

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

//timeStamper
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

/*HTML Objects

<button class="form_action_button header  action_context btn btn-default" style="white-space: nowrap" type="submit">Resolved</button>

//*/