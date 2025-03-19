// ==UserScript==
// @name         DG Tools for ServiceNow
// @namespace    http://tampermonkey.net/
// @version      2025.03.18.1
// @description  try to take over the world!
// @author       Daniel Gilogley
// @match        https://edithcowan.service-now.com/*incident.do*
// @match        https://edithcowan.service-now.com/*u_request.do*
// @icon         https://www.kindpng.com/picc/m/276-2764918_servicenow-icon-transparent-hd-png-download.png
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

// ===== Global Veriables =====
const debug = true; //Debug mode
var inc_req = "false";
var analyst_name = "false";
var assignment_group = "false";
var ticket_number = "false";
var person_name = "false";
var person_full_name = "false";
var dear_to = "Hi"; //Auto changes if your name is Mark later on in the script
var contact_details_json = {};

// ====== MAIN FUNCTION =========
$(document).ready(function(){
    //Determine if we're on the INC or REQ page...
    inc_req = inc_or_req();

    //Get the assigned analyst name and assignment group
    analyst_name = $('#sys_display\\.'+inc_req+'\\.assigned_to').attr('value'); //Get the analyst name name
    analyst_name = toTitleCase(analyst_name); // Title Case the user's Name
    assignment_group = $('#sys_display\\.'+inc_req+'\\.assignment_group').attr('value'); //Get the assignment group name
    ticket_number = $('#sys_readonly\\.'+inc_req+'\\.number').attr('value'); //Get the Ticket number

    //If your name is Mark "dear_to" becomes "Hello"
    if(analyst_name.indexOf("Mark")>=0) dear_to = "Hello ";
    else dear_to = "Hi ";

    person_full_name = $('#sys_display\\.'+inc_req+'\\.u_requestor').attr('value'); //Get the users name from the requestor field

    cl("Person full Name: " + person_full_name);
    //get the person's first name
    person_name = person_first_name(person_full_name);

    person_full_name = toTitleCase(person_full_name); // Title Case the user's Name after figureing out the first name

    cl("Requestor is: " + person_full_name + " | First name: " + person_name);

    cl(dear_to +" "+ analyst_name +", your Ticket: " + ticket_number +" which is a " + inc_req + " assinged to " + analyst_name + " in assignment group: " +assignment_group);

    //Get the contact details
    contact_details_json = get_contact_details();
    cl("Gotten the contact details as: " + JSON.stringify(contact_details_json));

    //Load the dynamic items on the page
    load_the_items();

    //convert html in comments to actual html
    html_history();

    //load tinyMCE
    tinymce_loader(inc_req);

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

    //If there is "Accecpt" - Then disable the other buttons as it can do werid things... according to hollie...
    is_there_accept();

    //Do something with the contact details
    if(contact_details_json != false || contact_details_json != "false") contact_details_do_something();

    //Load the Email button
    email_inject();

    return false;
}

//Use the Contact details - somehow?!
function contact_details_do_something(){
    cl('In the "contact_details_do_something" function');

    //Use the phone and mobile numbers as TEL links
    // Under the Contact details tab
    var local_phone = contact_details_json.phone;

    cl("Local phone number: " + local_phone);

    if(local_phone != undefined && local_phone.toLowerCase() != "no phone listed"){
        var phone_html_link = '<a href="tel:' + local_phone +'" id="dg_contact_phone" class="label-text">Phone: ' + local_phone +'</a><br>';
        $('#status\\.' + inc_req + '\\.u_contact_details').before(phone_html_link);
        cl('Putting the Phone link in');
        $('#dg_contact_phone').click(function(e){
            e.preventDefault();
            window.open("tel:"+local_phone, "_self");
            cl("Someone clicked the phone link");
        });
    }else cl("No phone listed");

    //Now the same for mobile - If there is one!
    var local_mobile = contact_details_json.mobile;
    if(local_mobile != undefined && local_mobile.toLowerCase() != "no mobile listed"){
        cl("Wow! there is a mobile number!");
        var mobile_html_link = '<a href="tel:' + local_mobile +'" id="dg_contact_mobile" class="label-text">Mobile: ' + local_mobile +'</a><br>';
        $('#status\\.' + inc_req + '\\.u_contact_details').before(mobile_html_link);
        $('#dg_contact_mobile').click(function(e){
            e.preventDefault();
            window.open("tel:" + local_mobile, "_self");
            cl("Someone clicked the Mobile link");
        });
    }else cl("No mobile listed");
    //Should we do something with the other contact details - Yes
    //Will I? - Maybe in a later release
}

//Get the contacts from the "contacts" field
function get_contact_details(){
    var get_contact_deets = $('#' + inc_req + '\\.u_contact_details').val();
    cl("Contact details are: " + get_contact_deets);

    //If there are no contact details, return false
    if(get_contact_deets == null || get_contact_deets == "" || get_contact_deets == undefined) return false;

    get_contact_deets = get_contact_deets.trim();

    //If there are, seperate out the contact details based on the split of "|"
    get_contact_deets = get_contact_deets.split("|");

    //Return the Contact details as an array
    var contact_return_json = {};


    //Check to see if there are contact details, and push them to the JSON object to return
    //Username
    if(get_contact_deets[0] != undefined) contact_return_json['username'] = get_contact_deets[0].trim();
    //Email
    if(get_contact_deets[1] != undefined) contact_return_json['email'] = get_contact_deets[1].trim();
    //Phone
    if(get_contact_deets[2] != undefined) contact_return_json['phone'] = get_contact_deets[2].trim();
    //Mobile
    if(get_contact_deets[3] != undefined) contact_return_json['mobile'] = get_contact_deets[3].trim();

    return contact_return_json;
}

// Is this ticket an INC or a REQ?!
function inc_or_req(url){
    //There are sometimes when the pathname is not absolute, so the function is now based on indexOf

    //If no variable is pushed through, use default
    if(url == undefined || url == null || url=="") url=document.location.pathname;

    var tmp_inc_or_req = "false";

    cl("Running the INC or REQ function for document pathname: " + url);

    //Determine if INC or REQ
    if(url.indexOf("/incident.do") >= 0){ //IF Request
        tmp_inc_or_req = "incident";
        cl("Welcome to the INCIDENTS page... inc_req = " + tmp_inc_or_req);
        return tmp_inc_or_req;
    }else if(url.indexOf("/u_request.do") >=0 ){ //IF Incident
        tmp_inc_or_req = "u_request";
        cl("Welcome to the REQUESTS page... inc_req = " + tmp_inc_or_req);
        return tmp_inc_or_req;
    }else{
        return false;
    }
}

//Function to disable to buttons if there is "Accecpt" on the page
function is_there_accept(){

    if($('button:contains("Accept")').length > 0){
        //Change the state of the DG Buttons to disabled
        cl("There is an Accept button, so disable the DG buttons")
        //ResolveNow && Customer Next
        $('#dg_resolve_button, #dg_customer_step_button').attr('disabled','disabled');
        //Change the text of rht DG buttons
        $('#dg_resolve_button, #dg_customer_step_button').text("You need to Accept!");
        return true;
    }

    //There wasn't accept - So do nothing!
    cl("No Accept - So do nothing!");
    return false;
}


//Function to load in the "ResoveNow" and "Customer" buttons
function load_the_buttons(){
    cl("Load the 'Load the buttons' function");

    //Load the resolve button
    var resolve_button_html = '<br><button class="form_action_button action_context btn btn-default" style="white-space: nowrap" type="submit" id="dg_resolve_button">ResolveNow</button>';
    $('span.label-text:contains("Customer solution")').after(resolve_button_html);

    //Load the Customer to perform action button
    var customer_step_html = '<br><button class="form_action_button action_context btn btn-default" style="white-space: nowrap" type="submit" id="dg_customer_step_button">Customer Next Step</button>';
    $('span.label-text:contains("Additional comments")').after(customer_step_html);

    cl("Loaded buttons, applying the button rules");
    //ResolveNow Function and actions
    $('#dg_resolve_button').click(function(e){
        e.preventDefault();
        cl("Someone clicked 'ResolveNow' button");
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
        cl("Someone clicked 'Customer to Perform action' button'");
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
    var to_user_html = '<a href="#" id="dg_to_user_comment" class="label-text">To: ' + person_full_name +'</a><br>';
    //$('span#status\\.'+inc_req+'\\.comments').before(to_user_html);

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

        new_comment_text_area += signature(analyst_name,assignment_group);

        //increase the size of the "Comments" box - Too small!
        $('textarea#'+inc_req+'\\.comments').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:500px;')

        //replace the comment area with the new one
        $('textarea#'+inc_req+'\\.comments').val(new_comment_text_area);
        return true;
    });

    //Dear/to person in the closure field
    var to_user_resolve_html = '<a href="#" id="dg_to_user_resolve_comment" class="label-text">To: ' + person_full_name +'</a><br>';
    $('span.label-text:contains("Customer solution")').before(to_user_resolve_html);

    //increase the size of the "Comments" box - Too small!
    $('textarea#'+inc_req+'\\.u_solution').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:250px;')

    cl("Completed loading the 'To: " +person_name+ "' links. Creating the rules for when user's click on the links.");
    //Function that pushes the resolution comment
    $('#dg_to_user_resolve_comment').click(function(e){
        cl("Clicked 'To user' in the resolution");
        e.preventDefault();
        //Get the current comment Area
        var comment_text_area = $('textarea#'+inc_req+'\\.u_solution').val(); //u_request.u_solution

        //Build the new comment area
        var new_comment_text_area = dear_to + person_name + "\n\n";
        new_comment_text_area += comment_text_area + "\n\n";

        /*if(analyst_name.indexOf("Daniel") >= 0){
            assignment_group = assignment_group+" Team Lead\nSnr. Learning Environments Advisor";
        }*/

        //signature(analyst_name,assignment_group);

        //new_comment_text_area += "Regards\n" + analyst_name + "\n" + assignment_group;
        new_comment_text_area += signature(analyst_name,assignment_group);

        //increase the size of the "Comments" box - Too small!
        $('textarea#'+inc_req+'\\.u_solution').attr('style','overflow: auto hidden;overflow-wrap: normal;resize: vertical;height:500px;')

        //replace the comment area with the new one
        $('textarea#'+inc_req+'\\.u_solution').val(new_comment_text_area);
        return true;
    });
}

//======Tool Functions======

//---- First Name Function ---
//Function to determine a users first name based on the ECU logic of lastname is always UPPERCASE
function person_first_name(full_name){
    cl("In the person first name function");
    //Mini function to determine if string is capatlised. At ECU capatilised string is surname, which we'll drop.
    const isUpperCase = (string) => /^[A-Z\\'\\-]*$/.test(string)

    //Split the name array
    var name_array = full_name.split(" ");
    cl("This is the name split on space: " + name_array);

    //create empty return name
    var name_return = "";

    for (var i = 0; i < name_array.length; i++) {
        cl("On word " + (i+1) + " of " + name_array.length + ". Current word is: " + name_array[i]);
        //If the name is uppercase
        if(isUpperCase(name_array[i]) == false){
            cl("Is upper-case string: " + isUpperCase(name_array[i]));
            name_return = name_return + " " + name_array[i];
        }else cl("Is upper-case string: " + isUpperCase(name_array[i]));
    }


    //if the name contains (Staff) or (STAFF) remove it or anything inside the parentheses
    name_return = name_return.replace(/ *\([^)]*\) */g, "");

    //Trim the name
    name_return = name_return.trim();

    cl("Current First name: " + name_return);
    return name_return;
}


//--- TitleCase function ---
//New title case function for ones with ' and Mc and Mac
function toTitleCase(name) {
    var replacer = function (whole, prefix, word) {
        var ret = [];

        if (prefix) {
            ret.push(prefix.charAt(0).toUpperCase());
            ret.push(prefix.substr(1).toLowerCase());
        }

        ret.push(word.charAt(0).toUpperCase());
        ret.push(word.substr(1).toLowerCase());
        return ret.join('');
    }
    var pattern = /\b(ma?c)?([a-z]+)/ig;
    return name.replace(pattern, replacer);
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


//Under development
/*function returnUrlParam(search_term){
    var return_param = urlParams.get(search_term);
    //return_param = return_param.toLowerCase();
    if(return_param !== null) return_param = return_param.toString();
    return return_param;
}*/

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

    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }
    return date.join("/") + " " + time.join(":");
}

