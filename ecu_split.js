// ==UserScript==
// @name         DG's Split Unit Tool
// @namespace    http://tampermonkey.net/
// @version      2022.05.13
// @description  try to take over the world!
// @author       Daniel Gilogley
// @match        https://*.instructure.com/dgtools6
// @match        https://courses.ecu.edu.au/dgtools6
// @icon         https://www.google.com/s2/favicons?domain=instructure.com
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

const debug = true;
var API_TOKEN = null;
var uc_role_id = 113;

//Stage 1 HTML
const html_stage_1 = '<title>DG`s Split Unit Tool</title><h1>DG`s Split Unit Tool</h1><hr><div id="stage_1"><h1>Stage 1: Course Details</h1><form action="/action_page.php">    <label for="api_token">Your API Token:</label>    <input type="text" id="api_token" name="api_token" autocomplete="off"><br>    <label for="course_sis_id">SIS ID of Course:</label>    <input type="text" id="course_sis_id" name="course_sis_id" autocomplete="off"><br>    <input type="button" id="stage_1_submit" value="NEXT">  </form></div><div id="stage_2"></div><div id="stage_3"></div><div id="stage_4"></div><div id="stage_5"></div><div id="console_log_div"> <hr> <h2>Console Log:</h2>  <textarea id="console_log_text_area" style="margin: 0px 0px 10px; width: 1080px; height: 720px;" disabled="disabled"></textarea></div>';

//Global Variables
var course_sis_id, course_object, section_object_array, uc_details,term_details,account_details;

$(document).ready(function(){
    //Scroll to top
    $(window).scrollTop(0);

    //Replace the default content with the "Stage 1" HTML
    $("div#content").html(html_stage_1);
    $(window).scrollTop(0);
    document.title = "DG`s Unit Splitter Tool";
    cl("On DG Tools 6 Page - DG`s Split Unit Tool");

    var userToken = getItem('token');


    //TO BE REMOVED
    $('input#api_token').val('');
    $('input#course_sis_id').val("");
    //================

    //Tigger the actions for the Stage 1 Next phase
    $("#stage_1_submit").click(function(e){
        e.preventDefault();
        //Disable the buttons
        $('input#api_token, input#course_sis_id, #stage_1_submit').attr('disabled','disabled');
        stage_1_click();

        //Identify the sections within the Canvas course for splitting
        cl("Identifying the sections within the Canvas course for splitting");
        var section_identify_array = identify_sections_for_split(section_object_array);
        cl("Sectition Split identifier:\n" + JSON.stringify(section_identify_array));

        //Trigger Stage 2
        stage_2_click(section_identify_array);
    });
});

function stage_1_click(){

    //Get the API Token and SIS ID of the course
    API_TOKEN = $('input#api_token').val().trim();
    cl("API Token is: " + API_TOKEN);
    course_sis_id = $('input#course_sis_id').val().trim();
    cl("Course SIS ID is: " + course_sis_id);

    course_object = get_course(course_sis_id);

    //Create a place to put the Source Course information
    var course_info_html = '<div id="source_course_info"><strong>Course ID:</strong> <span id="source_course_info_id"></span><br><strong>Course SIS ID:</strong> <span id="source_course_info_sis_id"></span><br><strong>Integraion ID:</strong> <span id="source_course_inegration_id"></span><br><strong>Course Title:</strong> <span id="source_course_info_title"></span><br><strong>Course Code:</strong> <span id="source_course_info_course_code"></span><br><strong>Course Account ID:</strong> <span id="source_course_info_account_id"></span><br><strong>Course Term ID:</strong> <span id="source_course_info_term_id"></span><br><strong>Unit Coordinator:</strong> <span id="source_course_info_uc"></span><br><strong>Number of sections</strong>: <span id="source_course_info_section_number"></span><br></div>';
    $("#stage_1").append(course_info_html);

    //Get the section informaton about the course
    section_object_array = get_sections(course_object);

    //Figure out who the UC is from the section information
    //The UC would be in the lowest section
    uc_details = get_uc(section_object_array[0]);

    //Get the Account information
    account_details = get_account(course_object.account_id);

    //Get the Term Details
    term_details = get_term(course_object.enrollment_term_id);

    //Put all the information into the course_info_html
    cl("Populating the Source Course Info area");
    $("#source_course_info_id").text(course_object.id);
    $("#source_course_info_sis_id").text(course_object.sis_course_id);
    $("#source_course_info_title").text(course_object.name);
    $("#source_course_info_course_code").text(course_object.course_code);
    $("#source_course_info_account_id").text(account_details.name + " [" + account_details.sis_account_id + "]");
    $("#source_course_info_term_id").text(term_details.name + " [" + term_details.sis_term_id + "]");
    $("#source_course_info_uc").text(uc_details.name + " [SIS ID:" + uc_details.sis_user_id + ' | Canvas ID: ' + uc_details.id + ']');
    $("#source_course_info_section_number").text(section_object_array.length);
    $("#source_course_inegration_id").text(course_object.integration_id);

    return false;
}

