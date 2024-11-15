/* -----------------------------------------------------------------------------
*  NetAlertX
*  Open Source Network Guard / WIFI & LAN intrusion detector 
*
*  ui_components.js - Front module. Common UI components
*-------------------------------------------------------------------------------
#  jokob             jokob@duck.com                GNU GPLv3
----------------------------------------------------------------------------- */


// -----------------------------------------------------------------------------
// Initialize device selectors / pickers fields
// -----------------------------------------------------------------------------
function initDeviceSelectors(devicesListAll_JSON) {

  // Check if both device list exists
  if (devicesListAll_JSON) {
      // Parse the JSON string to get the device list array
      var devicesList = JSON.parse(devicesListAll_JSON);

      var selectorFieldsHTML = ''

      // Loop through the devices list
      devicesList.forEach(function(device) {         

          selectorFieldsHTML += `<option value="${device.devMac}">${device.devName}</option>`;
      });

      selector = `<div class="db_info_table_row  col-sm-12" > 
                    <div class="form-group" > 
                      <div class="input-group col-sm-12 " > 
                        <select class="form-control select2 select2-hidden-accessible" multiple=""  style="width: 100%;"  tabindex="-1" aria-hidden="true">
                        ${selectorFieldsHTML}
                        </select>
                      </div>
                    </div>
                  </div>`


      // Find HTML elements with class "deviceSelector" and append selector field
      $('.deviceSelector').append(selector);
  }

  // Initialize selected items after a delay so selected macs are available in the context
  setTimeout(function(){
        // Retrieve MAC addresses from query string or cache
        var macs = getQueryString('macs') || getCache('selectedDevices');

        if(macs)
        {
          // Split MAC addresses if they are comma-separated
          macs = macs.split(',');
  
          console.log(macs)

          // Loop through macs to be selected list
          macs.forEach(function(mac) {

            // Create the option and append to Select2
            var option = new Option($('.deviceSelector select option[value="' + mac + '"]').html(), mac, true, true);

            $('.deviceSelector select').append(option).trigger('change');
          });       

        }        
    
    }, 10);
}

// -------------------------------------------------------------------
// Utility function to generate a random API token in the format t_<random string of specified length>
function generateApiToken(elem, length) {
  // Retrieve and parse custom parameters from the element
  let params = $(elem).attr("my-customparams")?.split(',').map(param => param.trim());
  if (params && params.length >= 1) {
    var targetElementID = params[0];  // Get the target element's ID
  }

  let targetElement = $('#' + targetElementID);

  // Function to generate a random string of a specified length
  function generateRandomString(len) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Generate the token in the format t_<random string of length>
  let randomToken = 't_' + generateRandomString(length);

  // Set the generated token as the value of the target element
  if (targetElement.length) {
    targetElement.val(randomToken);
  }
}

// ----------------------------------------------
// Updates the icon preview  
function updateIconPreview(elem) {
  // Retrieve and parse custom parameters from the element
  let params = $(elem).attr("my-customparams")?.split(',').map(param => param.trim());

  // console.log(params);

  if (params && params.length >= 2) {
    var inputElementID = params[0];
    var targetElementID = params[1];
  } else {
    console.error("Invalid parameters passed to updateIconPreview function");
    return;
  }

  // Get the input element using the inputElementID
  let iconInput = $("#" + inputElementID);

  if (iconInput.length === 0) {
    console.error("Icon input element not found");
    return;
  }

  // Get the initial value and update the target element
  let value = iconInput.val();
  if (!value) {
    console.error("Input value is empty or not defined");
    return;
  }

  if (!targetElementID) {
    targetElementID = "txtIcon";
  }

  // Check if the target element exists, if not find an element with matching custom attribute
  let targetElement = $('#' + targetElementID);
  if (targetElement.length === 0) {
    // Look for an element with my-custom-id attribute equal to targetElementID
    targetElement = $('[my-customid="' + targetElementID + '"]');
    if (targetElement.length === 0) {
      console.error("Neither target element with ID nor element with custom attribute found");
      return;
    }
  }

  // Update the target element with decoded base64 value
  targetElement.html(atob(value));

  // Add event listener to update the icon on input change
  iconInput.on('change input', function () {
    let newValue = $(this).val();
    $('#' + targetElementID).html(atob(newValue));
  });
}