// Console Log time stamp
function cl(console_text){
    if(debug) console.log(timeStamp() +" | " + console_text);
}

// Name signature
function signature(analyst_name,assignment_group){
    var return_signature = "Warm regards\n";

    if(analyst_name.indexOf("Daniel Gilogley")>=0) return_signature += analyst_name + "\nSnr. Learning Environments Advisor\n" + assignment_group + " Team Lead";
    else if(analyst_name.indexOf("Ben Seabourne")>=0) return_signature += analyst_name + "\nSnr. Support Officer\n" + assignment_group;
    else if(analyst_name.indexOf("Mark Turner")>=0) return_signature += analyst_name + "\nSnr. Support Coordinator\n" + assignment_group;
    else if(analyst_name.indexOf("Ian Schilling")>=0) return_signature += analyst_name + "\nLearning Technologies Support Officer (LTSO)\n" + assignment_group;
    else if(analyst_name.indexOf("Rachel Simpson")>=0) return_signature += analyst_name + "\nLearning Technologies Support Officer (LTSO)\n" + assignment_group;
    else if(analyst_name.indexOf("Dorian Salzmann")>=0) return_signature += analyst_name + "\nLearning Technologies Support Officer (LTSO)\n" + assignment_group;
    else if(analyst_name.indexOf("Kate Abbott")>=0) return_signature += analyst_name + "\nLearning Technologies Support Officer\n" + assignment_group;
    else if(analyst_name.indexOf("Jon Georgiou")>=0) return_signature += analyst_name + "\nLearning Technologies Support Officer (LTSO)\n" + assignment_group;
    else if(analyst_name.indexOf("Brendan Cuff")>=0) return_signature += analyst_name + "\nLearning Technologies Trainer\n" + assignment_group;
    else return_signature += analyst_name + "\n" + assignment_group;


    return return_signature;

    /* - From Spreadsheet
    Daniel Gilogley   Snr. Learning Environments Advisor
    Ben Seabourne   Snr. Support Officer
    Mark Turner Snr. Support Coordinator
    Ian Schilling   Learning Technologies Support Officer (LTSO)
    Rachel Simpson  Learning Technologies Support Officer (LTSO)
    Dorian Salzmann Learning Technologies Support Officer (LTSO)
    Kate Abbott Learning Technologies Support Officer
    Jon Georgiou    "Learning Technologies Support Officer (LTSO)
    Brendan Cuff    Learning Technologies Trainer */
}