function stage_2_click(section_identify_array){
    //scrollToAnchor('stage_2');
    //Build the HTML for Stage 2
    var stage_2_html = '<hr><h1>Stage 2: How Will the Unit Be Split?</h1><form action="#" id="how_split_form"><label for="type_of_split">What Type of split:</label><select name="type_of_split" id="type_of_split"><option value="null" id="null_location_option"></option>&nbsp;&nbsp;<input type="submit" id="stage_2_submit" value="Next"></form>';
    //Put the Stage 2 HTML into the Stage2 DIV
    $("div#stage_2").html(stage_2_html);
    populate_dropdown();


    //What happens when the user clicks "Submit" on Stage 2
    $('input#stage_2_submit').click(function(e){
        e.preventDefault();
        scrollToAnchor('stage_2');

        //Disable the buttons on part 1 of stage 2
        $("#type_of_split, #stage_2_submit").attr('disabled','disabled');

        //Now build the check box with the sections based on the idenifiers
        var section_list_html = '<h3>Sections Check List</h3><form action="#" id="section_check_list"><br><input type="submit" value="Next" id="section_check_list_next"></form>';
        $("#how_split_form").after(section_list_html);
        cl("Create the section check list, and dynamically add in the items");


        var section_array_length = section_identify_array.length;
        cl("Length of section array: " + section_array_length +" | Length of Section Object array: " + section_object_array.length);
        cl("They should match!");
        //Itterate through the section array list
        for(var i=0; i < section_array_length; i++){
            var element = section_identify_array[i];
            if(element.type != "null" && element.type !="ecu_course" && element.type !="activity"){
                var this_check_html = '<input type="checkbox" id="' + element.section_id + '" name="' + element.name + '" value="' + element.sis_section_id + '" > <label for="'+ element.id +'">'+element.name +' [' + element.sis_section_id + ']</label><br>';
                $('#section_check_list').prepend(this_check_html);
                //cl(this_check_html);
            }
        }
        $('#section_check_list_next').click(function(e){
            //After the user chooses the sections to split
            //They click next
            e.preventDefault();
            //Disable the  satge2 to stage3 next button
            $('#section_check_list_next').attr('disabled','disabled');
            //Disable the "Check" boxes for the sections
            $('#section_check_list input').attr('disabled','disabled');

            //run the Stage 3 function
            stage_3();
        });

    });

    return false;
}


//API Call to get the course information
function get_course(sis_course_id){
    var settings = {
        "async":false,
        "url": "/api/v1/courses/sis_course_id:" + sis_course_id,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + API_TOKEN
        },
    };

    var ajax_return = $.ajax(settings).done(function (response) {
        cl("Course Details as JSON:\n" + JSON.stringify(response));
        return response;
    });

    return ajax_return.responseJSON;
}

