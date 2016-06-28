JSNES
=====

Port of [JSNES](https://github.com/bfirsh/jsnes)

A JavaScript NES emulator.

Build
-----

To build a distribution, you will [Grunt](http://gruntjs.com):

    $ sudo npm install -g grunt-cli

Then run:

    $ npm install
    $ grunt

This will create ``jsnes.js`` and ``jsnes-min.js`` in ``build/``.

Benchmark
---------

The benchmark in ``test/benchmark.js`` is intended for testing JavaScript
engines. It does not depend on a DOM or Canvas element etc.

## Resources

http://www.mariomayhem.com/fun/smb_level_editor/
[Gamehacking memory tips ](http://gamehacking.org/game/31010)

## Mario memory positions

075A Life counter  (max 9)
075E Coin counter (units), if counter reaches 64 (100) it will reset and increment a life
0748 Coin counter (increments continuously, up to FF=255)
07ED Coin counter (decens) (value 0 to 9)
07EE Coin counter (units) (value 0 to 9)
07DF score counter (centens)  (value 0 to 9)
0756 Power-up (0 for small, 1 for mushroom, 2 for fire)
01f7 Pause mode (8A for pause, EF for play)
01f8 Keys (only when game is paused)
07FA Time (units) (value 0 to 9)
074E Stage type (00 water,01,02 ,03)
001D Jump indicator (0 if ground, 1 if jump, 2 if falling)
0016 First enemy on screen (01 red kopa, 06 Goombas. 35 toad, 2D bowser )
0456 Speed modifier (18 = normal walk, 28 = Normal Run)
0770 Game mode (00 mode demo, 01 game, 02 Sorry mario)
000e Game mode (01 climbing tree, 02 entering pipe side ?, 03 enter pipe down 08 game, 05 level end, 07 entering pipe, 04 flag captured, 06 insta-dead)
079f Star mode countdown (if greater than 0, star mode is enabled, starting in 24)
0753 Player controller number (0 player 1, 1 player 2)
075F World counter (0 for world 1, 1 for world 2)
00F0 Music speed modifier (18 is normal, 8 is fast )

Flag Always Gives 5000 pts : 010F:00
Infinite Time 07FA:09
Infinite Time 0787:12
00f4 Song  (40 for star song) ???
001d Is grounded ? (0 if grounded, 1 in air)
075C  Level Text Modifier??
## Debug tips

Add `C2` to the memory next to `0590` to generate an invisible coin in the screen.
C2 Coin
C5 Axe
C0 Block with coin
C1 BLock with mushroom
60 block with life
57 block with star
1F Pipe (left entrance)
25 finish pole
24 finish pole flag
10-11 pipe (up entrance)