/*HTML Objects

<button class="form_action_button header  action_context btn btn-default" style="white-space: nowrap" type="submit">Resolved</button>

//*/

//Function to get a URL Paramater
function URL_paramater(param, this_url){
    if(this_url == undefined || this_url == null || this_url == '') this_url = window.location.href;
    var url = new URL(this_url);
    var return_this = url.searchParams.get(param);

    cl("Returning " + param +" : " + return_this);

    return return_this;
}

//function to add Email button to top of the page
function email_inject(inc_req){
    //Add this HTML Button to create emails
    var email_button_html = '<button id="dg_email_client_open" src="images/icons/email.gifx" class="icon-mail"> Email</button>';
    $('div.container-fluid div.navbar-right').prepend(email_button_html);
    cl("Added Email HTML");

    //Function once a user clicks on the Email button
    $('#dg_email_client_open').click(function(e){
        cl("User has clicked on email button...");
        e.preventDefault();

        //get the Database ID of the INC / REQ
        var sys_id = URL_paramater('sys_id');

        //Incident or req
        var inc_req = inc_or_req();

        //this is the URL of a Email object
        var email_url = 'https://edithcowan.service-now.com/email_client.do?sysparm_table='+inc_req+'&sysparm_sys_id=' + sys_id + '&sysparm_target='+inc_req+'&sys_target='+inc_req+'&sys_uniqueValue=' + sys_id + '&sys_row=0&sysparm_encoded_record=&sysparm_domain_restore=false&sysparm_stack=no';

        window.open(email_url, '_blank').focus();

    });
}


