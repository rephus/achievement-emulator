/*
Retrophies, based on Ben Firshman' JSNES
Copyright (C) 2016 Javier Rengel

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var canvas;

JSNES.DummyUI = function(nes) {
    this.nes = nes;
    this.enable = function() {};
    this.updateStatus = function() {};
    this.writeAudio = function() {};
    this.writeFrame = function() {};
};

if (typeof jQuery !== 'undefined') {
    (function($) {
        $.fn.JSNESUI = function(roms) {
            var parent = this;
            var UI = function(nes) {
                var self = this;
                self.nes = nes;

                var enableAchievementsUI = function(){

                  $(".achievement-hide").animate({ right: 0  });

                };

                //LOad achievements list
                var updateAchievementList = function(){
                  var achievements = self.nes.achievements.list;

                  $("#achievements-panel").show();
                  $achievementList = $("#achievements-list");
                  $achievementList.empty(); //reset list
                  for (var i in achievements) {
                    var achievement = achievements[i];
                    var secret = "";
                    var title = achievement[2];
                    var description =  achievement[3];
                    if (achievements[i][5] !== true) {
                      secret = "secret";
                      title = title.replace(/./g,'?');
                      description = description.replace(/./g,'?');
                    }
                    $achievementList.append('<li class="achievement-item ">'+
                                    "<img class='"+secret+"'src=achievements/"+achievement[4]+".png>"+
                                    "<span class='title'>" + title+ "</span>"+
                                    "<span class='description'>"+ description +"</span>"+
                    '</li>');
                  }
                };

                //updateAchievementList();

                // [Memory (0), Value (1) , Title (2), Description (3), Img (4), Triggered (5)]
                self.achievementPopup = function(achievement){

                  amplitude.getInstance().logEvent('achievement '+achievement[2]);

                  updateAchievementList();
                  enableAchievementsUI();
                  console.log("Popping achievement ");
                  var $div = $("<div class='achievement'>" +
                                  "<img src=achievements/"+achievement[4]+".png>"+
                                  "<div class='details'>"+
                                    "<p class='title'>" + achievement[2]+ "</p>"+
                                    "<p class='description'>"+ achievement[3] +"</p>"+
                                  "</div>"+
                               "</div>");
                  $div.appendTo($("body"));

                  //appear div popup
                  $div.animate({
                        right: 0
                  });

                  //dissappear and remove div popup
                  setTimeout(function(){
                    $div.animate({
                          right: -200
                    }, function() {
                      $div.remove(); // on animation finish, remove
                    });
                  }, 3000); //Hide after 3 seconds
                };
                /*
                 * Create UI
                 */
                self.root = $('<div class="root"></div>');
                self.screen = $('<canvas id="canvas" class="nes-screen" width="256" height="240"></canvas>').appendTo($("#emulator"));

                setWindowSize = function(){
                windowHeight = $(window).height();
                  if (windowHeight > 600) {
                    self.screen.animate({
                        width: '580px',
                        height: '480px'
                    });
                    $("#emulator-panel .background").css('height', Math.max(700, windowHeight));
                  } else {
                    self.screen.animate({
                        width: '256px',
                        height: '240px'
                    });
                    $("#emulator-panel .background").css('height', Math.max(500, windowHeight));
                  }
                };
                setWindowSize();
                $(window).resize(function(){
                    setWindowSize();
                });

                if (!self.screen[0].getContext) {
                    parent.html("Your browser doesn't support the <code>&lt;canvas&gt;</code> tag. Try Google Chrome, Safari, Opera or Firefox!");
                    return;
                }

                self.nes.audio = {
                   ctx: new AudioContext()
                 };

                 function clone(src) {
                 	 return jQuery.extend(true, {}, src);
                 }

                $(".tweet-button").click(function(){
                  var achievements = self.nes.achievements.list;

                   var achieved = 0;
                   for (var i in achievements) if (achievements[i][5] === true) achieved++; //triggered

                     var plainUrl= "http://retrophies.win";
                     var url = encodeURIComponent(plainUrl);
                     var tag = "retrophies";
                     var tweetBody = "Got "+achieved+ " of " + achievements.length + " trophies in Super Mario Bros for #Nintendo on #Retrophies "+plainUrl +" via @Coconauts";
                     tweetBody = encodeURIComponent(tweetBody);
                     var twitterUrl="https://twitter.com/intent/tweet?original_referer="+url+"&amp;ref_src="+tag+"&amp;related="+tag+"&amp;text="+tweetBody+"&amp;tw_p=tweetbutton";//&amp;url="+url+"&amp;"//hashtags="+tag+"&amp;via="+tag;
                     window.open(twitterUrl);
                  });

                  self.nes.opts.emulateSound = true;

                  $(".mute-button").click(function(){

                    if (self.nes.opts.emulateSound) {
                      $(this).attr('src', '/images/mute-on.png');
                    } else {
                      $(this).attr('src', '/images/mute-off.png');
                    }

                    self.nes.opts.emulateSound = !self.nes.opts.emulateSound;
                  });

                 var rompath = "mario";
                 $(".save-button").click(function(){

                   var currData = self.nes.toJSON();
                   var saveData = JSON.stringify(currData);
                   localStorage.setItem(rompath, saveData);

                  $(".load-button").removeClass('disabled');

                  amplitude.getInstance().logEvent('save game');

                 });

                 if ( localStorage.getItem(rompath)) {
                   $(".load-button").removeClass('disabled');
                 }

                 $(".load-button").click(function(){

                      var saveData = localStorage.getItem(rompath);
                      if( saveData === null ) {
                          console.log("nothing to load");
                          return;
                      }

                      var decodedData = JSON.parse(saveData);
                      self.nes.fromJSON(decodedData);
                      self.nes.start();

                      updateAchievementList();
                      enableAchievementsUI();

                      amplitude.getInstance().logEvent('load game');

                 });

                self.root.appendTo(parent);

                self.loadROM("roms/mario.nes");

                if ($.offset) {
                    self.screen.mousedown(function(e) {
                        if (self.nes.mmap) {
                            self.nes.mmap.mousePressed = true;
                            // FIXME: does not take into account zoom
                            self.nes.mmap.mouseX = e.pageX - self.screen.offset().left;
                            self.nes.mmap.mouseY = e.pageY - self.screen.offset().top;
                        }
                    }).mouseup(function() {
                        setTimeout(function() {
                            if (self.nes.mmap) {
                                self.nes.mmap.mousePressed = false;
                                self.nes.mmap.mouseX = 0;
                                self.nes.mmap.mouseY = 0;
                            }
                        }, 500);
                    });
                }

                if (typeof roms != 'undefined') {
                    self.setRoms(roms);
                }

                /*
                 * Canvas
                 */
                self.canvasContext = self.screen[0].getContext('2d');

                if (!self.canvasContext.getImageData) {
                    parent.html("Your browser doesn't support writing pixels directly to the <code>&lt;canvas&gt;</code> tag. Try the latest versions of Google Chrome, Safari, Opera or Firefox!");
                    return;
                }

                self.canvasImageData = self.canvasContext.getImageData(0, 0, 256, 240);
                self.resetCanvas();

                /*
                 * Keyboard
                 */
                $(document).
                    bind('keydown', function(evt) {
                        self.nes.keyboard.keyDown(evt);
                    }).
                    bind('keyup', function(evt) {
                        self.nes.keyboard.keyUp(evt);
                    }).
                    bind('keypress', function(evt) {
                        self.nes.keyboard.keyPress(evt);
                    });

                /*
                 * Sound
                 */

                //https://github.com/bfirsh/jsnes/pull/45/files
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
               try {
                     self.audio = new AudioContext();
                 } catch(e) {
                     // lets fallback to Flash (for Internet Explorer 8-11)
                     self.dynamicaudio = new DynamicAudio({
                         swf: nes.opts.swfPath+'dynamicaudio.swf'
                     });
                 }
            };

            UI.prototype = {
                /** Load game rom specified in parameter,
                if parameter `rom` is null, then previous default
                rom is loaded (self.romSelect.val()) **/
                loadROM: function(rom) {
                    var self = this;
                    //self.updateStatus("Downloading...");
                    if (!rom) rom = self.romSelect.val();
                    $.ajax({
                        url: escape(rom),
                        xhr: function() {
                            var xhr = $.ajaxSettings.xhr();
                            if (typeof xhr.overrideMimeType !== 'undefined') {
                                // Download as binary
                                xhr.overrideMimeType('text/plain; charset=x-user-defined');
                            }
                            self.xhr = xhr;
                            return xhr;
                        },
                        complete: function(xhr, status) {
                            var i, data;
                            if (JSNES.Utils.isIE()) {
                                var charCodes = JSNESBinaryToArray(
                                    xhr.responseBody
                                ).toArray();
                                data = String.fromCharCode.apply(
                                    undefined,
                                    charCodes
                                );
                            }
                            else {
                                data = xhr.responseText;
                            }
                            self.nes.loadRom(data);
                            self.nes.start();
                            self.enable();
                            self.nes.achievements.start();
                        }
                    });
                },

                resetCanvas: function() {
                    this.canvasContext.fillStyle = 'black';
                    // set alpha to opaque
                    this.canvasContext.fillRect(0, 0, 256, 240);

                    // Set alpha
                    for (var i = 3; i < this.canvasImageData.data.length-3; i += 4) {
                        this.canvasImageData.data[i] = 0xFF;
                    }
                },

                /*
                *
                * nes.ui.screenshot() --> return <img> element :)
                */
                screenshot: function() {
                    var data = this.screen[0].toDataURL("image/png"),
                        img = new Image();
                    img.src = data;
                    return img;
                },

                /*
                 * Enable and reset UI elements
                 */
                enable: function() {
                },

                updateStatus: function(s) {
                },

                setRoms: function(roms) {

                },

                writeAudio: function(samples) {

                    // Create output buffer (planar buffer format)
                    var buffer = this.audio.createBuffer(2, samples.length, this.audio.sampleRate);
                    var channelLeft = buffer.getChannelData(0);
                    var channelRight = buffer.getChannelData(1);

                    // Convert from interleaved buffer format to planar buffer
                    // by writing right into appropriate channel buffers
                    var j = 0;
                    for (var i=0; i < samples.length; i+=2) {
                        channelLeft[j] = this.intToFloatSample(samples[i]);
                        channelRight[j] = this.intToFloatSample(samples[i+1]);
                        j++;
                    }

                    // Create sound source and play it
                    var source = this.audio.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this.audio.destination); // Output to sound card
                    source.start();
             },
                // Local helper function to convert Int output to Float
                // TODO: remove intToFloat and revise papu.js -> sample()
                //       to return AudioBuffer/Float32Array output used in HTML5 WebAudio API
                intToFloatSample: function(value) {
                    return value / 32767; // from -32767..32768 to -1..1 range
                },


                writeFrame: function(buffer, prevBuffer) {
                    var imageData = this.canvasImageData.data;
                    var pixel, i, j;

                    for (i=0; i<256*240; i++) {
                        pixel = buffer[i];

                        if (pixel != prevBuffer[i]) {
                            j = i*4;
                            imageData[j] = pixel & 0xFF;
                            imageData[j+1] = (pixel >> 8) & 0xFF;
                            imageData[j+2] = (pixel >> 16) & 0xFF;
                            prevBuffer[i] = pixel;
                        }
                    }

                    this.canvasContext.putImageData(this.canvasImageData, 0, 0);

                    //Locate this method in websocket
                    drawMultiplayer(this.canvasContext);

                }
            };

            return UI;
        };
    })(jQuery);
}