// -----------------------------------------------------------------------------
// Generic function to copy text to clipboard
function copyToClipboard(buttonElement) {
  const text = $(buttonElement).data('text');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('Copied to clipboard: ' + text, 1500);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  } else {
    // Fallback to execCommand if Clipboard API is not available
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showMessage('Copied to clipboard: ' + text, 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    document.body.removeChild(tempInput);
  }
}

// -----------------------------------------------------------------------------
// Simple Sortable Table columns 
// -----------------------------------------------------------------------------

function sortColumn(element) {
  var th = $(element).closest('th');
  var table = th.closest('table');
  var columnIndex = th.index();
  var ascending = !th.data('asc');
  sortTable(table, columnIndex, ascending);
  th.data('asc', ascending);
}

function sortTable(table, columnIndex, ascending) {
  var tbody = table.find('tbody');
  var rows = tbody.find('tr').toArray().sort(comparer(columnIndex));
  if (!ascending) {
    rows = rows.reverse();
  }
  for (var i = 0; i < rows.length; i++) {
    tbody.append(rows[i]);
  }
}

function comparer(index) {
  return function(a, b) {
    var valA = getCellValue(a, index);
    var valB = getCellValue(b, index);
    return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
  };
}

function getCellValue(row, index) {
  return $(row).children('td').eq(index).text();
}

 // ----------------------------------------------------------------------------- 
  // handling events on the backend initiated by the front end START
  // ----------------------------------------------------------------------------- 

  modalEventStatusId = 'modal-message-front-event'

  // --------------------------------------------------------
  // Calls a backend function to add a front-end event (specified by the attributes 'data-myevent' and 'data-myparam-plugin' on the passed  element) to an execution queue
  function addToExecutionQueue_settingEvent(element)
  {

    // value has to be in format event|param. e.g. run|ARPSCAN
    action = `${getGuid()}|${$(element).attr('data-myevent')}|${$(element).attr('data-myparam-plugin')}`

    $.ajax({
      method: "POST",
      url: "php/server/util.php",
      data: { function: "addToExecutionQueue", action: action  },
      success: function(data, textStatus) {
          // showModalOk ('Result', data );

          // show message
          showModalOk(getString("general_event_title"), `${getString("general_event_description")}  <br/> <br/> <code id='${modalEventStatusId}'></code>`);

          updateModalState()
      }
    })
  }

  // --------------------------------------------------------
  // Updating the execution queue in in modal pop-up
  function updateModalState() {
    setTimeout(function() {
        // Fetch the content from the log file using an AJAX request
        $.ajax({
            url: '/log/execution_queue.log',
            type: 'GET',
            success: function(data) {
                // Update the content of the HTML element (e.g., a div with id 'logContent')
                $('#'+modalEventStatusId).html(data);

                updateModalState();
            },
            error: function() {
                // Handle error, such as the file not being found
                $('#logContent').html('Error: Log file not found.');
            }
        });
    }, 2000);
  }


// -----------------------------------------------------------------------------
// initialize
// -----------------------------------------------------------------------------

function initSelect2() {

  // Retrieve device list from session variable
  var devicesListAll_JSON = getCache('devicesListAll_JSON');

  //  check if cache ready
  if(isValidJSON(devicesListAll_JSON))
  {
    // prepare HTML DOM before initializing the frotend
    initDeviceSelectors(devicesListAll_JSON)

    
    // --------------------------------------------------------
    //Initialize Select2 Elements and make them sortable
    
    $(function () {
      // Iterate over each Select2 dropdown
      $('.select2').each(function() {
          var selectEl = $(this).select2();
    
          // Apply sortable functionality to the dropdown's dropdown-container
          selectEl.next().children().children().children().sortable({
              containment: 'parent',
              update: function () {
                  var sortedValues = $(this).children().map(function() {
                      return $(this).attr('title');
                  }).get();
    
                  var sortedOptions = selectEl.find('option').sort(function(a, b) {
                      return sortedValues.indexOf($(a).text()) - sortedValues.indexOf($(b).text());
                  });
    
                  // Replace all options in selectEl
                  selectEl.empty().append(sortedOptions);
    
                  // Trigger change event on Select2
                  selectEl.trigger('change');
              }
          });
      });
    });
  } else // cache not ready try later
  {
    setTimeout(() => {
      initSelect2()
    }, 1000);
  }  
}

// init select2 after dom laoded
window.addEventListener("load", function() {
  // try to initialize select2
  setTimeout(() => {
    initSelect2()
  }, 1000);
});




console.log("init ui_components.js")