//Get the Canvas sections
function get_sections(course_object){
    cl("Getting the sections for: " + course_object.sis_course_id);

    //Build the API Call
    var settings = {
        "async": false,
        "url": "/api/v1/courses/sis_course_id:" + course_object.sis_course_id + "/sections",
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + API_TOKEN
        },
    };

    // Execute the API Call
    var ajax_return = $.ajax(settings).done(function (response) {
        //cl("Section Details as JSON:\n" + JSON.stringify(response));

        return response;
    });

    //Get just the array of Section objects
    var ajax_return_section_array = ajax_return.responseJSON;
    cl("Number of Sections: " + ajax_return_section_array.length);

    //sort the section array by id
    //The lowest ID will be the default section
    ajax_return_section_array.sort(function(a, b) {
        return parseFloat(b.id) - parseFloat(a.id);
    });

    cl("Section Details as JSON after sorting:\n" + JSON.stringify(ajax_return_section_array));

    return ajax_return_section_array;
}

function get_uc(section_object){
    //Build the API Call
    var settings = {
        "async": false,
        "url": "/api/v1/courses/" + section_object.course_id + "/enrollments?role_id[]=" + uc_role_id, // Role ID "113" is the UC Role ID in Canvas - See new CONST
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + API_TOKEN
        },
    };

    //Trigger the API Call
    var section_enrollment_array = $.ajax(settings).done(function (response) {
        //Return the user list of the section
        cl("UC request return:\n" + JSON.stringify(response));
        return response;
    });

    section_enrollment_array = section_enrollment_array.responseJSON;

    var uc_user_details = section_enrollment_array[0];
    cl("The UC is probs: " + uc_user_details.user.name + " | Role: " + uc_user_details.role);

    return uc_user_details.user;
}

//console log function
//timeStamper
function timeStamp() {
    var now = new Date();

    //Add leading zero to month
    var currentMonth = now.getMonth() + 1;
    if (currentMonth < 10) currentMonth = "0" + currentMonth;

    //Add leading zero to day
    var currentDay = now.getDate()
    if (currentDay < 10) currentDay = "0" + currentDay;

    //Date in UTC format
    var date = [now.getFullYear(),currentMonth,currentDay];

    var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

    for ( var i = 0; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }
    return date.join("/") + " " + time.join(":");
}

// Console Log time stamp
function cl(console_text){
    if(debug) {
        //Add stuff to the console log - both in DOM and the Console
        var console_text_new = timeStamp() +" | " + console_text;
        console.log(console_text_new);
        $("#console_log_text_area").text(console_text_new + "\n" + $("#console_log_text_area").text());
    }
}


function get_term(term_id){
    var settings = {
        "async": false,
        "url": "/api/v1/accounts/self/terms/" + term_id,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + API_TOKEN
        },
    };

    var term_return = $.ajax(settings).done(function (response) {
        cl("API Call to find Term: " + term_id);
        return response;
    });

    term_return = term_return.responseJSON;

    cl("Term Information as JSON:\n" + JSON.stringify(term_return));
    return term_return;
}

function get_account(account_id){
    var settings = {
        "async": false,
        "url": "/api/v1/accounts/" + account_id,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Authorization": "Bearer " + API_TOKEN
        },
    };

    var account_return = $.ajax(settings).done(function (response) {
        cl("API Call to find the Account: " + account_id);
        return response;
    });

    account_return = account_return.responseJSON

    cl("Account information as JSON:\n" + JSON.stringify(account_return));
    return account_return;
}

