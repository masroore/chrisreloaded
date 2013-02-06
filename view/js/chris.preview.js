/**
 * Define the _PREVIEW_ namespace
 */
var _PREVIEW_ = _PREVIEW_ || {};
//
// example:
// _PREVIEW_.start('2D','volume','/path/to/volume.nii');
// or
// _PREVIEW_.start('3D','fibers','/path/to/fibers.trk');
//
_PREVIEW_.start = function(renderertype, filetype, filepath) {
  _PREVIEW_.renderertype = renderertype;
  _PREVIEW_.filepath = filepath;
  _PREVIEW_.filetype = filetype;
  _PREVIEW_.target = '';
  
  if (renderertype == 'text') {
    _PREVIEW_.target = '#MODAL_TEXT';
    // jQuery('#PREVIEWMODAL').addClass('largePreview');
  } else if (renderertype == 'plugin') {
    _PREVIEW_.target = '#MODAL_PLUGIN';
  } else {
    _PREVIEW_.target = '#MODAL_WEBGL';
    // XTK preview
    if (_PREVIEW_.filetype == 'volume') {
      $(_PREVIEW_.target).find('#BR_OVER').show();
    } else {
      $(_PREVIEW_.target).find('#BR_OVER').hide();
    }
  }
  // general modal settings
  // always center the modal
  $(_PREVIEW_.target).css('margin-left',
      jQuery(_PREVIEW_.target).outerWidth() / 2 * -1);
  // Top Left overlay
  $("#TL_OVER").html(
      'Retrieving data <i class="icon-refresh icon-white rotating_class">');
  $("#TL_OVER").show();
  // show title 'Loading..'
  $(_PREVIEW_.target).find('#PREVIEWLABEL').html('Loading..');
  // show modal
  $(_PREVIEW_.target).modal();
}
// use function to get aprent name
_PREVIEW_.preview = function() {
  // clear the label
  $(_PREVIEW_.target).find('#PREVIEWLABEL').html(
      _PREVIEW_.filepath.split('/').pop());
  if (_PREVIEW_.renderertype == 'text') {
    // text/log preview
    // hide loading overlay
    $(_PREVIEW_.target).find("#TL_OVER").hide();
    // grab the text file
    jQuery.ajax({
      url : 'api.php?action=get&what=file&parameters=' + _PREVIEW_.filepath,
      dataType : "text"
    }).done(
        function(data) {
          $(_PREVIEW_.target).find('#TEXT_PREVIEW').find('#textPreview').append(
          data);
        });
    // refresh the log every 500 ms
    _PREVIEW_.refresher = setInterval(function() {
      if (!$(_PREVIEW_.target).find('#AUTOREFRESHCHECKBOX').prop('checked'))
        return;
      jQuery.ajax({
        url : 'api.php?action=get&what=file&parameters=' + _PREVIEW_.filepath,
        dataType : "text"
      }).done(
          function(data) {
            $(_PREVIEW_.target).find('#textPreview').html(data);
            $(_PREVIEW_.target).find('#textPreview').scrollTop(
                $(_PREVIEW_.target).find("#textPreview")[0].scrollHeight);
          });
    }, 500);
  } else if (_PREVIEW_.renderertype == 'plugin') {
    // plugin preview
    // hide loading overlay
    $(_PREVIEW_.target).find("#TL_OVER").hide();
    topiframe = '<iframe style="width: 100%; height: 700px; border: none" src="';
    endiframe = '"></iframe>';
    $(_PREVIEW_.target).find('#PLUGIN_PREVIEW').html(
        topiframe + _PREVIEW_.filepath + endiframe);
  } else {
    // webgl preview
    $(_PREVIEW_.target).find("#TL_OVER").html('Creating visualization...');
    // set XTK renderer
    _PREVIEW_.object = eval('new X.' + _PREVIEW_.filetype + '()');
    _PREVIEW_.object.file = 'api.php?action=get&what=file&parameters='
        + _PREVIEW_.filepath;
    _PREVIEW_.object.reslicing = false; // we don't need to reslice here
    _PREVIEW_.renderer = eval('new X.renderer' + _PREVIEW_.renderertype + '()');
    _PREVIEW_.renderer.container = 'WEBGL_PREVIEW';
    _PREVIEW_.renderer.orientation = 'Z';
    _PREVIEW_.renderer.init();
    _PREVIEW_.renderer.add(_PREVIEW_.object);
    _PREVIEW_.renderer.render();
    if (_PREVIEW_.renderertype == '3D') {
      _PREVIEW_.renderer.camera.position = [ 0, 0, 300 ];
    }
    _PREVIEW_.renderer.onShowtime = function() {
      // hide overlay
      $(_PREVIEW_.target).find("#TL_OVER").hide();
      if (_PREVIEW_.filetype == 'volume') {
        // for volumes, create and setup the slider
        var dim = _PREVIEW_.object.dimensions;
        // init slider
        $(_PREVIEW_.target).find("#PREVIEWSLIDER").slider({
          min : 1,
          max : dim[2],
          value : Math.floor(_PREVIEW_.object.indexZ + 1),
          slide : function(event, ui) {
            _PREVIEW_.object.indexZ = ui.value - 1;
            $(_PREVIEW_.target).find("#SLICE").html(ui.value);
          }
        });
        // also make sure that the little slider thing is in the middle
        $(_PREVIEW_.target).find('.ui-slider-handle').css('top', '-.2em');
        _PREVIEW_.renderer.onScroll = function() {
          $(_PREVIEW_.target).find('#PREVIEWSLIDER').slider("option", "value",
              Math.floor(_PREVIEW_.object.indexZ + 1));
          $(_PREVIEW_.target).find("#SLICE").html(
              Math.floor(_PREVIEW_.object.indexZ + 1));
        };
        $(_PREVIEW_.target).find("#SLICE").html(
            Math.floor(_PREVIEW_.object.indexZ + 1));
        $(_PREVIEW_.target).find("#SLICE_NB").html(dim[2]);
      }
    }
  }
}
jQuery(document).ready(function() {
  // XTK variables
  _PREVIEW_.renderer = null;
  _PREVIEW_.renderertype = null;
  _PREVIEW_.filepath = null;
  _PREVIEW_.filetype = null;
  _PREVIEW_.object = null; // volume, fibers, mesh etc.
  _PREVIEW_.target = ''; // target modal ID
  // connect the 'shown' event for all modals
  $('.modal').each(function() {
    $(this).on('shown', function() {
      _PREVIEW_.preview();
    });
  });
  // connect the 'hidden' event
  $('.modal').each(function() {
    $(this).on('hidden', function() {
      // empty description
      $(this).find('#PREVIEWLABEL').html("");
      $(this).find("#TL_OVER").show();
    });
  });
  // webgl specific
  $('#MODAL_WEBGL').on('hidden', function() {
    // delete XTK stuff
    if (_PREVIEW_.renderer != null) {
      _PREVIEW_.renderer.destroy();
      delete _PREVIEW_.renderer;
      _PREVIEW_.renderer = null;
    }
    if (_PREVIEW_.object != null) {
      delete _PREVIEW_.object;
      _PREVIEW_.object = null;
    }
    if (_PREVIEW_.filetype == 'volume') {
      // destroy slider
      $(this).find("#PREVIEWSLIDER").slider("destroy");
    }
  });
  // text specific
  $('#MODAL_TEXT').on('hidden', function() {
    clearInterval(_PREVIEW_.refresher);
  });
  // create toogle button
  $('#MODAL_TEXT').find('#AUTOREFRESH').toggleButtons({
    height : 10,
    width : 60,
    font : {
      'font-size' : '11px'
    }
  });
});
