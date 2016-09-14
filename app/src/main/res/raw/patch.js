var avirgin = true;

Hp12c_storage.prototype.save = function() {
	gateway.saveMemory(H.storage.save_memory2(H.machine));
}

Hp12c_storage.prototype.load = function() {
	var sserial;
    sserial = "" + gateway.retrieveMemory();

	if (sserial.length > 0) {
		H.storage.recover_memory2(H.machine, sserial);
	}
	avirgin = false;
};

var old_dispatch = Hp12c_dispatcher.prototype.dispatch;
var old_show = Hp12c_display.prototype.private_show;

Hp12c_dispatcher.prototype.dispatch = function (k)
{
    gateway.touchFeedback();
	old_dispatch.call(H.dispatcher, k);
}

var show_save_handle = 0;

Hp12c_display.prototype.private_show = function (s)
{
	old_show.call(H.display, s);
	if (!avirgin) {
	    if (show_save_handle) {
	        window.clearTimeout(show_save_handle);
	    }
	    show_save_handle = window.setTimeout(function () {
	        H.storage.save();
	        show_save_handle = 0;
	    }, 1000);
	}
}

function setSeparator(separator)
{
    while (H.machine.comma !== separator) {
        H.machine.toggle_decimal_character();
    }
}

function visualFeedback(is_fb)
{
    if ((is_fb && ! H.machine.fb) || (! is_fb && H.machine.fb)) {
        H.machine.toggle_feedback();
    }
}

Hp12c_dispatcher.prototype.functions[41][0] = function () {
    H.storage.save();
    gateway.keyON();
};
Hp12c_dispatcher.prototype.functions[41][0].no_pgrm = 1;

Hp12c_dispatcher.prototype.functions[26][45] = function () {
	gateway.openMenu();
};
Hp12c_dispatcher.prototype.functions[26][45].no_pgrm = 1;

function forceSaveMemory()
{
	H.storage.save();
}

Hp12c_machine.prototype.easter_egg = function () {};

function setRapid(is_rapid)
{
	if (is_rapid) {
		H.machine.rapid_on();
	} else {
		H.machine.rapid_off();
	}
}

Hp12c_dispatcher.prototype.lcd_left = function ()
{
    gateway.lcd_left();
}

Hp12c_dispatcher.prototype.lcd_right = function ()
{
    gateway.lcd_right();
}