function identify_sections_for_split(this_section_array){
    var return_section_array = []; // This will be the retun array of the section information

    var arrayLength = this_section_array.length; // Get the length of the array and then itterate through it to determine sections
    for (var i = 0; i < arrayLength; i++) {
        //If its the default section - Then bail
        var this_section_return = {
            "sis_section_id": this_section_array[i].sis_section_id,
            "section_id":this_section_array[i].id,
            "name":this_section_array[i].name,
        };
        if(this_section_array[i].sis_section_id === null || this_section_array[i].sis_section_id === undefined || this_section_array[i].sis_section_id === 'undefined' || this_section_array[i].sis_section_id == ""){
            this_section_return["type"] = "null";
            return_section_array.push(this_section_return);
        }else{
            var this_section_id = this_section_array[i].sis_section_id.split('.');

            //Section IDs are seperated by '.'
            //The first point is term ID
            //Second ID is unit Code
            //Third ID is Unit Code version
            //Forth is the 'true' Section ID information
            this_section_id = this_section_id[3];

            var this_char_array = this_section_id.split('');
            //Now we should have the last part of the ID and split each character into an array

            //Check to see if the string is three characters
            if(this_char_array.length == 3){
                //Test is first charater is A-Z
                //Test if charcter 2 & 3 are numeric
                if((/[a-zA-Z]/).test(this_char_array[0]) == true && (/[0-9]/).test(this_char_array[1]) == true && (/[0-9]/).test(this_char_array[2]) == true){
                    //This is a ECU Course Section
                    this_section_return["type"] = "ecu_course";
                }else if(this_section_id == "OFF"){
                    //This is if 3 characters and is the OFF-line Section
                    this_section_return["type"] = "OFF";
                }else{
                    //Dont know what this is - Other I guess?
                    this_section_return["type"]="other";
                }
            }else if(this_char_array.length > 6){
                //Activity based sections are long numerical strings
                this_section_return["type"] = "activity";
            }else if(this_section_id == "ON"){
                //This is if not 3 characters and is the ON-line Section
                this_section_return["type"] = "ON";
            }else{
                //If the other conditions fail - Then the section is most likly a location based section
                this_section_return["type"] = "location";
            }
            return_section_array.push(this_section_return);
        }
    }
    //Return the section array identifiers.
    return return_section_array;
}


//Stage 3
//1 - List the things that need to be created
//2 - Confrim what needs to be done
// - New Course
// - Enrol UC
// - Copy content
// - List sections to be cross listed
function stage_3(){
    scrollToAnchor('stage_3');
    //Build the HTML for Stage 3
    var stage_3_html = '<hr><h1>Stage 3: Confrim Split Course Details</h1><h3>New Course Info</h3><div id="new_course_info"><strong>Split Course By:</strong> <span id="new_course_split_by"></span><br><strong>Split Course SIS ID:</strong> <input style="width:400px;" id="new_course_info_sis_id" disabled="disabled"></span><br><strong>Split Integraion ID:</strong> <span id="new_course_inegration_id"></span><br><strong>Split Course Title:</strong> <span id="new_course_info_title"></span><br><strong>Split Course Code:</strong> <span id="new_course_info_course_code"></span><br><strong>Split Course Account ID:</strong> <span id="new_course_info_account_id"></span><br><strong>Split Course Term ID:</strong> <span id="new_course_info_term_id"></span><br><strong>Unit Coordinator:</strong> <span id="new_course_info_uc"></span><br><label for="copy_course_source"><strong>SIS ID for Course Copy:</strong></label> <input style="width:400px;" type="text" id="copy_course_source" name="copy_course_source"> <em>Leave blank if no course copy</em><br><strong>Sections to be cross listed:</strong><ul id="new_cross_list_sections_ul"></ul><br><input type="button" id="stage_3_submit" value="SUMIT REQUEST"></div>';

    //Put the HTML into the right DIV
    $('div#stage_3').html(stage_3_html);



    //Get the "Split" Identifier and put it into the details area
    var split_by ={
        "code": $('#type_of_split').val(),
        "description": $('#type_of_split option:selected').text()
    };

    $('#new_course_split_by').text(split_by.description + " [" + split_by.code +"]");

    //Pharse the course object to create the new course info
    var new_course_data = pharse_course_data(course_object,split_by);

    //New SIS ID
    $('#new_course_info_sis_id').val(new_course_data.sis_id);
    //New Integration ID
    $('#new_course_inegration_id').text(new_course_data.integration_id);
    //New Course Title
    $('#new_course_info_title').text(new_course_data.name);
    //New Course Code
    $('#new_course_info_course_code').text(new_course_data.course_code);
    //Account / Term / UC Details
    $("#new_course_info_account_id").text(account_details.name + " [" + account_details.sis_account_id + "]");
    $("#new_course_info_term_id").text(term_details.name + " [" + term_details.sis_term_id + "]");
    $("#new_course_info_uc").text(uc_details.name + " [" + uc_details.sis_user_id + "]");

    //Guess the content would be copied from the orginal - but don lock it in
    $('#copy_course_source').val(new_course_data.orginal_sis_id);

    //Figure out the sections to be bought in to the new unit for cross-listing
    var cross_list_these = cross_list_sections();

    //Add the funciton to the "Stage 3" Sumit
    $("#stage_3_submit").click(function(e){
        e.preventDefault();
        //Lock some of the fields
        $("#copy_course_source, #stage_3_submit").attr("disabled","disabled");

        stage_4_submit(new_course_data);

    });

    return false;
}