function tinymce_loader(inc_req){

    var apiKey = "8mgt5bood7vtcmdoou2d86uv60g775vdrwv74oer3cee5qah";
    var script = document.createElement('script');
    script.src = 'https://cdn.tiny.cloud/1/' + apiKey + '/tinymce/5/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.onerror = function() {
        cl('Failed to load TinyMCE script.');
    };


    var tiny_data =


        script.onload = function() {
            // Initialize TinyMCE on the existing text area
            cl('Initialize TinyMCE on the existing text area...');
            tiny_mce_insert(inc_req + '\\.comments');
            //tiny_mce_insert(inc_req + '\\.u_solution');


        };
    document.head.appendChild(script);
    cl("Adding TinyMCE Script to the Page");
}

function tiny_mce_insert(this_text_area){
    var toolbar_options = 'dearUser | undo redo | styles | link | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | forecolor backcolor emoticons | code | customDateButton';

    var this_selector = "#" + this_text_area;

    var this_signature = signature(analyst_name,assignment_group);
    let formattedText = this_signature.replace(/\n/g, '<br>');

    //customer comments box
    tinymce.init({
        selector: this_selector,
        height: 500,
        width:800,
        plugins: ['code','link'],
        toolbar: toolbar_options,
        menubar: 'HTML',
        setup: (editor) => {
            editor.ui.registry.addButton('dearUser', {
                text: 'To ' + person_name,
                onAction: (_) => editor.insertContent('To ' + person_name + '<p></p><p>' + formattedText + '</p>')
            });


            const toTimeHtml = (date) => `<time datetime="${date.toString()}">${date.toDateString()}</time>`;

            editor.ui.registry.addButton('customDateButton', {
                icon: 'insert-time',
                tooltip: 'Insert Current Date',
                enabled: false,
                onAction: (_) => editor.insertContent(toTimeHtml(new Date())),
                onSetup: (buttonApi) => {
                    const editorEventCallback = (eventApi) => {
                        buttonApi.setEnabled(eventApi.element.nodeName.toLowerCase() !== 'time');
                    };
                    editor.on('NodeChange', editorEventCallback);

                    /* onSetup should always return the unbind handlers */
                    return () => editor.off('NodeChange', editorEventCallback);
                }
            });
        },
    });

}

// function to make the comment history have HTML content
function html_history(){
    
    cl("Converting comment history form text to HTML")
    $("#element\\." + inc_req + "\\.comments\\.additional > span > div > div:nth-of-type(3n)").each(function(){
        $(this).html($(this).text());
    });

}
