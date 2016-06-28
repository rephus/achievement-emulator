/*
JSNES, based on Jamie Sanders' vNES
Copyright (C) 2010 Ben Firshman

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

                // [Memory (0), Value (1) , Title (2), Description (3), Img (4), Triggered (5)]
                self.achievementPopup = function(achievement){
                  console.log("Popping achievement ");
                  var $div = $("<div class='achievement'>" +
                                  "<img src=achievements/"+achievement[4]+".png>"+
                                  "<div class='details'>"+
                                    "<p class='title'>" + achievement[2]+ "</p>"+
                                    "<p class='description'>"+ achievement[3] +"</p>"+
                                  "</div>"+
                               "</div>");
                  $div.appendTo(self.root);

                  //appear div popup
                  $div.animate({
                        right: 20
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
                self.root = $('<div class="tv"></div>');
                self.screen = $('<canvas class="nes-screen" width="256" height="240"></canvas>').appendTo(self.root);

                if (!self.screen[0].getContext) {
                    parent.html("Your browser doesn't support the <code>&lt;canvas&gt;</code> tag. Try Google Chrome, Safari, Opera or Firefox!");
                    return;
                }

                self.nes.audio = {
                   ctx: new AudioContext()
                 };

                self.romContainer = $('<div class="nes-roms"></div>').appendTo(self.root);
                self.romSelect = $('<select></select>').appendTo(self.romContainer);

                self.controls = $('<div class="nes-controls"></div>').appendTo(self.root);
                self.buttons = {
                    pause: $('<input type="button" value="pause" class="nes-pause" disabled="disabled">').appendTo(self.controls),
                    restart: $('<input type="button" value="restart" class="nes-restart" disabled="disabled">').appendTo(self.controls),
                    sound: $('<input type="button" value="enable sound" class="nes-enablesound">').appendTo(self.controls),
                    zoom: $('<input type="button" value="zoom in" class="nes-zoom">').appendTo(self.controls)
                };
                self.status = $('<p class="nes-status">Booting up...</p>').appendTo(self.root);
                self.root.appendTo(parent);

                /*
                 * ROM loading
                 */
                self.romSelect.change(function() {
                    console.log("Loading rom " , self.romSelect);
                    self.loadROM();
                });

                // Load mario game automatically on start
                self.loadROM("roms/mario.nes");
                /*
                 * Buttons
                 */
                self.buttons.pause.click(function() {
                    if (self.nes.isRunning) {
                        self.nes.stop();
                        self.updateStatus("Paused");
                        self.buttons.pause.attr("value", "resume");
                    }
                    else {
                        self.nes.start();
                        self.buttons.pause.attr("value", "pause");
                    }
                });

                self.buttons.restart.click(function() {
                    self.nes.reloadRom();
                    self.nes.start();
                });

                self.buttons.sound.click(function() {
                    if (self.nes.opts.emulateSound) {
                        self.nes.opts.emulateSound = false;
                        self.buttons.sound.attr("value", "enable sound");
                    }
                    else {
                        self.nes.opts.emulateSound = true;
                        self.buttons.sound.attr("value", "disable sound");
                    }
                });
                self.nes.opts.emulateSound = true;


                self.zoomed = false;
                self.buttons.zoom.click(function() {
                    if (self.zoomed) {
                        self.screen.animate({
                            width: '256px',
                            height: '240px'
                        });
                        self.buttons.zoom.attr("value", "zoom in");
                        self.zoomed = false;
                    }
                    else {
                        self.screen.animate({
                            width: '512px',
                            height: '480px'
                        });
                        self.buttons.zoom.attr("value", "zoom out");
                        self.zoomed = true;
                    }
                });

                self.screen.animate({
                    width: '580px',
                    height: '480px'
                });
                self.buttons.zoom.attr("value", "zoom out");
                //self.zoomed = true;

                /*
                 * Lightgun experiments with mouse
                 * (Requires jquery.dimensions.js)
                 */
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
                /*Unsynced terrible flash plugin

                self.dynamicaudio = new DynamicAudio({
                    swf: nes.opts.swfPath+'dynamicaudio.swf'
                });*/

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
                    self.updateStatus("Downloading...");
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
                    this.buttons.pause.attr("disabled", null);
                    if (this.nes.isRunning) {
                        this.buttons.pause.attr("value", "pause");
                    }
                    else {
                        this.buttons.pause.attr("value", "resume");
                    }
                    this.buttons.restart.attr("disabled", null);
                    if (this.nes.opts.emulateSound) {
                        this.buttons.sound.attr("value", "disable sound");
                    }
                    else {
                        this.buttons.sound.attr("value", "enable sound");
                    }
                },

                updateStatus: function(s) {
                    this.status.text(s);
                },

                setRoms: function(roms) {
                    console.log("Loading roms ", roms);
                    this.romSelect.children().remove();
                    $("<option>Select a ROM...</option>").appendTo(this.romSelect);
                    for (var groupName in roms) {
                        if (roms.hasOwnProperty(groupName)) {
                            var optgroup = $('<optgroup></optgroup>').
                                attr("label", groupName);
                            for (var i = 0; i < roms[groupName].length; i++) {
                                $('<option>'+roms[groupName][i][0]+'</option>')
                                    .attr("value", roms[groupName][i][1])
                                    .appendTo(optgroup);
                            }
                            this.romSelect.append(optgroup);
                        }
                    }
                },

                writeAudio: function(samples) {
                    //return this.dynamicaudio.writeInt(samples);

                    //https://github.com/davidmarkclements/jsnes/commit/8a4a2244255114aa03d5da2ac0e54ddfb7aa1824#diff-478c5384d0b4a5ca4c1a8e27f9a68c08
                    /* WARNING PUT SOUND TO A MINIMUM */
                    //Synced audio but bad quality
                  /*   var ctx = this.nes.audio.ctx;

                    var buffer = ctx.createBuffer(2, samples.length * 2, ctx.sampleRate);
                    var source = ctx.createBufferSource();
                    source.buffer = buffer;
                    var l = buffer.getChannelData(0);
                    var r = buffer.getChannelData(1);
                    var sample = new Float32Array(new Uint16Array(samples).buffer);

                    l.set(sample);
                     r.set(sample);
                     source.connect(ctx.destination);
                     source.start();*/

                     if (this.dynamicaudio) {
                        return this.dynamicaudio.writeInt(samples);

                    }

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
                }
            };

            return UI;
        };
    })(jQuery);
}