//Build the data to create a new Canvas Course
function pharse_course_data(this_course, this_identifier){
    var return_json = {};
    //var course_code, sis_id, integration_id, account_id, new_sis_id;

    //Build the new SIS ID
    var unix = Math.round(+new Date()/1000); //Get the Unix timestamp to appened to the SIS ID of the course to make it unique
    return_json['sis_id'] = this_course.sis_course_id + "." + this_identifier.code + "." + unix;

    //build the new Course Code
    return_json["course_code"] = this_course.course_code + "." + this_identifier.code + " [" + this_identifier.description + "]";

    //Build the new course title
    var course_title = this_course.name;

    //Break a part the course name
    //Example Course Name: Mathematics for Computing - MAT1252.3
    course_title = course_title.split(" - ");
    var new_course_title = course_title[0] + " [" + this_identifier.description + "] - " + course_title[1];

    return_json["name"] = new_course_title;

    //Inherit the sub-account
    return_json["account_id"] = this_course.account_id;

    //Give the SIS ID of the orginal for reference
    return_json["orginal_sis_id"] = this_course.sis_course_id;

    //New Integration ID
    return_json["integration_id"] = this_course.integration_id + "&split_unit_id=" + return_json['sis_id'];

    cl("New course Details as a JSON:\n" + JSON.stringify(return_json));

    return return_json;
}

//Scroll to function
function scrollToAnchor(id){
    $('html,body').animate({scrollTop: $("#" + id).offset().top},'slow');
}

//Populate the dropdown for location based split

function populate_dropdown(){
    //Location Array
    const location_array_json = [{ "LOC": "ML","DES": "MOUNT LAWLEY" },{"LOC": "JO","DES": "JOONDALUP" },{"LOC": "OFF","DES": "ONLINE" },{"LOC": "ES","DES": "OFF CAMPUS" },{"LOC": "EXC","DES": "EXCHANGE (FOR OUTGOING EDITH COWAN EXCHANGE STUDENTS ONLY)" },{"LOC": "BU","DES": "SOUTH WEST (BUNBURY)" },{"LOC": "ECUSRI","DES": "ECU SRI LANKA" },{"LOC": "DUB","DES": "DUBAI" },{"LOC": "PSB","DES": "PSB ACADEMY" },{"LOC": "SRI","DES": "ACBT - SRI LANKA" },{"LOC": "MEL","DES": "MELBOURNE" },{"LOC": "ZHE","DES": "CHINA (ZHEJIANG)" },{"LOC": "SYD","DES": "SYDNEY" },{"LOC": "RES","DES": "RESEARCH UNIT" },{"LOC": "ISA","DES": "INTERNATIONAL SPORTS ACADEMY - SINGAPORE" },{"LOC": "HCMCOU","DES": "HO CHI MINH OPEN UNIVERSITY" },{"LOC": "PRA","DES": "PRACTICUM UNIT" },{"LOC": "BAL","DES": "BALGA" },{"LOC": "MDS","DES": "MDIS - MANAGEMENT DEVELOPMENT INSTITUTE - SINGAPORE" },{"LOC": "MAN","DES": "MANJIMUP" },{"LOC": "HKUSPACE","DES": "HKU SCHOOL OF PROFESSIONAL AND CONTINUING EDUCATION" },{"LOC": "PEL","DES": "LOCATION CODE TO BE USED FOR PEL9999" },{"LOC": "HCI","DES": "HEALTH CAREERS INTERNATIONAL INDIA" },{"LOC": "SPE","DES": "SPECIAL DEAL" },{"LOC": "NAI","DES": "AUSI - KENYA" },{"LOC": "SHENTON","DES": "SHENTON COLLEGE" },{"LOC": "PMACS","DES": "PETER MOYES ANGLICAN COMMUNITY SCHOOL" },{"LOC": "ECCS","DES": "EMMANUEL CHRISTIAN COMMUNITY SCHOOL" },{"LOC": "SIN","DES": "SINGAPORE (ADVENT LINKS)" },{"LOC": "MDC","DES": "MATER DEI COLLEGE" },{"LOC": "SMF","DES": "SMF INSTITUTE OF HIGHER LEARNING PTE. LTD" }];

    var location_array_length = location_array_json.length;
    cl("Loading in the locations into the locations dropdown. Total: " + location_array_length);

    for(var i=(location_array_length - 1); i >=0 ; i--){
        var this_option_html = '<option value="' + location_array_json[i].LOC + '">' + location_array_json[i].DES + '</option>';
        $('#null_location_option').after(this_option_html);
    }
}

