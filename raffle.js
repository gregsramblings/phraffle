/**
* Quick Raffle by Greg Wilson | http://gregsramblings.com | @gregsramblings
* Based on code from Saurabh Odhyan | http://odhyan.com
*
* Licensed under the Creative Commons Attribution-ShareAlike License, Version 3.0 (the "License")
* You may obtain a copy of the License at
* http://creativecommons.org/licenses/by-sa/3.0/
*
* Date: May 12, 2012
*/

$(document).ready(function() {

    var completed = 0,
        imgHeight = 750,
        posArr = [
            0,   //0
            75,  //1
            150, //2
            225, //3
            300, //4
            375, //5
            450, //6
            525, //7
            600, //8
            675  //9
        ];
    

    function Slot(el, max, step) {
        this.speed = 0; //speed of the slot at any point of time
        this.step = step; //speed will increase at this rate
        this.si = null; //holds setInterval object for the given slot
        this.el = el; //dom element of the slot
        this.maxSpeed = max; //max speed this slot can have
        this.pos = null; //final position of the slot    

        $(el).pan({
            fps:20,
            dir:'down'
        });
        $(el).spStop();
    }


    Slot.prototype.start = function() {
        var _this = this;
		$(_this.el).removeClass('slotstopped');

        $(_this.el).spStart();
        _this.si = window.setInterval(function() {
            if(_this.speed < _this.maxSpeed) {
                _this.speed += (_this.step*2);
                $(_this.el).spSpeed(_this.speed);
            } 
			if(_this.speed > 30) {
				$(_this.el).addClass('motion');
			}
        }, 100);
    };


    Slot.prototype.stop = function() {
        var _this = this,
            limit = 30;
        clearInterval(_this.si);
		$(_this.el).addClass('slotstopped');

        _this.si = window.setInterval(function() {
            if(_this.speed > limit) {
                _this.speed -= _this.step;
                $(_this.el).spSpeed(_this.speed);
            }
            if(_this.speed <= limit) {
                _this.finalPos(_this.el);
                $(_this.el).spSpeed(0);
                $(_this.el).spStop();
                clearInterval(_this.si);
                $(_this.el).removeClass('motion');
                _this.speed = 0;
            }
        }, 100);
    };


    Slot.prototype.halt = function() {
        var _this = this,
            limit = 30;
        clearInterval(_this.si);
        _this.finalPos(_this.el);
        $(_this.el).spSpeed(0);
        $(_this.el).spStop();
        clearInterval(_this.si);
        $(_this.el).removeClass('motion');
        _this.speed = 0;
		
    };

    /**
    * @method finalPos
    * Finds the final position of the slot
    */
    Slot.prototype.finalPos = function() {
        var el = this.el,
            el_id,
            pos,
            posMin = 2000000000,
            best,
            bgPos,
            i,
            j,
            k;

        el_id = $(el).attr('id');
        //pos = $(el).css('background-position'); //for some unknown reason, this does not work in IE
        pos = document.getElementById(el_id).style.backgroundPosition;
        pos = pos.split(' ')[1];
        pos = parseInt(pos, 10);

        for(i = 0; i < posArr.length; i++) {
            for(j = 0;;j++) {
                k = posArr[i] + (imgHeight * j);
                if(k > pos) {
                    if((k - pos) < posMin) {
                        posMin = k - pos;
                        best = k;
                        this.pos = posArr[i]; //update the final position of the slot
                    }
                    break;
                }
            }
        }

        best += imgHeight + 0;
        bgPos = "0 " + best + "px";
        $(el).animate({
            backgroundPosition:"(" + bgPos + ")"
        }, {
            duration: 200,
            complete: function() {
                completed ++;
            }
        });
    };
    


    //create slot objects
    var a = new Slot('#slot1', 75, 2),
        b = new Slot('#slot2', 75, 3),
        c = new Slot('#slot3', 75, 4),
        d = new Slot('#slot4', 75, 5);


	// Start and stop
	if ('ontouchstart' in document.documentElement) {
		$('#slot1').on("touchstart",function() { if(a.speed == 0) { a.start(); } else { a.stop(); } });
		$('#slot2').on("touchstart",function() { if(b.speed == 0) { b.start(); } else { b.stop(); } });
		$('#slot3').on("touchstart",function() { if(c.speed == 0) { c.start(); } else { c.stop(); } });
		$('#slot4').on("touchstart",function() { if(d.speed == 0) { d.start(); } else { d.stop(); } });
    } else {
		$('#slot1').on("click",function() { if(a.speed == 0) { a.start(); } else { a.stop(); } });
		$('#slot2').on("click",function() { if(b.speed == 0) { b.start(); } else { b.stop(); } });
		$('#slot3').on("click",function() { if(c.speed == 0) { c.start(); } else { c.stop(); } });
		$('#slot4').on("click",function() { if(d.speed == 0) { d.start(); } else { d.stop(); } });
	}
    


	// for reset button (not used now)
    $('#control').click(function() {
		a.halt();
   		b.halt();
		c.halt();
		d.halt();
		a.start();
		b.start();
		c.start();
		d.start();
    });
    
	// Spin them!
	a.start();
	b.start();
	c.start();
	d.start();
});
