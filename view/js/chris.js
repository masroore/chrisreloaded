/**
 * Define the CHRIS namespace
 */
var _CHRIS_ = _CHRIS_ || {};

_CHRIS_.updateStatistics = function() {
  
  jQuery.ajax({
    type : "GET",
    url : "api.php?action=count&what=datafeedrunning",
    dataType : "json",
    success : function(data) {
      
      if (data['result'] == 'maintenance') {
        
        // we are in maintenance mode
        // lock the screen
        $('#maintenance').show();
        return;
        
      }

      // update data count
      jQuery('#data_count').html(data['result'][0]);
      // update feed count
      jQuery('#feed_count').html(data['result'][1]);      
      // update running count
      jQuery('#running_count').html(data['result'][2]);
      
    }
  });
  
}

_CHRIS_.scalePanels = function() {

  // configure screen size related parameters
  var _pluginpanelsize = jQuery(window).height()-447;
  var _feedcontentsize = jQuery(window).height()-129;  
  var _interactivepluginsize = jQuery(window).height()-79;
  var _interactivepluginwidth = jQuery(window).width()-300 - 450 - 40 - 40;
  
  if (jQuery(window).height() <= 600) {
    // hide the statistics panel
    jQuery('#information').hide();
    _pluginpanelsize += 173;
  } else {
    // show it
    jQuery('#information').show();
  }
  
  jQuery('.plugin_panel').css('min-height', _pluginpanelsize);
  jQuery('.plugin_panel').css('height', _pluginpanelsize);
  jQuery('.plugin_panel').css('max-height', _pluginpanelsize);
  jQuery('.feed_content').css('min-height', _feedcontentsize);
  jQuery('.feed_content').css('height', _feedcontentsize);
  jQuery('.feed_content').css('max-height', _feedcontentsize);
  jQuery('#center').css('min-height', _interactivepluginsize);
  jQuery('#center').css('height', _interactivepluginsize);
  jQuery('#center').css('max-height', _interactivepluginsize);
  jQuery('#center').css('min-width', _interactivepluginwidth);
  jQuery('#center').css('width', _interactivepluginwidth);
  jQuery('#center').css('max-width', _interactivepluginwidth);
  
};

jQuery(document).ready(function() {
  
  // watch for the resize event
  jQuery(window).resize(function() {_CHRIS_.scalePanels()});
  // also call it once
  _CHRIS_.scalePanels();
  
  jQuery('.dropdown-toggle').dropdown();
  jQuery("[rel=bottom_tooltip]").tooltip({
    placement : 'bottom'
  });
  jQuery("[rel=right_tooltip]").tooltip({
    placement : 'right'
  });
  jQuery("[rel=left_tooltip]").tooltip({
    placement : 'left'
  });  
  
  // action command show on focus
  jQuery('#action_command').focusin(function() {
    
    jQuery('#action_ui').show();
    
  });
  jQuery('#action_command').focusout(function() {
    
    if (jQuery('#action_run').attr('data-hover')=='true') return;
    jQuery('#action_ui').hide();
    
  });
  jQuery('#action_run').hover(function() {
    
    jQuery('#action_run').attr('data-hover','true');
    
  },function() {
    
    jQuery('#action_run').attr('data-hover','false');
    
  });
  jQuery('#action_run').click(function() {
  
    jQuery('#action_ui').hide();
    
  });
  
  // activate polling of new statistics
  setInterval(_CHRIS_.updateStatistics, 5000);
  
  
});

// activate backstretch
jQuery.backstretch('view/gfx/background1.jpg');