//Function to look at the sections that are being cross-listed
function cross_list_sections(){
    var which_sections = $('#section_check_list input:checked');
    cl("Figure out which sections are to be cross listed. Total: " + which_sections.length);

    cl("Adding the sections to the ordered list");
    for(var i=0; i < which_sections.length; i++){
        $('#new_cross_list_sections_ul').prepend('<li>'+which_sections[i].name+' | SIS ID: '+which_sections[i].value+' | Canvas Section ID: '+which_sections[i].id+'</li>');
    }

    return which_sections;
}

function storeItem(storeName, storeValue) {
    storeValue = btoa(storeValue);
    //localStorage.setItem(storeName, storeValue);
    GM_setValue(storeName, storeValue);
    //console.log("Encoded name: " + storeName + "\nEncoded Value: " + storeValue);
    return true;
}

function getItem(itemName) {
    //var retrievedObject = localStorage.getItem(itemName);
    var retrievedObject = GM_getValue(itemName, null);
    if (retrievedObject !== null) retrievedObject = atob(retrievedObject);
    cl("Decoded itme Name: " + itemName + "\nDecoded value: " + retrievedObject);
    return retrievedObject;
}

function stage_4_submit(new_course_data){
    cl("Submitted stage 3 - moving on to create the new course and things!")
    if (confirm('Are you super duper sure you want to create the new course: ' + new_course_data.name + " [" + new_course_data.sis_id +"]?")) {
        alert("Thanks for confirming");
        var newly_created_course = create_course(new_course_data);
    } else {
        alert('Why did you press cancel? You should have confirmed');
        return false;
    }
}

function create_course(new_course_data){
    var return_JSON;
    var uc_sis_id = uc_details.sis_user_id;
    cl("Begin create "+ new_course_data.name+" ["+new_course_data.sis_id + "]...");

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    //What to do after the call was created
    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            if(this.responseText.toLowerCase().indexOf('error')>=0){
                cl("Failed to create course: " + new_course_data.name+" ["+new_course_data.sis_id + "] with error message:\n" + this.responseText);
                return false;
            }else{
                cl("Create call response\n" + this.responseText);

                return_JSON = JSON.parse(this.responseText);
                //Convert the responst text to json
                window.open("/courses/" + return_JSON.id + "/settings","_blank");
                var popup = window.open("/courses/" + return_JSON.id + "/content_migrations","_blank");
                popup.blur();
                window.focus();


                enrol_uc(return_JSON.sis_course_id,uc_sis_id); // Enrol the UC into the new Course

                copy_course_content(new_course_data.sis_id,new_course_data.orginal_sis_id,new_course_data.id); // Tigger the course copy

                return return_JSON;
            }
        }
    });

    //Build the create course post
    var xhr_post = "/api/v1/accounts/sis_account_id:" + account_details.sis_account_id; //Which account ID

    //Add the course details
    xhr_post += "/courses?course[name]=" + new_course_data.name; //Course Long Name
    xhr_post += "&course[course_code]=" + new_course_data.course_code; //Course Code / Short Name
    xhr_post += "&course[term_id]=sis_term_id:" + term_details.sis_term_id; //Course Term
    xhr_post += "&course[sis_course_id]=" + new_course_data.sis_id; //The SIS ID of the new Course
    xhr_post += "&course[integration_id]=" + encodeURIComponent(new_course_data.integration_id); //The Integration ID of the new course


    cl("Create Course URI: " + xhr_post);
    xhr_post = encodeURI(xhr_post);
    cl("Create course URL Encoded: " + xhr_post);

    xhr.open("POST", xhr_post);
    xhr.setRequestHeader("Authorization", "Bearer " + API_TOKEN);

    //Send the call
    xhr.send();
}

function enrol_uc(course_sis_id,uc_sis_id){
    var msg = uc_sis_id + "[Unit Coordinator] For course: " + course_sis_id
    cl("Begin enrolling user: " + msg);

    var data = null;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState == 4) {
            //console.log(this.responseText);
            if(this.responseText.toLowerCase().indexOf('error') >=0 ){
                cl('Failed enrolling user: ' + msg + " with message\n" + this.responseText);
                return false;
            }else{
                cl('Completed enrolling user: ' + msg);
            }
        }
    });

    //Build the API POST
    var buildPost = "/api/v1/courses/sis_course_id:" + encodeURIComponent(course_sis_id); //Add the SIS of the Course
    buildPost += "/enrollments?enrollment[user_id]=sis_user_id:" + encodeURIComponent(uc_sis_id); //Add the SIS ID of the user
    buildPost += "&enrollment[role_id]=" + uc_role_id; //Add the UC Role ID
    buildPost += "&enrollment[enrollment_state]=active"; //Set enrolment state as 'active'

    xhr.open("POST", buildPost);
    xhr.setRequestHeader("Authorization", "Bearer " + API_TOKEN);
    xhr.setRequestHeader("Cache-Control", "no-cache");

    xhr.send(data);
}//*/

//Copy coure script
function copy_course_content(destination_id,source_id,destination_canvas_id){

    source_id = $('input#copy_course_source').val();

    //If there isnt a course to copy from
    if(source_id == undefined || source_id == null || source_id == "" || source_id == "null"){
        cl("No course to Copy!");
        return false;
    }

    var return_JSON;
    var source_course_data = get_course(source_id); //Get details of the source course
    var source_term_data = get_term(source_course_data.enrollment_term_id); //Get details of the source term

    cl("Begin copying course content from: " + source_id + " to: " + destination_id +"...");

    //Begin building the XHR request POST
    var data = null;
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    var build_xhr_post = "/api/v1/courses/sis_course_id:" + destination_id; // The destination of the course Copy
    build_xhr_post+= "/content_migrations?migration_type=course_copy_importer"; //The type of course copy = course_copy_importer
    build_xhr_post+= "&settings[source_course_id]=sis_course_id:" + source_id; //SIS ID of the course to copy the content from

    //Ensure that the dates shift with assessments
    build_xhr_post+= "&date_shift_options[shift_dates]=true";
    build_xhr_post+= "&date_shift_options[old_start_date]=" + source_term_data.start_at;
    build_xhr_post+= "&date_shift_options[old_end_date]=" + source_term_data.end_at;
    build_xhr_post+= "&date_shift_options[new_start_date]=" + term_details.start_at;
    build_xhr_post+= "&date_shift_options[new_end_date]=" + term_details.end_at;

    cl("Copy Course XHR POST API Details:\n" + build_xhr_post);
    build_xhr_post = encodeURI(build_xhr_post);
    cl("Copy Course XHR POST API Details (Endoce URI):\n" + build_xhr_post);

    //What do do when the Call is completed
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState == 4) {
            //console.log(this.responseText);
            if(this.responseText.toLowerCase().indexOf('error') >=0 ){
                cl("Failed copying course content from: " + source_id + " to: " + destination_id +"... with message\n" + this.responseText);
                return false;
            }else{
                cl("Completed the request to copy course content from: " + source_id + " to: " + destination_id +"... with message\n" + this.responseText);

                //convert response text to JSON
                return_JSON = JSON.parse(this.responseText);

                //window.open("/courses/" + destination_canvas_id + "/content_migrations","_blank");

                return return_JSON;
            }
        }
    });

    //Trigger the API Call
    xhr.open("POST", build_xhr_post);
    xhr.setRequestHeader("Authorization", "Bearer " + API_TOKEN);
    xhr.setRequestHeader("Cache-Control", "no-cache");

    xhr.send(data);
}

