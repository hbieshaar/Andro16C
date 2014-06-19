/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */

"use strict";

var H = {};
H.type = "16c";
H.touch_display = false;
H.vertical_layout = false;
H.embedded = false;

H.disp_theo_width = 700.0;
H.disp_theo_height = 438.0;
H.disp_key_offset_x = 44.0;
H.disp_key_offset_y = 151.0;
H.disp_key_width = 54;
H.disp_key_height = 50;
H.disp_key_dist_x = (606.0 - 44.0) / 9;
H.disp_key_dist_y = (364.0 - 151.0) / 3;
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.getElem = function (id)
{
	return document.getElementById(id);
};

H.badnumber = function (res)
{
	return (isNaN(res) || ! isFinite(res));
};

H.clamp = function (res)
{
	res = res || 0; // just in case it is NaN
	res = Math.max(res, -H.value_max);
	res = Math.min(res, H.value_max);
	return res;
};

H.binary_sgn = function (val)
{
	return (val >= 0 ? 1 : -1);
};

H.cl5_round = function (val, decs)
{
	var scale = Math.pow(10, decs);
	return Math.round(Math.abs(val) * scale) / scale * H.binary_sgn(val);
};

H.trim = function (stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g, "");
};

H.zeropad = function (s, n)
{
	s = "" + s;
	while (s.length < n) {
		s = "0" + s;
	}
	return s;
};

H.i18n = function (s, comma, dp0, grouping)
{
	// dp0 means: add decimal point after a whole number

	if (! grouping) {
		grouping = 3;
	}

	var dpos = s.indexOf('.');

	if (dpos == -1 && dp0) {
		s += ".";
		dpos = s.length - 1;
	}

	if (dpos != -1 && comma) {
		s = s.slice(0, dpos) + ',' + s.slice(dpos + 1);
	}

	if (dpos == -1) {
		// phantom position to satisfy loop ahead
		dpos = s.length;
	}

	var ts = comma ? "." : ",";

	var dstop = 0;
	while (dstop < s.length && isNaN(parseInt(s.charAt(dstop), 16))) {
		++dstop;
	}

	for (var e = dpos - grouping; e > dstop; e -= grouping) {
		s = s.slice(0, e) + ts + s.slice(e);
	}

	return s;
};

H.tzoffset = function (d)
{
	// returns the time zone offset, expressed as "hours *behind* UTC".
	// that would be 180 minutes for Brazil (-0300) and -60 minutes for Germany (+0100)
	return d.getTimezoneOffset() * 60000;
};

H.date_check = function (year, month, day)
{
	var daymax = 31;
	if (month == 4 || month == 6 || month == 9 || month == 11) {
		daymax = 30;
	} else if (month == 2) {
		daymax = 28;
		if ((year % 4) === 0 && (((year % 100) !== 0) || ((year % 400) === 0))) {
			// leap: divisible by 4 and not ending with 00
			//       years ending in 00 but divisible by 400 are leap!
			daymax = 29;
		}
	}
	if (day <= 0 || day > daymax || year <= 0 || year > 9999 || month <= 0 || month > 12) {
		return 0;
	}
	return 1;
};

H.date_interpret = function (n, dmy)
{
	n = Math.round(Math.abs(n) * 1000000);
	var day = Math.round(n / 1000000) % 100;
	var month = Math.round(n / 10000) % 100;
	var year = Math.round(n % 10000);

	if (! dmy) {
		var tmp = day;
		day = month;
		month = tmp;
	}

	if (! H.date_check(year, month, day)) {
		return null;
	}

	// set date at noon, so daylight savings timezone transtion will not change the day.
	return new Date(year, month - 1, day, 12, 0, 0); 
};

H.date_diff = function (d1, d2)
{
	// Dates' timezones may be different because of daylight savings, so we
	// need to compensate for.
	//
	// Math.round could be enough to do this compensation, but we prefer to
	// be twice as safe.
	
	return Math.round(((d2.getTime() - H.tzoffset(d2)) - (d1.getTime() - H.tzoffset(d1))) / 86400000);
};

H.date_add = function (dbase, days)
{
	// daylight savings timezone not a problem as long as dbase is > 1:01am,
	// so even 1 or 2 hour changes will not change the day.
	dbase.setTime(dbase.getTime() + Math.floor(days) * 86400000);
};

H.date_diff30 = function (d1, d2)
{
	var dd1 = d1.getDate();
	var dd2 = d2.getDate();
	var z1 = dd1;
	var z2 = dd2;

	if (dd1 == 31) {
		z1 = 30;
	}

	if (dd2 == 31) {
		if (dd1 >= 30) {
			z2 = 30;
		}
	}

	var fdt1 = 360 * d1.getFullYear() + 30 * (d1.getMonth() + 1) + z1;
	var fdt2 = 360 * d2.getFullYear() + 30 * (d2.getMonth() + 1) + z2;

	return fdt2 - fdt1;
};

H.date_gen = function (dd, dmy)
{
	if (dmy) {
		return dd.getDate() + (dd.getMonth() + 1) / 100 + dd.getFullYear() / 1000000;
	} else {
		return (dd.getMonth() + 1) + dd.getDate() / 100 + dd.getFullYear() / 1000000;
	}
};

H.date_to_show = function (dd, dmy)
{
	var dow = dd.getDay();
	if (dow === 0) {
		dow = 7;
	}
	return H.date_gen(dd, dmy).toFixed(6) + "  " + dow;
};

H.is_12c = function ()
{
	return H.type === "12c" ||
		H.type === "12c-platinum" ||
		H.type === "12c-bs";
};

/* Some browsers don't have console.log */
window.console = window.console || {};
window.console.log = window.console.log || function (msg) {};
if (typeof console === "undefined") {
	console = window.console;
}
console.log = console.log || window.console.log;

H.type_cookie = "hp12c";
if (H.type === "12c-platinum") {
	H.type_cookie = "hp12cpl";
} else if (H.type === "12c-bs") {
	H.type_cookie = "hp12cbs";
} else if (H.type === "11c") {
	H.type_cookie = "hp11c";
} else if (H.type === "15c") {
	H.type_cookie = "hp15c";
} else if (H.type === "16c") {
	H.type_cookie = "hp16c";
}

H.INTERACTIVE = 0;
H.PROGRAMMING = 1;
H.RUNNING = 2;
H.RUNNING_STEP = 3;

// financial constants (12c)
H.FIN_N = 0;
H.FIN_I = 1;
H.FIN_PV = 2;
H.FIN_PMT = 3;
H.FIN_FV = 4;

// Statistics (map to stomemory)
H.STAT_N  = 1;
H.STAT_X  = 2;
H.STAT_X2 = 3;
H.STAT_Y  = 4;
H.STAT_Y2 = 5;
H.STAT_XY = 6;

if (H.type === "11c") {
	H.STAT_N  = 0;
	H.STAT_X  = 1;
	H.STAT_X2 = 2;
	H.STAT_Y  = 3;
	H.STAT_Y2 = 4;
	H.STAT_XY = 5;
} else if (H.type === "15c") {
	H.STAT_N  = 2;
	H.STAT_X  = 3;
	H.STAT_X2 = 4;
	H.STAT_Y  = 5;
	H.STAT_Y2 = 6;
	H.STAT_XY = 7;
}

H.STAT_MIN = H.STAT_N;
H.STAT_MAX = H.STAT_XY;

// 11C
H.TRIGO_DEG = 0;
H.TRIGO_RAD = 1;
H.TRIGO_GRAD = 2;

// 11C, 15C
H.NOTATION_FIX = 0;
H.NOTATION_SCI = 1;
H.NOTATION_ENG = 2;

// 16C
H.NOTATION_INT = 10; // just for comparisons
H.NOTATION_INT_DEC = H.NOTATION_INT + 1;
H.NOTATION_INT_HEX = H.NOTATION_INT + 2;
H.NOTATION_INT_OCT = H.NOTATION_INT + 3;
H.NOTATION_INT_BIN = H.NOTATION_INT + 4;

H.DEFAULT_WORDSIZE = 16;

H.win_digits = [];
H.win_digits[H.NOTATION_INT_HEX] = 8;
H.win_digits[H.NOTATION_INT_OCT] = 8;
H.win_digits[H.NOTATION_INT_DEC] = 8; // or 10?
H.win_digits[H.NOTATION_INT_BIN] = 8;

H.digit_bits = [];
H.digit_bits[H.NOTATION_INT_HEX] = 4;
H.digit_bits[H.NOTATION_INT_OCT] = 3;
H.digit_bits[H.NOTATION_INT_DEC] = Math.log(10) / Math.log(2); // ~3.32 bits
H.digit_bits[H.NOTATION_INT_BIN] = 1;

H.radix = [];
H.radix[H.NOTATION_INT_HEX] = 16;
H.radix[H.NOTATION_INT_OCT] = 8;
H.radix[H.NOTATION_INT_BIN] = 2;
H.radix[H.NOTATION_INT_DEC] = 10;
// just to simplify some functions that query radix
H.radix[H.NOTATION_FIX] = 10;
H.radix[H.NOTATION_SCI] = 10;
H.radix[H.NOTATION_ENG] = 10;

H.radix_suffix = [];
H.radix_suffix[H.NOTATION_INT_HEX] = "h";
H.radix_suffix[H.NOTATION_INT_OCT] = "o";
H.radix_suffix[H.NOTATION_INT_DEC] = "d";
H.radix_suffix[H.NOTATION_INT_BIN] = "b";

H.value_max = 9.999999 * Math.pow(10, 99);
H.value_min = Math.pow(10, -99);

// 12C defaults
H.ram_MAX = 100;
H.ram_ADDR_SIZE = 2; // e.g. 43.33.00, 43 and 33 are 2 digits
H.STOP_INSTRUCTION = "43.33.00"; // e.g. GTO 00 has 2-digit addr
H.STOP_INSTRUCTION_IS_INVALID = false;
H.INSTRUCTION_SIZE = 2; // size of a non-addr opcode
H.INSTRUCTION_MAX = 100;
H.INSTRUCTION_TOKENS = 3; // e.g. 43.33.00 has 3 tokens

// 12c-BS has the same defaults as 12C vanilla

if (H.type === "12c-platinum") {
	H.ram_MAX = 400;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "43.33.000";
} else if (H.type === "11c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "16c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "15c") {
	H.ram_MAX = 322;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
	H.INSTRUCTION_TOKENS = 4; // big 15c exception
}

H.MEM_MAX = 20;

// 12C-BS the same defaults as vanilla

if (H.type == "12c-platinum") {
	H.MEM_MAX = 30;
} else if (H.type == "16c") {
	H.MEM_MAX = 100;
} else if (H.type === "15c") {
	H.MEM_MAX = 66;
}

H.FLAGS_MAX = 2;

if (H.type === "16c") {
	H.FLAGS_MAX = 6;
} else if (H.type === "15c") {
	H.FLAGS_MAX = 10;
}

// 16C flags
H.FLAG_ZEROS = 3;
H.FLAG_CARRY = 4;
H.FLAG_OVERFLOW = 5;

// 15C flags
H.FLAG_COMPLEX = 8;
if (H.type === "15c") {
	H.FLAG_OVERFLOW = 9;
}

// ############### Errors
H.ERROR_DIVZERO = 0;
H.ERROR_OVERFLOW = 1;
H.ERROR_STAT = 2;
H.ERROR_IP = 4;

// 11C, 15C
H.ERROR_INDEX = 3;
H.ERROR_RTN = 5;
H.ERROR_FLAG = 6;

// 15C
H.ERROR_MATRIX_OP = 1;
H.ERROR_RECURSIVE_SOLVE = 7;
H.ERROR_NO_ROOT = 8;
H.ERROR_MATRIX_ARG = 11;
// H.ERROR_DEFECTIVE = 9; // same as 16c, never happens in this simulator

// 12C
H.ERROR_IRR = 3;
H.ERROR_INTEREST = 5;
H.ERROR_MEMORY = 6;
H.ERROR_IRR2 = 7;
H.ERROR_DATE = 8;

// 16C
H.ERROR_IMPROPER_N = 1;
H.ERROR_IMPROPER_BIT = 2;
// H.ERROR_INDEX = 3; // STO register number invalid, same as 11C
// H.ERROR_IP = 4; // same as 11C, 12C
// H.ERROR_RTN = 5 // same as 11C (GOSUB-related error)
H.ERROR_NUMBERFORMAT = 6; // 16C-exclusive, floating point x integer number format
H.ERROR_DEFECTIVE = 9; // same as 15c, never happens in this simulator

H.check_closure_args = function (args)
{
	// replaced by actual checking at unittest_main
};

H.make_closure = function (fname, args, asm)
{
	H.check_closure_args(args);

	var f = function () {
		H.machine[fname].apply(H.machine, args);
	};

	f.closure_type = "machine";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.make_pgrm_closure = function (fname, arg, asm)
{
	var f = function () {
		H.pgrm[fname].call(H.pgrm, arg);
	};

	f.closure_type = "pgrm";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.delay = function (f, ms)
{
	return window.setTimeout(f, ms);
};

H.cancel_delay = function (handle)
{
	return window.clearTimeout(handle);
};

H.defer = function (f)
{
	return H.delay(f, 0);
};

H.error = function (msg)
{
	console.log(msg);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_debug(format_result)
{
	var self = this;

	self.memwin = null;
	self.format_result = format_result;
}

Hp12c_debug.prototype.format_result_i = function (t)
{
	var self = this;

	var it = {r: t.i, i: t.r, h: t.h};
	return self.format_result(it);
};

Hp12c_debug.prototype.format_matrix = function (t)
{
	var self = this;

	var size = H.machine.matrix_size(t.r);

	return "Mat " +
		(10 + t.r - 20).toString(16).toUpperCase() +
		" (" + size[0] + "x" + size[1] + ")";
};

Hp12c_debug.prototype.show_memory2 = function ()
{
	var self = this;

	if (! self.memwin || ! self.memwin.document) {
		// window has been closed; don't schedule updates anymore
		self.memwin = null;
		return;
	}

	var windoc = self.memwin.document;
	var now = new Date();
	var title = windoc.getElementById('tt');
	var e;

	if (title) {
		title.innerHTML = H.type + " memory at " + now;

		if (H.is_12c()) {
			for (e = 0; e < H.machine.finmemory.length; ++e) {
				windoc.getElementById("finmemory" + e).innerHTML =
					self.format_result({r: H.machine.finmemory[e]});
			}
		}
		for (e = 0; e < H.machine.stomemory.length; ++e) {
			var elem = windoc.getElementById("stomemory" + e);
			if (! elem && e >= 32) {
				// pardon (16c has *lots* of memory)
				continue;
			}
			elem.innerHTML =
				self.format_result(H.machine.sto_tuple(e));
		}
		if (H.is_12c()) {
			for (e = 0; e < H.machine.njmemory.length; ++e) {
				windoc.getElementById("njmemory" + e).innerHTML =
					self.format_result({r: H.machine.njmemory[e]});
			}
		}
		if (H.machine.matrix_in_reg("x")) {
			windoc.getElementById("x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("x"));
			windoc.getElementById("xi").innerHTML = "";
		} else {
			windoc.getElementById("x").innerHTML =
				self.format_result(H.machine.reg_tuple("x"));
			if (H.type === "15c") {
				windoc.getElementById("xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("x"));
			}
		}
		if (H.machine.matrix_in_reg("last_x")) {
			windoc.getElementById("last_x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("last_x"));
			windoc.getElementById("last_xi").innerHTML = "";
		} else {
			windoc.getElementById("last_x").innerHTML =
				self.format_result(H.machine.reg_tuple("last_x"));
			if (H.type === "15c") {
				windoc.getElementById("last_xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("last_x"));
			}
		}
		if (H.machine.matrix_in_reg("y")) {
			windoc.getElementById("y").innerHTML =
				self.format_matrix(H.machine.reg_tuple("y"));
			windoc.getElementById("yi").innerHTML = "";
		} else {
			windoc.getElementById("y").innerHTML =
				self.format_result(H.machine.reg_tuple("y"));
			if (H.type === "15c") {
				windoc.getElementById("yi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("y"));
			}
		}
		if (H.machine.matrix_in_reg("z")) {
			windoc.getElementById("z").innerHTML =
				self.format_matrix(H.machine.reg_tuple("z"));
			windoc.getElementById("zi").innerHTML = "";
		} else {
			windoc.getElementById("z").innerHTML =
				self.format_result(H.machine.reg_tuple("z"));
			if (H.type === "15c") {
				windoc.getElementById("zi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("z"));
			}
		}
		if (H.machine.matrix_in_reg("w")) {
			windoc.getElementById("w").innerHTML =
				self.format_matrix(H.machine.reg_tuple("w"));
			windoc.getElementById("wi").innerHTML = "";
		} else {
			windoc.getElementById("w").innerHTML =
				self.format_result(H.machine.reg_tuple("w"));
			if (H.type === "15c") {
				windoc.getElementById("wi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("w"));
			}
		}

		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			if (H.machine.matrix_in_index()) {
				windoc.getElementById("index").innerHTML =
				self.format_matrix({r: H.machine.index,
							h: H.machine.indexh,
							i: 0});
			} else {
				windoc.getElementById("index").innerHTML =
				self.format_result({r: H.machine.index, h: 0, i: 0});
			}
		}

		for (e = 0; e < H.machine.ram.length; ++e) {
			var opcode = H.machine.ram[e];
			var asm = H.pgrm.disassemble(opcode);
			var txt = "";
			
			if (opcode && asm !== "NOP") {
				txt = H.pgrm.disassemble(opcode) +
					" <i>(" + opcode + ")</i>";
			}
			windoc.getElementById("ram" + e).innerHTML = txt;
		}
	}

	// closure trick, since 'this' changes meaning inside setTimeout
	H.delay(function () {
		self.show_memory2();
	}, 1000);
};

Hp12c_debug.prototype.show_memory = function ()
{
	var self = this;

	self.memwin = window.open(H.type_cookie + '_memory.html');
	H.delay(function () {
		self.show_memory2();
	}, 1000);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true */
/*global H */

"use strict";

function Hp12c_display()
{
	this.display_max = 9999999999;
	this.display_len = 10; // without extra -
	this.display_min = 0.0000000001;
	this.lcd = [];
	this.contents = "";
	this.contents_alt = "";
	this.blink_delay = 25;
	this.blink_handle = null;
	this.overflow_blink = false;
	this.overflow_blink_timer = null;
	this.overflow_blink_freq = 250; // ms

	var LCD_A = 1;
	var LCD_B = 2;
	var LCD_C = 4;
	var LCD_D = 8;
	var LCD_E = 16;
	var LCD_F = 32;
	var LCD_G = 64;
	var LCD_P = 128;
	var LCD_T = 256;

	this.lcdmap = [];

	this.lcdmap['0'] = LCD_A | LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['1'] = LCD_C | LCD_F;
	this.lcdmap['2'] = LCD_A | LCD_C | LCD_D | LCD_E | LCD_G;
	this.lcdmap['3'] = LCD_A | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['4'] = LCD_B | LCD_C | LCD_D | LCD_F;
	this.lcdmap['5'] = LCD_A | LCD_B | LCD_D | LCD_F | LCD_G;
	this.lcdmap['6'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['7'] = LCD_A | LCD_C | LCD_F;
	this.lcdmap['8'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['9'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap[' '] = 0;
	this.lcdmap['.'] = LCD_P;
	this.lcdmap[','] = LCD_P | LCD_T;
	this.lcdmap['r'] = LCD_A | LCD_B;
	this.lcdmap['U'] = LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['u'] = LCD_B | LCD_C | LCD_D;
	this.lcdmap['n'] = LCD_B | LCD_C | LCD_A;
	this.lcdmap['i'] = LCD_B;
	this.lcdmap['g'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['-'] = LCD_D;
	this.lcdmap['A'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['a'] = this.lcdmap['A'];
	this.lcdmap['B'] = LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['b'] = this.lcdmap['B'];
	this.lcdmap['c'] = LCD_D | LCD_E | LCD_G;
	this.lcdmap['C'] = this.lcdmap['c'];
	this.lcdmap['d'] = LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['D'] = this.lcdmap['d'];
	this.lcdmap['E'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_G;
	this.lcdmap['e'] = this.lcdmap['E'];
	this.lcdmap['F'] = LCD_A | LCD_B | LCD_D | LCD_E;
	this.lcdmap['f'] = this.lcdmap['F'];
	this.lcdmap['H'] = LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['h'] = LCD_B |         LCD_D | LCD_E | LCD_F;
	this.lcdmap['o'] = LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['O'] = this.lcdmap["o"];
	this.lcdmap['R'] = LCD_D | LCD_E;
	this.lcdmap['P'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E;
	this.lcdmap[':'] = LCD_P;

	for (var e = 0; e <= 10; ++e) {
		this.lcd[e] = [];
		this.lcd[e][0] = 0;
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "a");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "b");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "c");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "d");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "e");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "f");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "g");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "p");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "t");
	}
	
	this.display = H.getElem("display");
	this.dbegin = H.getElem("begin");
	this.ddmyc = H.getElem("dmyc");
	this.dmodifier = H.getElem("modifier");
	this.pgrm = H.getElem("pgrm");
	this.rpnalg = H.getElem("rpnalg");
	this.trigo = H.getElem("trigo");
	this.user = H.getElem("user");
	this.carry = H.getElem("carry");
	this.overflow = H.getElem("overflow");
	this.complex = H.getElem("complex");
	this.altdisplay = H.getElem("altdisplay");
	this.wordstatus = H.getElem("wordstatus");
	this.undo = H.getElem("undo");
	this.parentheses = H.getElem("parentheses");

	this.clear();
}

Hp12c_display.prototype.setInnerHTML = function (name, txt)
{
	if (H.embedded) {
		this.display.setInnerHTML(name, txt);
	} else {
		var tgt = this[name];
		if (tgt) {
			tgt.innerHTML = txt;
		}
	}
};

Hp12c_display.prototype.private_lcd_display = function (txt) 
{
	var f = -1;
	var buffer = [];

	for (var e = 0; e < txt.length && f < this.lcd.length; ++e) {
		var merge = false;
		var val = txt.charAt(e);
		++f;
		if ((val == '.' || val == ',') && f > 0) {
			// merge decimal point/thousand separator
			--f;
			merge = true;
		}
		if (! this.lcdmap[val]) {
			val = ' ';
		}
		var map = this.lcdmap[val];
		buffer[f] = map | (merge ? buffer[f] : 0);
	}
	for (++f; f < this.lcd.length; ++f) {
		buffer[f] = 0;
	}

	if (H.embedded) {
		this.display.showDisplay(buffer);
		return;
	}

	for (f = 0; f < buffer.length; ++f) {
		map = buffer[f];
		for (var segm = 1; segm < 10; ++segm) {
			var bit = 1 << (segm - 1);
			var visibility = (map & bit) ? "visible" : "hidden";
			if (this.lcd[f][segm].style.visibility !== visibility) {
				this.lcd[f][segm].style.visibility = visibility;
			}
		}
	}
};

Hp12c_display.prototype.show = function (txt)
{
	// console.log("display show: " + txt);
	this.cancel_overflow_blink();
	this.contents = txt;
	this.private_lcd_display(txt);
	this.start_overflow_blink();
};

Hp12c_display.prototype.set_blink = function (blinks)
{
	this.overflow_blink = blinks;
	this.cancel_overflow_blink();
	this.start_overflow_blink();
};

Hp12c_display.prototype.cancel_overflow_blink = function ()
{
	if (this.overflow_blink_timer) {
		window.clearInterval(this.overflow_blink_timer);
		this.overflow_blink_timer = null;
	}
};

Hp12c_display.prototype.start_overflow_blink = function ()
{
	var self = this;

	if (! this.overflow_blink) {
		return;
	}

	this.overflow_blink_on = true;
	this.overflow_blink_timer =
		window.setInterval(function () {
			self.overflow_blink_on = ! self.overflow_blink_on;
			if (self.overflow_blink_on) {
				self.private_lcd_display(self.contents);
			} else {
				self.private_lcd_display("");
			}
		},
		this.overflow_blink_freq);
};

Hp12c_display.prototype.show_alt = function (txt)
{
	this.contents_alt = txt;
	this.setInnerHTML("altdisplay", txt);
};

Hp12c_display.prototype.html_wrap = function (txt)
{
	var j = 0;
	var c;
	for (var i = 0; i < txt.length; ++i) {
		c = txt.charAt(i);
		++j;
		if (j > 13 || (j > 9 && (c === "." || c === ","))) {
			txt = txt.substr(0, i + 1) + "<br>" + txt.substr(i + 1);
			i += 4;
			j = 0;
		}
	}

	return txt;
};

Hp12c_display.prototype.show_wordstatus = function (txt)
{
	this.setInnerHTML("wordstatus", txt);
};

Hp12c_display.prototype.show_parentheses = function (txt)
{
	this.setInnerHTML("parentheses", txt);
};

Hp12c_display.prototype.show_undo = function (enabled)
{
	this.setInnerHTML("undo", enabled ? "u" : "");
};

Hp12c_display.prototype.clear = function ()
{
	this.private_lcd_display("");
	this.show_alt("");
	this.show_wordstatus("");
};

Hp12c_display.prototype.format_result_tuple = function (t)
{
	if (H.machine.notation < H.NOTATION_INT) {
		return this.format_result(t.r);
	}
	return this.format_result_int(t);
};

Hp12c_display.prototype.format_result = function (n)
{
	var res = "";
	var absn = Math.abs(n);
	var fix_dec = H.machine.decimals;
	var mantissa_dec = H.machine.decimals;
	var notation = H.machine.notation;
	var degenerate = 0;
	var scale;
	var mantissa;

	if (n >= H.value_max) {
		degenerate = 1;
		scale = 99;
		n = H.value_max;
		absn = Math.abs(n);
	} else if (n <= -H.value_max) {
		degenerate = 2;
		scale = 99;
		n = -H.value_max;
		absn = Math.abs(n);
	} else if (absn >= H.value_min) {
		scale = Math.log(absn) / Math.log(10);
		// added a tad to guarantee that log(10) === 1
		scale = Math.floor(scale + 0.00000000001);
	} else {
		degenerate = 3;
		scale = -100;
		absn = n = 0;
	}

	var co = H.machine.comma;

	if (notation == H.NOTATION_FIX) {
		mantissa_dec = 6;
		if (absn > this.display_max) {
			// too big to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && scale < -9) {
			// too small to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && fix_dec < (-scale)) {
			// we need more decimals to show this number
			fix_dec = -scale;
		}
	}

	mantissa_dec = Math.min(mantissa_dec, 6);

	if (degenerate != 3) {
		mantissa = n / Math.pow(10, scale);
	} else {
		mantissa = 0;
	}

	// handle rounding up
	var mantissa_signal = mantissa >= 0 ? 1 : -1;
	mantissa = parseFloat(Math.abs(mantissa).toFixed(mantissa_dec));
	if (notation != H.NOTATION_FIX && mantissa >= 10) {
		mantissa /= 10;
		scale += 1;
	}
	// give signal back
	mantissa *= mantissa_signal;

	// until now, ENG handling == SCI
	// now, compensate for ENG
	if (notation == H.NOTATION_ENG && (! degenerate)) {
		var new_scale = 3 * Math.floor(scale / 3);
		while (scale > new_scale) {
			mantissa *= 10;
			scale -= 1;
			if (mantissa_dec > 0) {
				mantissa_dec -= 1;
			}
		}
	}

	if (notation !== H.NOTATION_FIX) {
		// show as exponential
		/*
		if (mantissa === 0 && (H.type !== "11c" && H.type !== "15c") && false) {
			// in SCI mode, 12C shows 0.0000000 00 too...
			return H.i18n(' 0', co, 1);
		*/
		if (degenerate == 1) {
			return H.i18n(' 9.999999 99', co, 1);
		} else if (degenerate == 2) {
			return H.i18n('-9.999999 99', co, 1);
		}

		res = H.i18n(mantissa.toFixed(mantissa_dec), co, 1);
		if (mantissa >= 0) {
			res = " " + res;
		}

		// no need to compensate for thousand separators because even
		// in ENG mode mantissa is < 1000.

		// display_len does NOT count the negative sign
		// -3: exponential plus space/expo signal
		// +1: compressed decimal point (always present, even if mantissa_dec == 0)
		// +1: negative sign
		var max_m_len = this.display_len - 3 + 1 + 1;

		res = res.substr(0, max_m_len);
		while (res.length < max_m_len) {
			res = res + " ";
		}

		if (mantissa === 0) {
			scale = 0;
		}

		if (scale < 0) {
			res = res + "-" + H.zeropad((-scale).toFixed(0), 2);
		} else {
			res = res + " " + H.zeropad(scale.toFixed(0), 2);
		}
		// console.log(" " + n + " " + mantissa + " " + scale + " d " + degenerate + " " + res);

		return res;
	}

	// show as fixed, w/o exp
	var dec = Math.max(0, fix_dec);
	var sgn = n < 0 ? "-" : " ";
	n = Math.abs(n);
	var ll = n.toFixed(dec).length - (dec > 0 ? 1 : 0);
	if (ll > this.display_len) {
		// reduce decimals if too big for display
		dec -= (ll - this.display_len);
		dec = Math.max(0, dec);
	}
	res = H.i18n(sgn + n.toFixed(dec), co, 1);

	return res;
};

Hp12c_display.prototype.get_radix = function ()
{
	var radix = H.radix[H.machine.notation];
	var suffix = H.radix_suffix[H.machine.notation];

	return [radix, suffix];
};

Hp12c_display.prototype.integer_to_string = function (t, radix)
{
	// for non-decimal, how as unsigned
	var negative_repr = 0;
	if (radix === 10) {
		negative_repr = H.machine.negative_repr;
	}

	var spure = H.integer_to_string(t,
					negative_repr,
					H.machine.wordsize,
					radix,
					true);

	return spure;
};

Hp12c_display.prototype.format_result_int = function (t)
{
	var radix = this.get_radix()[0];
	return this.integer_to_string(t, radix);
};

Hp12c_display.prototype.p_display_integer = function (x, xmode, typed_digits)
{
	var typing = xmode > -100; // -100, -1, 0
	var point1 = "";
	var point2 = "";
	var sign = " ";
	var show_apocryphal = (H.machine.altdisplay > 0);

	var radix = this.get_radix();
	var suffix = radix[1];
	radix = radix[0];

	var spure = this.integer_to_string(x, radix);
	var spure16;
	if (radix === 2) {
		spure16 = this.integer_to_string(x, 16);
	}
	// console.log(spure);

	if (spure.substr(0, 1) === "-") {
		spure = spure.substr(1);
		sign = "-";
	}

	var s, sfull;
	var len = 8;

	var bits_per_digit = H.digit_bits[H.machine.notation];
	var digits_on_display = H.win_digits[H.machine.notation];
	var tot_digits = Math.ceil(H.machine.wordsize / bits_per_digit);
	var wincount = H.machine.window_count();
	var tot_digits_ceil = wincount * digits_on_display;

	var si2 = spure;
	var significant_digits = si2.length;
	var significant_windows = Math.ceil(significant_digits /
						digits_on_display);

	if (typing) {
		while (si2.length < typed_digits) {
			si2 = "0" + si2;
		}
	}

	var current_window = typing ? 0 : H.machine.intwindow;

	show_apocryphal = show_apocryphal &&
				(significant_windows > 1 || current_window > 0);

	var filler = " ";
	if (H.machine.get_zeros_flag() && radix !== 10) {
		filler = "0";
	}

	while (si2.length < tot_digits) {
		si2 = filler + si2;
	}

	while (si2.length < tot_digits_ceil) {
		si2 = " " + si2;
	}

	if (current_window > 0) {
		point2 = ".";
	}
	if (current_window < (significant_windows - 1)) {
		point1 = ".";
	}

	// window cutting
	var dpos;
	dpos = (wincount - current_window - 1) * digits_on_display;
	si2 = si2.substr(dpos, digits_on_display);
	// convert dpos to "last digit = 0"
	dpos = current_window * digits_on_display;

	var lcdsign = sign;

	if (radix === 10) {
		var sp = si2.lastIndexOf(" ");
		if (sp >= 0) {
			si2 = si2.substr(0, sp) + lcdsign + si2.substr(sp + 1);
			lcdsign = " ";
		} else if (point1 === ".") {
			// next window has significant digits
			// do not show LCD sign
			lcdsign = " ";
		} else {
			// this window is full but next window does not
			// have significant digits
			// leave LCD sign in place
		}
	}

	// if radix = 10 and window > 0, i18n() might put decimal places
	// in wrong values, because si2 has been cut. We add zeros as
	// LSBs until the LSB is a multiple of 3, so i18n(si2) does well.
	var r10comp = 0;
	while (radix === 10 && ((dpos - r10comp) % 3) > 0) {
		si2 += "0";
		r10comp++;
	}
	si2 = H.i18n(si2, H.machine.comma, 0, radix === 10 ? 3 : 4);
	// Remove LSB compensation, if it was made above
	if (radix === 10 && r10comp > 0) {
		si2 = si2.substr(0, si2.length - r10comp);
	}
	s = lcdsign + si2 + " " + point1 + suffix + point2;

	sfull = sign + (radix === 2 ? spure16 : spure);
	sfull = H.i18n(sfull, H.machine.comma, 0, radix === 10 ? 3 : 4);

	this.show(s);
	if (show_apocryphal) {
		this.show_alt(this.html_wrap(sfull));
	} else {
		this.show_alt("");
	}
};

Hp12c_display.prototype.displayNumber_now_integer = function (x)
{
	this.p_display_integer(x, -100);
};

Hp12c_display.prototype.displayMatrix = function (n, r, c)
{
	var self = this;

	self.cancel_blinked();

	var s = " " + (10 + n - 20).toString(16).toUpperCase() +
		" " + r + ", " + c;
	self.show(s);
	self.show_alt("");
};

Hp12c_display.prototype.displayNumber_now = function (x)
{
	if (H.type === "16c" && H.machine.notation >= H.NOTATION_INT) {
		this.displayNumber_now_integer(x);
		return;
	}

	var co = H.machine.comma;
	x = x.r || 0;

	if (x > H.value_max) {
		x = H.value_max;
	} else if (x < -H.value_max) {
		x = -H.value_max;
	} else if (Math.abs(x) < H.value_min) {
		x = 0;
	}

	// display result
	var sres = this.format_result(x);
	this.show(sres);
	this.show_alt("");
};

Hp12c_display.prototype.cancel_blinked = function ()
{
	var self = this;

	if (self.blink_handle !== null) {
		H.machine.sti("display");
		H.cancel_delay(self.blink_handle);
		self.blink_handle = null;
	}
};


Hp12c_display.prototype.start_blinked = function (x)
{
	var self = this;

	H.machine.cli("display");
	self.show("");

	self.cancel_blinked(); // innocuous if no blink in progress

	self.blink_handle = H.delay(function () {
		self.blink_handle = null;
		H.machine.sti("display");
		self.displayNumber_now(x);
	}, self.blink_delay);
};

Hp12c_display.prototype.displayNumber = function (x)
{
	var self = this;

	self.start_blinked(x);
};

Hp12c_display.prototype.displayTypedNumber_integer = function (val, xmode, digits)
{
	var self = this;

	self.cancel_blinked();
	this.p_display_integer(val, xmode, digits);
};

Hp12c_display.prototype.displayTypedNumber = function (ms, m, dec, exp, exps, xmode)
{
	var self = this;

	self.cancel_blinked();

	var s = "";
	var co = H.machine.comma;

	if (xmode === 0) {
		s = " 0";
		if (m.length > 0) {
			s = (ms < 0 ? "-" : " ") + m;
		}
		if (H.type !== "11c" && H.type !== "15c") {
			s += ".";
		}
		s = H.i18n(s, co, 0);
	} else if (xmode === 1) {
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + dec, co, 1);
	} else if (xmode === 100) {
		var rdec = dec.substr(0, 7 - m.length);
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + rdec, co, 1);
		for (var i = 0; i < (7 - rdec.length - m.length); ++i) {
			s += " ";
		}
		s += exps < 0 ? "-" : " ";
		s += H.zeropad(parseInt("0" + exp, 10).toFixed(0), 2);
	}
	this.show(s);
	this.show_alt("");
};

H.mod_stt = null;

Hp12c_display.prototype.modifier_table = function ()
{
	if (H.mod_stt) {
		return H.mod_stt;
	}

	var a = [];

	a[0] = "";
	a[H.FF] = "f";
	a[H.GG] = "g";
	a[H.STO] = "STO";
	a[H.STO2] = "STO★";
	a[H.RCL] = "RCL";
	a[H.RCL2] = "RCL★";
	
	if (H.type !== "16c") {
		a[H.STO_PLUS] = "STO+";
		a[H.STO_MINUS] = "STO-";
		a[H.STO_TIMES] = "STO×";
		a[H.STO_DIVIDE] = "STO÷";
	}

	a[H.GTO] = "GTO";
	a[H.GTO_MOVE] = "GTO★";

	if (H.is_12c()) {
		a[H.RCL_GG] = "RCL g";
	}

	if (H.type === "11c" || H.type === "15c") {
		a[H.HYP] = "HYP";
		a[H.HYPINV] = "HYP-1";
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.FIX] = "FIX";
		a[H.SCI] = "SCI";
		a[H.ENG] = "ENG";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.RCL_GG] = "RCL g";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";

		a[H.STO_PLUS_FF] = "STO+ f";
		a[H.STO_MINUS_FF] = "STO- f";
		a[H.STO_TIMES_FF] = "STO× f";
		a[H.STO_DIVIDE_FF] = "STO÷ f";
	}

	if (H.type === "15c") {
		a[H.GTO_DOT] = "GTO★";
		a[H.GSB_DOT] = "GSB★";
		a[H.LBL_DOT] = "LBL★";

		a[H.STO_PLUS_DOT] = "STO+★";
		a[H.STO_MINUS_DOT] = "STO-★";
		a[H.STO_TIMES_DOT] = "STO×★";
		a[H.STO_DIVIDE_DOT] = "STO÷★";

		a[H.RCL_PLUS] = "RCL+";
		a[H.RCL_MINUS] = "RCL-";
		a[H.RCL_TIMES] = "RCL×";
		a[H.RCL_DIVIDE] = "RCL÷";

		a[H.RCL_PLUS_DOT] = "RCL+★";
		a[H.RCL_MINUS_DOT] = "RCL-★";
		a[H.RCL_TIMES_DOT] = "RCL×★";
		a[H.RCL_DIVIDE_DOT] = "RCL÷★";

		a[H.RCL_PLUS_FF] = "STO+ f";
		a[H.RCL_MINUS_FF] = "STO- f";
		a[H.RCL_TIMES_FF] = "STO× f";
		a[H.RCL_DIVIDE_FF] = "STO÷ f";

		a[H.FF_EXCHANGE] = "X⇄";
		a[H.FF_EXCHANGE_DOT] = "X⇄★";

		a[H.SOLVE] = "SOLV";
		a[H.SOLVE_DOT] = "SOLV★";
		a[H.INTEG] = "INTG";
		a[H.INTEG_DOT] = "INTG★";
		a[H.GG_TEST] = "TEST";

		a[H.DIM] = "DIM";
		a[H.RCL_DIM] = "RCL D";
		a[H.MATRIX] = "M";
		a[H.STO_GG] = "STO g";
		a[H.STO_MATRIX] = "STO M";
		a[H.STO_FF_MATRIX] = "STO M";
		a[H.RCL_MATRIX] = "RCL M";
		a[H.RCL_FF_MATRIX] = "RCL M";
		a[H.RESULT] = "Res";

		a[H.ISG] = "ISG";
		a[H.ISG_DOT] = "ISG★";
		a[H.DSE] = "DSE";
		a[H.DSE_DOT] = "DSE★";
	}

	if (H.type === "16c") {
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.WINDOW] = "WINDOW";
		a[H.FLOAT] = "FLOAT";
	}

	H.mod_stt = a;
	return H.mod_stt;
};

Hp12c_display.prototype.show_modifier = function (m)
{
	var txt = this.modifier_table()[m];
	if (txt === undefined || txt === null) {
		H.error("Display: unknown modifier " + m);
		txt = "";
	}

	this.setInnerHTML("dmodifier", txt);
};

Hp12c_display.prototype.show_begin = function (is_begin)
{
	var txt = "";
	if (is_begin) {
		txt = "BEGIN";
	}

	this.setInnerHTML("dbegin", txt);
};

Hp12c_display.prototype.show_carry = function (is_carry)
{
	var txt = "";
	if (is_carry) {
		txt = "C";
	}

	if (H.type === "16c") {
		this.setInnerHTML("carry", txt);
	}
};

Hp12c_display.prototype.show_overflow = function (is_overflow)
{
	var txt = "";
	if (is_overflow) {
		txt = "G";
	}

	if (H.type === "16c") {
		this.setInnerHTML("overflow", txt);
	}
};

Hp12c_display.prototype.show_complex = function (is_complex)
{
	var txt = "";
	if (is_complex) {
		txt = "C";
	}

	if (H.type === "15c") {
		this.setInnerHTML("complex", txt);
	}
};

Hp12c_display.prototype.show_error = function (err)
{
	this.show("ERROR " + err);
	this.show_alt("");
};

Hp12c_display.prototype.display_meminfo = function (mem, stolen)
{
	--stolen;
	var stolen_txt = stolen.toFixed(0);
	if (H.type !== "16c") {
		stolen_txt = (stolen % 10).toFixed(0);
		if (stolen >= 10) {
			stolen_txt = ":" + stolen_txt;
		}
	}
	this.show("P-" + H.zeropad(mem, H.ram_ADDR_SIZE) + " R-" + stolen_txt);
	this.show_alt("");
};

Hp12c_display.prototype.show_dmyc = function (dmy, compoundf)
{
	var txt = "";
	if (dmy) {
		txt += "D.MY";
	}
	if (compoundf) {
		txt += "&nbsp;&nbsp;C";
	}

	this.setInnerHTML("ddmyc", txt);
};

Hp12c_display.prototype.show_pse = function ()
{
	this.setInnerHTML("dmodifier", "PAUSE");
};

Hp12c_display.prototype.show_pgrm = function (pgrm, run, pc)
{
	var txt = "";
	if (pgrm) {
		txt = "PRGM";
	} else if (run) {
		txt = "RUN " + H.zeropad(pc.toFixed(0), 2);
	}

	this.setInnerHTML("pgrm", txt);
};

Hp12c_display.prototype.show_algmode = function (algmode)
{
	if (H.type === "12c-platinum") {
		var txt = ["RPN", "ALG"][algmode];
		this.setInnerHTML("rpnalg", txt);
	}
};

Hp12c_display.prototype.show_trigo = function (trigo)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "RAD", "GRAD"][trigo];
		this.setInnerHTML("trigo", txt);
	}
};

Hp12c_display.prototype.show_user = function (user)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "USER"][user];
		this.setInnerHTML("user", txt);
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_keyboard()
{
	var self = this;

	self.is_enabled = 0;
	self.kbdtable = {};
	self.kbdtable['0'] = 0;
	self.kbdtable['.'] = 48;
	self.kbdtable[','] = 48;
	self.kbdtable['1'] = 1;
	self.kbdtable['2'] = 2;
	self.kbdtable['3'] = 3;
	self.kbdtable['4'] = 4;
	self.kbdtable['5'] = 5;
	self.kbdtable['6'] = 6;
	self.kbdtable['7'] = 7;
	self.kbdtable['8'] = 8;
	self.kbdtable['9'] = 9;
	self.kbdtable['+'] = 40;
	self.kbdtable['='] = 40;
	self.kbdtable['-'] = 30;
	self.kbdtable['*'] = 20;
	self.kbdtable['x'] = 20;
	self.kbdtable['X'] = 20;
	self.kbdtable['/'] = 10;
	self.kbdtable[':'] = 10;
	self.kbdtable['\r'] = 36;
	self.kbdtable['\n'] = 36;
	self.kbdtable[' '] = 36;
	self.kbdtable['f'] = 42;
	self.kbdtable['F'] = 42;
	self.kbdtable['g'] = 43;
	self.kbdtable['G'] = 43;
	self.kbdtable['s'] = 44;
	self.kbdtable['S'] = 44;
	self.kbdtable['r'] = 45;
	self.kbdtable['R'] = 45;
	self.kbdtable['o'] = 41;
	self.kbdtable['O'] = 41;

	H.hp1xc_keyboard_flavor(self.kbdtable);

	// stay here while vertical map translation is uniform across models
	self.vertical_map = {};
	self.vertical_map[0] = -1;
	self.vertical_map[1] = 11;
	self.vertical_map[2] = 12;
	self.vertical_map[3] = 13;
	self.vertical_map[4] = 14;
	self.vertical_map[5] = 15;
	self.vertical_map[10] = -1;
	self.vertical_map[11] = 21;
	self.vertical_map[12] = 22;
	self.vertical_map[13] = 23;
	self.vertical_map[14] = 24;
	self.vertical_map[15] = 25;
	self.vertical_map[20] = 41;
	self.vertical_map[21] = 31;
	self.vertical_map[22] = 32;
	self.vertical_map[23] = 33;
	self.vertical_map[24] = 34;
	self.vertical_map[25] = 35;
	self.vertical_map[30] = 45;
	self.vertical_map[31] = 16;
	self.vertical_map[32] = 7;
	self.vertical_map[33] = 8;
	self.vertical_map[34] = 9;
	self.vertical_map[35] = 10;
	self.vertical_map[40] = 44;
	self.vertical_map[41] = 26;
	self.vertical_map[42] = 4;
	self.vertical_map[43] = 5;
	self.vertical_map[44] = 6;
	self.vertical_map[45] = 20;
	self.vertical_map[50] = 43;
	self.vertical_map[51] = 36;
	self.vertical_map[52] = 1;
	self.vertical_map[53] = 2;
	self.vertical_map[54] = 3;
	self.vertical_map[55] = 30;
	self.vertical_map[60] = 42;
	self.vertical_map[61] = 36;
	self.vertical_map[62] = 0;
	self.vertical_map[63] = 48;
	self.vertical_map[64] = 49;
	self.vertical_map[65] = 40;

	H.hp1xc_vertical_keyboard_flavor(self.vertical_map);

	self.pointer_div = H.getElem("pointer_div");

	// recalculate keyboard coordinates
	// based on original ones for 700x438 image
	if (H.embedded) {
		self.kx = 1;
		self.ky = 1;
	} else {
		self.kx = parseInt(self.pointer_div.style.width, 10) / H.disp_theo_width;
		self.ky = parseInt(self.pointer_div.style.height, 10) / H.disp_theo_height;
	}

	self.microsoft = (window.navigator && window.navigator.msPointerEnabled && true);
	
	var o = this;

	if (H.touch_display) {
		if (self.microsoft) {
			var handler = function (x) {
				o.mouse_click(x);
			};
			window.cross.addEventListener("MSPointerDown", handler, true);
		} else {
			H.getElem("cross").ontouchstart = function (x) {
				o.mouse_click(x);
			};
		}
	} else {	
		H.getElem("cross").onclick = function (x) {
			o.mouse_click(x);
		};
	}
	document.onkeypress = function (x) {
		o.hard_keyboard(x);
	};
}

Hp12c_keyboard.prototype.enable = function ()
{
	var self = this;

	self.is_enabled = 1;
	// console.log("kbd enabled ");
};

Hp12c_keyboard.prototype.disable = function ()
{
	var self = this;

	self.is_enabled = 0;
	// console.log("kbd disabled ");
};

Hp12c_keyboard.prototype.enabled = function ()
{
	var self = this;

	return self.is_enabled;
};

Hp12c_keyboard.prototype.remap_key_vertical = function (raw)
{
	var self = this;
	var key = -1;
	var candidate = self.vertical_map[raw];
	if (candidate !== null && candidate !== undefined) {
		key = candidate;
	}

	return key;
};

Hp12c_keyboard.prototype.remap_key = function (raw)
{
	var self = this;

	// map 'raw' keys to HP12-compatible key codes

	var hpkey = raw + 11;  // key 0 ("n") becomes key 11
	var col = (hpkey % 10); // "n" is at column 1; Divide is at column 0
	if (col === 0) {
		// "Divide" is not the key 20; it is the key 10
		// this operation does NOT change column value
		hpkey -= 10;
	}
	var row = Math.floor(hpkey / 10); // "n" and Device are at line 1

	if (hpkey == 47 /* zero */ ) {
		hpkey = 0;
	} else if (col >= 7 && col <= 9 && hpkey != 48 /* point */ && hpkey != 49 /*sigma+*/) {
		// numeric keys: key code is equal to the number it represents
		hpkey = col - 3 * (row - 1);
	}

	if (hpkey == 46) {
		// ENTER exception
		hpkey = 36;
	}
	
	return hpkey;
};

Hp12c_keyboard.prototype.hard_keyboard = function (e)
{
	var self = this;

	var keynum;
	var keychar;
	var numcheck;

	if (window.event) {
		e = window.event;
		keynum = window.event.keyCode;
	} else if (e.which) {
		keynum = e.which;
	} else {
		return true;
	}

	keychar = String.fromCharCode(keynum);

	var ret = true;
	var kk = self.kbdtable[keychar];
	if (kk !== undefined && kk !== null) {
		if (self.enabled()) {
			H.dispatcher.dispatch(self.kbdtable[keychar]);
		}
		e.returnValue = false;
		if (e.preventDefault) {
			e.preventDefault();
		}
		ret = false;
	}
	return ret;
};

Hp12c_keyboard.prototype.mouse_click = function (evt)
{
	var self = this;

	if (! evt) {
		evt = window.event;
	}

	self.xoff = H.disp_key_offset_x * self.kx;
	self.yoff = H.disp_key_offset_y * self.ky;

	self.xl = H.disp_key_width * self.kx;
	self.yl = H.disp_key_height * self.ky;

	self.xd = H.disp_key_dist_x * self.kx;
	self.yd = H.disp_key_dist_y * self.ky;

	var pos_x, pos_y;

	if (H.embedded) {
		pos_x =	evt.X - self.xoff;
		pos_y = evt.Y - self.yoff;
	} else if (H.touch_display) {
		evt.preventDefault();
		if (self.microsoft) {
			pos_x =	(evt.pageX - self.pointer_div.offsetLeft) - self.xoff;
			pos_y = (evt.pageY - self.pointer_div.offsetTop) - self.yoff;
		} else {
			pos_x =	(evt.targetTouches[0].pageX - self.pointer_div.offsetLeft) - self.xoff;
			pos_y = (evt.targetTouches[0].pageY - self.pointer_div.offsetTop) - self.yoff;
		}
	} else {
		pos_x = (evt.offsetX ? evt.offsetX : 
			(evt.pageX - self.pointer_div.offsetLeft)) - self.xoff;
		pos_y = (evt.offsetY ? evt.offsetY :
			(evt.pageY - self.pointer_div.offsetTop)) - self.yoff;
	}

	var key;
	var in_key;

	if (H.vertical_layout) {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 6 || pos_y >= self.yd * 7) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 51);
		if (in_key) {
			key = self.remap_key_vertical(key);
			if (key >= 0) {
				if (self.enabled()) {
					H.dispatcher.dispatch(key);
				}
			}
		}
	} else {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 10 || pos_y >= self.yd * 4) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 25);
		if (in_key) {
			if (self.enabled()) {
				H.dispatcher.dispatch(self.remap_key(key));
			}
		}
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*global H */

"use strict";

H.hp1xc_keyboard_flavor = function (kbdtable)
{
	kbdtable['a'] = 11;
	kbdtable['A'] = 11;
	kbdtable['b'] = 12;
	kbdtable['B'] = 12;
	kbdtable['c'] = 13;
	kbdtable['C'] = 13;
	kbdtable['d'] = 14;
	kbdtable['D'] = 14;
	kbdtable['e'] = 15;
	kbdtable['E'] = 15;
	kbdtable['f'] = 16;
	kbdtable['F'] = 16;
	kbdtable['m'] = 42; // replacement of 'f' key
	kbdtable['M'] = 42;
	kbdtable['h'] = 49;
	kbdtable['H'] = 49;
	kbdtable['t'] = 22; // gto
	kbdtable['T'] = 22;
	kbdtable['u'] = 21; // gsb
	kbdtable['U'] = 21;
	kbdtable['n'] = 33; // rdown
	kbdtable['N'] = 33;
	kbdtable[String.fromCharCode(40)] = 33;
	kbdtable['Z'] = 35;
	kbdtable['z'] = 35;
	kbdtable[String.fromCharCode(8)] = 35;
	kbdtable['?'] = 99;
	kbdtable['['] = 31;
	kbdtable[']'] = 32; 
	kbdtable['y'] = 34;
	kbdtable['Y'] = 34;
	kbdtable['i'] = 23;
	kbdtable['I'] = 23;
	kbdtable['j'] = 24;
	kbdtable['J'] = 24;
	kbdtable['k'] = 25;
	kbdtable['K'] = 25;
	kbdtable['l'] = 26;
	kbdtable['L'] = 26;
};

H.hp1xc_vertical_keyboard_flavor = function (vmap)
{
	vmap[0] = 11;
	vmap[1] = 12;
	vmap[2] = 13;
	vmap[3] = 14;
	vmap[4] = 15;
	vmap[5] = 16;

	vmap[10] = 21;
	vmap[11] = 22;
	vmap[12] = 23;
	vmap[13] = 24;
	vmap[14] = 25;
	vmap[15] = 26;

	vmap[20] = 41;
	vmap[21] = 31;
	vmap[22] = 32;
	vmap[23] = 33;
	vmap[24] = 34;
	vmap[25] = 35;

	vmap[30] = 45;
	vmap[31] = -1;
	vmap[40] = 44;
	vmap[41] = -1;
	vmap[50] = 43;
	vmap[60] = 42;
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*global H */

"use strict";

// test with 12C and 11C

function Hp12c_machine()
{
	// algebraic operations

	this.nvname = H.type_cookie;

	// TODO this should be in init_memory()
	// and unit tests should wait it to go back to 1
	this.sti_level = 0;

	this.init_memory();
}


/* Can be called before display and other components are still uninitialized */
Hp12c_machine.prototype.init_memory = function (n)
{
	// calculator non-volatile memory -----------------------------------------------------------

	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.w = 0;
	this.last_x = 0;

	// 15C imaginary parts of each register
	this.xi = 0;
	this.yi = 0;
	this.zi = 0;
	this.wi = 0;
	this.last_xi = 0;

	this.mA = [];
	this.mB = [];
	this.mC = [];
	this.mD = [];
	this.mE = [];
	this.msA = [0, 0];
	this.msB = [0, 0];
	this.msC = [0, 0];
	this.msD = [0, 0];
	this.msE = [0, 0];
	this.mR = 20; // A=20, B=21 ...

	// 16C "high" parts of 64-bit integer numbers
	// 15C also use these flags as matrix pointers
	this.xh = 0;
	this.yh = 0;
	this.zh = 0;
	this.wh = 0;
	this.last_xh = 0;
	// 15C matrixes never go to STO memories
	this.stomemoryh = [];

	this.wordsize = H.DEFAULT_WORDSIZE;
	this.intwindow = 0;
	this.negative_repr = 2;

	this.stomemory = [];
	this.finmemory = [];
	this.njmemory = [];
	this.index = 0; // not-12C
	this.indexh = 0; // 15C

	this.ram = [];
	this.program_size = 1; // for STOP in [0]
	this.flags = [];

	var i;
	for (i = 0; i < H.FLAGS_MAX; ++i) {
		this.flags[i] = 0;
	}

	this.decimals = 2;
	this.comma = 0; 
	this.altdisplay = 1; // 16c alternative (apocryphal) displays

	this.begin = 0;
	this.dmy = 0;
	this.compoundf = 0;

	this.notation = H.NOTATION_FIX;
	if (H.type === "16c") {
		this.notation = H.NOTATION_INT_HEX;
	}
	this.trigo = H.TRIGO_DEG;
	this.complex = 0;
	this.user = 0;

	this.prng = new H.Prng(0);

	// 15C thing to handle solve, integration
	this.running_context = [];
	this.osolve = null;
	this.ointegrate = null;

	// volatile memory ---------------------------------------------------------------------

	this.UNDOABLE_NONE = 0;
	this.UNDOABLE_CLX = 1;
	this.UNDOABLE_BSP = 2;
	this.UNDOABLE_BSP_TYPING = 3;
	this.UNDOABLE_CLEAR_REG = 4;
	this.UNDOABLE_CLEAR_STAT = 5;
	this.UNDOABLE_CLEAR_FIN = 6;

	this.algmode = 0;
	this.algebra = [];
	this.undoable = 0; // UNDOABLE_* values
	this.undoable_assets = null;
	this.program_mode = 0;
	this.ip = 0;
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.gtoxx = "";
	this.modifier = 0;
	this.do_fincalc = 0;
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
	this.error_in_display = 0;

	this.call_stack = []; // not-12C

	if (H.type === '11c') {
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 
			  'decimals', 'comma', 'index',
			  'trigo', 'user', 'notation'];
		this.nvAN = ['stomemory', 'flags'];
	} else if (H.type === '15c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
                            'xi', 'yi', 'zi', 'wi', 'last_xi',
                            'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'indexh',
			  'trigo', 'user', 'notation', 'complex',
			  'mR'];
		this.nvAN = ['stomemory', 'flags',
				'mA', 'mB', 'mC', 'mD', 'mE',
				'msA', 'msB', 'msC', 'msD', 'msE'];
	} else if (H.type === '16c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
			    'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'notation',
			  'wordsize', 'intwindow', 'negative_repr',
			'altdisplay'];
		this.nvAN = ['stomemory', 'stomemoryh', 'flags'];
	} else {
		// 12C
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 'algmode',
				'decimals', 'comma', 'begin',
				'dmy', 'compoundf', 'notation'];
		this.nvAN = ['stomemory', 'finmemory', 'njmemory'];
	}
	this.nvAX = ['ram'];
};

Hp12c_machine.prototype.sto_Reset = function (i)
{
	this.stomemory[i] = 0;
	this.stomemoryh[i] = 0;
};

Hp12c_machine.prototype.reg_Reset = function (n)
{
	this[n] = 0;
	this[n + "h"] = 0;
	this[n + "i"] = 0;
};

Hp12c_machine.prototype.sto_Swap_reg = function (i, n)
{
	var tr = {r: this.stomemory[i], h: this.stomemoryh[i]};
	var ts = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(tr);
		this.cast_wordsize(ts);
	}

	this.stomemory[i] = ts.r;
	if (H.type === "16c") {
		this.stomemoryh[i] = ts.h;
	} else {
		this.stomemoryh[i] = 0;
	}
	this[n] = tr.r;
	this[n + "h"] = tr.h;
};

Hp12c_machine.prototype.sto_To_reg = function (i, n)
{
	var t = {r: this.stomemory[i], h: this.stomemoryh[i]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// STO does not have imaginary part
	this[n] = t.r;
	this[n + "h"] = t.h; // 16C integer
};

Hp12c_machine.prototype.reg_To_sto = function (n, i)
{
	var t = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// imaginary part not considered
	this.stomemory[i] = t.r;
	if (H.type === "16c") {
		// 15c matrixes don't go into STO
		this.stomemoryh[i] = t.h;
	} else {
		this.stomemoryh[i] = 0;
	}
};

Hp12c_machine.prototype.reg_To_reg = function (nf, nt)
{
	var t = {r: this[nf], h: this[nf + "h"], i: this[nf + "i"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	this[nt] = t.r;
	this[nt + "h"] = t.h;
	this[nt + "i"] = t.i;
};

Hp12c_machine.prototype.reg_tuple = function (n)
{
	var t = {};
	t.r = this[n];
	t.i = this[n + "i"];
	t.h = this[n + "h"];

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.reg_real = function (n)
{
	return this.reg_tuple(n).r;
};

Hp12c_machine.prototype.cast_wordsize = function (t)
{
	H.cast_wordsize(t, this.wordsize);
};

Hp12c_machine.prototype.cast_wordsize_in_accumulators = function ()
{
	var i;
	var regs = ["x", "y", "z", "w", "last_x"];

	for (i = 0; i < regs.length; ++i) {
		// getter and setter cast to wordsize, so no need to
		// do that explicitly
		this.reg_Set_tuple(regs[i], this.reg_tuple(regs[i]));
	}

	// storage is not cast immediately. If the user goes back
	// to bigger wordsize he should get the original values.
	/*
	for (i = 0; i < this.sto_mem_len(); ++i) {
		this.sto_Set_tuple(i, this.sto_tuple(i));
	}
	*/
};

Hp12c_machine.prototype.reg_Set_tuple = function (n, t)
{
	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		this.cast_wordsize(t);
	}

	this[n] = t.r;
	this[n + "i"] = t.i;
	this[n + "h"] = t.h;
};

Hp12c_machine.prototype.reg_Set_real = function (n, v)
{
	// check clients
	return this.reg_Set_tuple(n, {r: v, i: 0, h: 0});
};

Hp12c_machine.prototype.reg_Set_real_only = function (n, v)
{
	if (H.type === "15c" && this.is_complex_mode()) {
		return this.reg_Set_tuple(n, {r: v, i: this.xi, h: 0});
	}
	
	return this.reg_Set_real(n, v);
};

Hp12c_machine.prototype.sto_tuple = function (i)
{
	var t = {};
	t.r = this.stomemory[i];
	t.h = this.stomemoryh[i];
	t.i = 0; // filler to make it compatible with reg tuple

	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.sto_Set_tuple = function (i, t)
{
	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	this.stomemory[i] = t.r;
	this.stomemoryh[i] = ((H.type === "16c") ? t.h : 0);
	// t.i not used
};

Hp12c_machine.prototype.sto_mem_ref = function ()
{
	// Used by floating-point functions only, so this is ok
	return this.stomemory;
};

Hp12c_machine.prototype.sto_mem_len = function ()
{
	return this.stomemory.length;
};

Hp12c_machine.prototype.program_limit = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - 1, this.program_size - 1);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.ram_available = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - this.program_size);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.incr_ip = function (delta)
{
	// do not allow to go above program limit, but do not zero
	// because if in RUNNING mode, pgrm module always increases IP.
	// If we make ip=0, pgrm does ++ip and then we have an
	// infinite loop.
	this.ip = Math.max(0, Math.min(this.program_limit(), this.ip + delta));
};

/* Called when H.display is already in place */
Hp12c_machine.prototype.init = function ()
{
	this.init_memory();
	this.clear_prog(1);
	this.do_clear_reg(); // implies reg, sto, fin
	this.clear_stack();
	this.error_in_display = 0;
};

Hp12c_machine.prototype.clear_fin = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_FIN;
		this.undoable_assets = [];
		for (e = 0; e < 5; ++e) {
			this.undoable_assets[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_fin();
};

Hp12c_machine.prototype.do_clear_fin = function ()
{
	for (var e = 0; e < 5; ++e) {
		this.finmemory[e] = 0;
	}
	this.display_result();
};

Hp12c_machine.prototype.clear_statistics = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_STAT;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.sto = [];
		for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
		}
		this.display_undo();
	}

	// statistics share memory with STO memory
	for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
		this.sto_Reset(e);
	}
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.display_result();
};

Hp12c_machine.prototype.clear_prog = function (in_pgrm)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (in_pgrm) {
		this.ram[0] = "";
		for (var e = 1; e < H.ram_MAX; ++e) {
			this.ram[e] = H.STOP_INSTRUCTION;
		}
		this.program_size = 1; // for STOP in [0]
	} else {
		this.display_result();
	}
	this.ip = 0;
};

Hp12c_machine.prototype.clear_sto = function ()
{
	for (var e = 0; e < H.MEM_MAX; ++e) {
		this.sto_Reset(e);
		this.njmemory[e] = 1; // position 0 is read-only and always returns 1.
	}
};

Hp12c_machine.prototype.cli = function (motive)
{
	this.sti_level--;
	// console.log("cli " + this.sti_level + " " + motive);
	// this is cumulative i.e. two calls to cli(x) must be
	// counterbalanced by two sti(x)'s
	if (this.sti_level === 0) {
		H.keyboard.disable();
	}
};

Hp12c_machine.prototype.sti = function (motive)
{
	this.sti_level++;
	// console.log("sti " + this.sti_level + " " + motive);
	if (this.sti_level === 1) {
		H.keyboard.enable();
	}
};

Hp12c_machine.prototype.clear_typing = function ()
{
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
};

Hp12c_machine.prototype.display_result = function ()
{
	this.display_result_s(true, true);
};

Hp12c_machine.prototype.display_result_s = function (reset_window, enable_pushed)
{
	if (H.type === "16c") {
		if (reset_window) {
			if (this.intwindow !== 0) {
				this.intwindow = 0;
				this.display_wordstatus();
			}
		}
	}

	if (enable_pushed) {
		this.pushed = 0;
		this.pushed_cplx_exception = 0;
	}
	this.clear_typing();

	var t = this.display_result_in();

	if (H.type === "15c") {
		if (t.r >= H.value_max || t.r <= -H.value_max) {
			// make display blink
			this.set_overflow(true);
		}
	}
};

Hp12c_machine.prototype.display_result_in = function ()
{
	var t = this.reg_tuple("x");
	var matrix = this.matrix_in_reg("x");

	if (! matrix) {
		H.display.displayNumber(t);
	} else {
		var size = this.matrix_size(matrix);
		H.display.displayMatrix(matrix, size[0], size[1]);
	}

	return t;
};

Hp12c_machine.prototype.display_matrix = function (n, r, c)
{
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.clear_typing();
	H.display.displayMatrix(n, r, c);
};

Hp12c_machine.prototype.display_all = function ()
{
	this.display_result_in();
	this.display_modifier();
	this.display_begin();
	this.display_dmyc();
	this.display_pgrm();
	this.display_algmode();
	this.display_trigo();
	this.display_user();
	this.display_flags();
	this.display_wordstatus();
	this.display_undo();
	this.display_parentheses();
};

Hp12c_machine.prototype.pse = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.cli("pse");
	H.defer(function () {
		// do after dispatcher clears modifier
		H.display.show_pse();
	});
	H.delay(function () {
		self.sti("pse");
		self.display_modifier();
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.toggle_decimal_character = function ()
{
	if (H.type === "15c") {
		this.set_overflow(false);
	}

	this.comma = this.comma ? 0 : 1;
	this.display_result();
	H.storage.save();
	console.log("Storage saved");
};

Hp12c_machine.prototype.toggle_decimal_and_altdisplay = function ()
{
	// toggles altdisplay and comma alternatively
	if (this.altdisplay) {
		this.altdisplay = 0;
		this.display_result_s(false, false);
		this.display_wordstatus();
		H.storage.save();
	} else {
		this.altdisplay = 1;
		this.display_wordstatus();
		this.toggle_decimal_character();
	}
};

Hp12c_machine.prototype.display_result_date = function (dd)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.clear_typing();
	H.display.show(H.date_to_show(dd, this.dmy));
};

Hp12c_machine.prototype.clear_stack = function ()
{
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.reg_Reset("last_x");
};

Hp12c_machine.prototype.clear_reg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_REG;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.stack.last_x = this.reg_real("last_x");
		d.sto = [];
		d.nj = [];
		for (var e = 0; e <= H.MEM_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
			d.nj[e] = this.njmemory[e];
		}
		d.fin = [];
		for (e = 0; e < 5; ++e) {
			d.fin[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_reg();
};

Hp12c_machine.prototype.do_clear_reg = function ()
{
	if (H.type !== "11c" && H.type !== "15c" && H.type !== "16c") {
		this.clear_stack();
	}
	this.index = 0;
	this.indexh = 0;
	this.do_clear_fin();
	this.clear_sto();
	this.display_result_s(false, false);
};

// HP-12C Errors
// 0 = Division by zero, LN(negative) etc.
// 1 = STO + arith + memory position if memory position > 4
// 2 = statistics
// 3 = IRR
// 4 = Memory full (only happens in emulator when program typing reaches position 99+1)
// 5 = Composite interest
// 6 = CFj if j >= 30
// 7 = IRR
// 8 = Date

Hp12c_machine.prototype.display_pgrm = function ()
{
	H.display.show_pgrm(this.program_mode == H.PROGRAMMING,
				this.program_mode >= H.RUNNING,
				this.ip);
};

Hp12c_machine.prototype.display_trigo = function ()
{
	H.display.show_trigo(this.trigo);
};

Hp12c_machine.prototype.display_user = function ()
{
	H.display.show_user(this.user);
};

Hp12c_machine.prototype.display_algmode = function ()
{
	H.display.show_algmode(this.algmode);
};

Hp12c_machine.prototype.display_error = function (err)
{
	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	H.display.show_error(err);
	this.clear_typing();
	this.error_in_display = 1;

	if (this.program_mode >= H.RUNNING) {
		// errors stop programs
		H.pgrm.stop(2);
	}
};

Hp12c_machine.prototype.reset_error = function ()
{
	this.error_in_display = 0;
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result_s(false, false);
	} else if (this.program_mode == H.PROGRAMMING) {
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.display_modifier2 = function (m)
{
	H.display.show_modifier(m);
};

Hp12c_machine.prototype.display_modifier = function ()
{
	this.display_modifier2(this.modifier);
};

Hp12c_machine.prototype.display_begin = function ()
{
	H.display.show_begin(this.begin);
};

Hp12c_machine.prototype.display_carry = function ()
{
	if (H.type === "16c") {
		H.display.show_carry(this.flags[H.FLAG_CARRY]);
	}
};

Hp12c_machine.prototype.display_overflow = function ()
{
	if (H.type === "16c") {
		H.display.show_overflow(this.flags[H.FLAG_OVERFLOW]);
	} else if (H.type === "15c") {
		H.display.set_blink(this.flags[H.FLAG_OVERFLOW]);
	}
};

Hp12c_machine.prototype.display_complex = function ()
{
	if (H.type === "15c") {
		H.display.show_complex(this.flags[H.FLAG_COMPLEX]);
	}
};

Hp12c_machine.prototype.display_wordstatus = function ()
{
	if (H.type === "16c") {
		var st = "";
		if (this.notation >= H.NOTATION_INT && this.altdisplay) {
			st = "" + this.wordsize + ",";
			if (this.negative_repr) {
				st += this.negative_repr;
			} else {
				st += "u";
			}
			st += "<br>w=" + this.intwindow;
		}
		H.display.show_wordstatus(st);
	}
};

Hp12c_machine.prototype.display_flags = function ()
{
	this.display_carry();
	this.display_overflow();
	this.display_complex();
};

Hp12c_machine.prototype.display_undo = function ()
{
	if (H.type === "12c-platinum") {
		H.display.show_undo(this.undoable);
	}
};

Hp12c_machine.prototype.display_parentheses = function ()
{
	if (H.type === "12c-platinum") {
		var txt = "";
		if (this.algmode) {
			if (this.count_open_parentheses() > 0) {
				txt = "( )";
			} else if (this.algebra.length > 0) {
				txt = "..";
			}
		}
		H.display.show_parentheses(txt);
	}
};

Hp12c_machine.prototype.display_dmyc = function ()
{
	H.display.show_dmyc(this.dmy, this.compoundf);
};

Hp12c_machine.prototype.set_dmy = function (v)
{
	this.dmy = v;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.set_trigo = function (v)
{
	this.trigo = v;
	this.display_trigo();
	this.display_result();
};

Hp12c_machine.prototype.rpn_mode = function ()
{
	this.algmode = 0;
	this.algebra = [];
	this.display_parentheses();
	this.display_algmode();
	this.display_result();
};

Hp12c_machine.prototype.toggle_compoundf = function ()
{
	this.compoundf = this.compoundf ? 0 : 1;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.toggle_user = function ()
{
	this.user = this.user ? 0 : 1;
	this.display_user();
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result();
	}
};

Hp12c_machine.prototype.set_begin = function (v)
{
	this.begin = v;
	this.display_begin();
	this.display_result();
};

Hp12c_machine.prototype.set_modifier = function (v)
{
	this.modifier = v;
	if (v == H.GTO || v == H.GTO_MOVE) {
		// clean gto nn buffer on edge
		this.gto_buf_clear();
	}
	this.display_modifier();
};

Hp12c_machine.prototype.set_decimals = function (d, notation)
{
	var enable_push = false;
	if (this.notation >= H.NOTATION_INT) {
		// 16C case
		this.prepare_for_float_mode();
		this.enable_push = true;
	}
	this.notation = notation;
	this.decimals = d;
	this.display_wordstatus();
	this.display_result_s(true, enable_push);
};

Hp12c_machine.prototype.set_decimals_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.prepare_for_float_mode();
		this.intwindow = 0;
	}
	this.notation = H.NOTATION_SCI;
	this.decimals = 10;
	this.display_wordstatus();
	this.display_result();
};

Hp12c_machine.prototype.rst_modifier = function (df)
{
	if (df) {
		this.do_fincalc = 0;   // disarms financial calculation 
	}
	this.modifier = 0;
	this.display_modifier();
};

Hp12c_machine.prototype.push = function ()
{
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_To_reg("x", "y");
	this.pushed = 1;
};

Hp12c_machine.prototype.digit_add_chk_int = function (digit, typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = Math.ceil(this.wordsize / digit_bits);

	if (typed.length >= max_digits) {
		// all allowable digits typed 
		digit = null;
	}

	if (digit !== null) {
		digit = digit.toString(16);
	}

	return digit;
};

Hp12c_machine.prototype.chk_int_overflow = function (typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = this.wordsize / digit_bits;
	var max_digits_c = Math.ceil(max_digits);
	var max_digits_f = Math.floor(max_digits);

	if ((typed.length >= max_digits_c) && (max_digits_c !== max_digits_f)) {
		// test if MSB digit "splits" ie. has more bits than there
		// are bits still allowed by the word size. In this case,
		// MSB digit is cast to zero.

		// A simple bit count is not ok because in radix=10 every bit
		// depends on all digits, so it is not practical to detect overflow
		// based on the fact that 1 decimal digit ~= 3.3 bits

		var radix = H.radix[this.notation];
		var x1 = H.string_to_integer(typed, this.negative_repr,
						this.wordsize, radix);
		var x2 = H.string_to_integer(typed, this.negative_repr,
						this.wordsize + digit_bits,
						radix);
		if (x1.r !== x2.r || x1.h !== x2.h) {
			typed = "0" + typed.substr(1);
		}
	}

	return typed;
};

Hp12c_machine.prototype.digit_add = function (d)
{
	var radix = H.radix[this.notation] || 10;

	if (d >= radix) {
		return;
	}

	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
			this.display_undo();
		}
	}

	if (this.xmode == -1) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
		}
		if (d !== null) {
			if (! this.pushed) {
				this.push(); // push stack when result is immediately followed by typing
			}
			// just displayed a result
			this.clear_typing();
			this.typed_mantissa = this.chk_int_overflow("" + d);
			this.xmode = 0;
		}
	} else if (this.xmode === 0) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
			if (d !== null) {
				this.typed_mantissa = this.chk_int_overflow(this.typed_mantissa + "" + d);
			}
		} else {
			if (this.typed_mantissa.length < H.display.display_len) {
				this.typed_mantissa += "" + d;
			}
		}
	} else if (this.xmode === 1) {
		// integer mode never reaches this branch due to decimal_point_mode
		if ((this.typed_mantissa.length + this.typed_decimals.length) < H.display.display_len) {
			this.typed_decimals += "" + d;
		}
	} else if (this.xmode === 100) {
		// integer mode never gets this branch
		this.typed_exponent = this.typed_exponent.substr(1, 1);
		this.typed_exponent += "" + d;
	}

	this.display_typing();
};

Hp12c_machine.prototype.display_typing_integer = function ()
{
	var tu = H.string_to_integer(this.typed_mantissa, this.negative_repr,
					this.wordsize, H.radix[this.notation]);
	this.reg_Set_tuple("x", tu);

	H.display.displayTypedNumber_integer(this.reg_tuple("x"), this.xmode,
						this.typed_mantissa.length);
};

Hp12c_machine.prototype.display_typing = function ()
{
	if (H.type === "16c" && this.notation >= H.NOTATION_INT) {
		this.display_typing_integer();
		return;
	}

	var x = this.typed_mantissa_signal * 
		parseFloat(this.typed_mantissa + "." + this.typed_decimals + "0") * 
		Math.pow(10, parseInt("0" + this.typed_exponent, 10) * this.typed_exponent_signal);

	if (this.pushed_cplx_exception) {
		this.reg_Set_real_only("x", x);
	} else {
		this.reg_Set_real("x", x);
	}

	H.display.displayTypedNumber(this.typed_mantissa_signal, this.typed_mantissa,
		this.typed_decimals, this.typed_exponent, this.typed_exponent_signal,
		this.xmode);
};

Hp12c_machine.prototype.digit_delete = function ()
{
	var number_signal;
	var i;

	if (H.type === "15c") {
		this.set_overflow(false);
	}

	if (this.xmode == -1) {
		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			// backspace key actually exists in 11c/15c/16c
			var imaginary = 0;
			if (this.is_complex_mode()) {
				// preserve imaginary
				imaginary = this.xi;
			}
			this.reg_Set_tuple("x", {r: 0, h: 0, i: imaginary});

			// changes to in-place number editing
			// (does not push again when new number is typed)
			this.pushed = 1;
			this.pushed_cplx_exception = 1;

			H.display.displayNumber(this.reg_tuple("x"));
		} else {
			// does nothing
		}
		return;
	}

	if (H.type === "12c-platinum") {
		this.undoable = this.UNDOABLE_BSP_TYPING;
		var a = [];
		this.undoable_assets = a;
		a[0] = this.xmode;
		a[1] = this.typed_mantissa;
		a[2] = this.typed_decimals;
		a[3] = this.typed_exponent;
		a[4] = this.typed_mantissa_signal;
		a[5] = this.typed_exponent_signal;
		this.display_undo();
	}

	if (this.xmode === 0) {
		i = this.typed_mantissa.length - 1;
		if (i >= 0) {
			this.typed_mantissa = this.typed_mantissa.substr(0, i);
		}
	} else if (this.xmode === 1) {
		i = this.typed_decimals.length - 1;
		if (i < 0) {
			// decimal point mode but no decimal typed
			this.xmode = 0;
		} else {
			this.typed_decimals = this.typed_decimals.substr(0, i);
		}
	} else if (this.xmode === 100) {
		this.typed_exponent = "";
		if (this.typed_decimals.length > 0) {
			this.xmode = 1;
		} else {
			this.xmode = 0;
		}
	}

	this.display_typing();
};

Hp12c_machine.prototype.input_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
		this.typed_mantissa = "1";

	} else if (this.xmode != 100) {
		if (this.typed_mantissa.length > (H.display.display_len - 3)) {
			// too long; refuse
			return;
		}

		if (parseInt("0" + this.typed_mantissa, 10) === 0) {
			// no integer part

			this.typed_mantissa = "0";

			var val_dec = parseInt("0" + this.typed_decimals, 10);

			if (val_dec === 0) {
				// both integer and decimal parts all zero
				this.typed_mantissa = "1";
			} else {
				// test for irreductible decimals like 0.000000001
				var n_dec = val_dec.toFixed(0);
				var zeros = this.typed_decimals.length - ("" + n_dec).length;

				// if no decimal typed yet, zeros gets -1
				zeros = Math.max(0, zeros);
			
				if ((this.typed_mantissa.length + zeros) >=
						(H.display.display_len - 3)) {
					// too long; refuse
					return;
				}
			}
		}
	}

	this.xmode = 100;
	this.display_typing();
};

Hp12c_machine.prototype.decimal_point_mode = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		// just displayed a result
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
	}

	if (this.typed_mantissa.length <= 0) {
		this.typed_mantissa = "0";
	}

	this.xmode = 1;
	this.display_typing();
};

Hp12c_machine.prototype.chs_integer = function ()
{
	// CHS always goes to result mode
	this.save_lastx();
	var xt = this.reg_tuple("x");
	var calc = H.integer_inv([xt.h, xt.r], this.negative_repr, this.wordsize);
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.chs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_chs();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.chs_integer();
		return;
	}

	if (this.xmode === -1) {
		if (this.is_complex_mode()) {
			this.reg_Set_real_only("x", -this.reg_real("x"));
		} else {
			this.reg_Set_real("x", -this.reg_real("x"));
		}
		this.display_result();
		return;
	}

	if (this.xmode == 100) {
		// input mode, inputting exponential
		this.typed_exponent_signal *= -1;
	} else {
		this.typed_mantissa_signal *= -1;
	}

	this.display_typing();
};

Hp12c_machine.prototype.pop = function ()
{
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
};

Hp12c_machine.prototype.save_lastx = function ()
{
	if (! this.algmode) {
		this.reg_To_reg("x", "last_x");
	}
};

Hp12c_machine.prototype.lstx = function ()
{
	this.push();
	this.reg_To_reg("last_x", "x");
	this.display_result();
};

Hp12c_machine.prototype.shv = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.push();
	if (this.notation >= H.NOTATION_INT) {
		this.reg_Set_real("x", H.sve * 10);
	} else {
		this.reg_Set_real("x", H.sve);
	}
	this.display_result();
};

Hp12c_machine.prototype.apocryphal = function (i)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// to be overridden as necessary; this is here just for testing
	this.push();
	this.reg_Set_real("x", 140 + i);
	this.display_result();
};

Hp12c_machine.prototype.clear_prefix = function ()
{
	var self = this;

	if (this.notation >= H.NOTATION_INT) {
		return;	
	}

	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var n = Math.abs(this.reg_real("x"));
	var order = Math.log(n) / Math.log(10);

	if (H.badnumber(order)) {
		// tends to zero
		order = 1;
	}

	if (order == Math.floor(order)) {
		order += 0.1;
	}

	n = n * Math.pow(10, H.display.display_len - Math.ceil(order));

	this.cli("clear_prefix");

	H.display.show(H.zeropad(n.toFixed(0), H.display.display_len));

	H.delay(function () {
		self.sti("clear_prefix");
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.x_exchange_y = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.fix_index = function ()
{
	this.indexh = 0;
	var index = Math.floor(Math.abs(this.index));
	if (index >= H.MEM_MAX) {
		this.display_error(H.ERROR_INDEX);
		return null;
	}
	return index;
};

Hp12c_machine.prototype.x_exchange_index = function ()
{
	var self = this;

	if (self.matrix_in_index()) {
		self.x_exchange_matrix_index();
		return;
	}

	var index = self.fix_index();

	if (index === null) {
		return;
	}

	self.sto_Swap_reg(index, "x");
	self.display_result();
};

Hp12c_machine.prototype.x_exchange_for = function (mem_position)
{
	this.sto_Swap_reg(mem_position, "x");
	this.display_result();
};

Hp12c_machine.prototype.x_exchange_index_itself = function ()
{
	// (reg_Set_real calls reg_Set_tuple which casts an eventual
	// float index to integer.)

	var tmp = this.reg_tuple("x");
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.index = tmp.r;
	this.indexh = tmp.h;
	this.display_result();
};

Hp12c_machine.prototype.mem_info = function ()
{
	H.display.display_meminfo(this.ram_available(), this.sto_mem_len());
	this.error_in_display = 1;
};

Hp12c_machine.prototype.sf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_sf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_sf = function (i)
{
	this.flags[i] = 1;
	this.display_flags();
};

Hp12c_machine.prototype.cf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_cf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_cf = function (i)
{
	this.flags[i] = 0;

	if (H.type === "15c") {
		if (i === H.FLAG_COMPLEX) {
			this.xi = this.yi = this.zi = this.wi = this.last_xi = 0;
		}
	}

	this.display_flags();
};

Hp12c_machine.prototype.f_question = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.incr_ip(this.flags[i] ? 0 : 1);
};

Hp12c_machine.prototype.dissect_word = function (word)
{
	var sgn = H.binary_sgn(word);
	var index = H.cl5_round(Math.abs(word), 5);
	var counter = Math.floor(index) * sgn;
	index -= sgn * counter;
	index *= 1000;
	var cmp = Math.floor(index + 0.001);
	index = Math.max(0, index - cmp);
	index *= 100;
	var incr = Math.floor(index + 0.1);
	return [counter, cmp, incr];
};

Hp12c_machine.prototype.update_word = function (counter, cmp, incr)
{
	var sgn = H.binary_sgn(counter);
	counter = Math.abs(counter);
	return sgn * (counter + cmp / 1000 + incr / 100000);
};

Hp12c_machine.prototype.isg_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter += (incr === 0 ? 1 : incr);
	this.incr_ip(counter > cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_isg = function ()
{
	var word = this.isg_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.dse_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter -= (incr === 0 ? 1 : incr);
	// note that cmp >= 0; a negative counter means this is always True
	this.incr_ip(counter <= cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_dse = function ()
{
	var word = this.dse_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.r_down = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
	this.reg_Set_tuple("w", tmp);
	this.display_result();
};

Hp12c_machine.prototype.r_up = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("w", "x");
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.clx = function ()
{
	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			// CLx in this situation wipes undo possibility
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
		} else {
			this.undoable = this.UNDOABLE_CLX;
			this.undoable_assets = this.reg_real("x");
		}
		this.display_undo();
	}

	if (this.is_complex_mode()) {
		this.reg_Set_real_only("x", 0);
	} else {
		this.reg_Reset("x");
	}

	this.display_result();
	this.pushed = 1; // do not push if user retries typing
	this.pushed_cplx_exception = 1;
};

Hp12c_machine.prototype.finish_arithmetic = function (res, a, b)
{
	if (H.type === "16c") {
		var over = Math.abs(res) > H.value_max;
		this.set_overflow(over);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_real("x", H.arithmetic_round(res, a, b));
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_complex = function (res, a, b)
{
	this.save_lastx();
	this.pop();
	var tuple = {"r": H.arithmetic_round(res.r, a.r, b.r),
		     "i": H.arithmetic_round(res.i, a.i, b.i),
		     "h": 0};
	this.reg_Set_tuple("x", tuple);
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_int = function (calc)
{
	this.save_lastx();
	this.pop();
	this.set_carry(calc.carry);
	this.set_overflow(calc.overflow);
	this.reg_Set_tuple("x", calc.result);
	this.display_result();
};

Hp12c_machine.prototype.enter = function (g_modifier)
{
	if (this.algmode) {
		if (this.algebra.length > 0) {
			// pending op, do not push
			this.alg_resolve(1);
		} else if (! g_modifier) {
			this.push();
			this.display_result();
			this.pushed = 1;
		} else {
			// =, but nothing to solve, do not push
			this.display_result();
		}
	} else {
		this.push();
		this.display_result();
		this.pushed = 1; // already pushed, do not push twice when user types new number
	}
};

Hp12c_machine.prototype.plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_plus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_plus([x.h, x.r], [y.h, y.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("+");
		console.log("[+] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_plus(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y + x, x, y);
	}
};

Hp12c_machine.prototype.minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_minus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_minus([y.h, y.r], [x.h, x.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("-");
		console.log("[-] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_minus(y, x);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y - x, x, y);
	}
};

Hp12c_machine.prototype.multiply = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_multiply();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_multiply([x.h, x.r], [y.h, y.r],
				this.negative_repr, this.wordsize);
		// make sure multiplication does not change carry
		calc.carry = this.get_carry();
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("*");
		console.log("[*] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_multiply(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y * x, 0, 0);
	}
};

Hp12c_machine.prototype.divide = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_divide();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_divide([y.h, y.r], [x.h, x.r],
				this.negative_repr, this.wordsize,
				false);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			calc.result = calc.result[0];
			this.finish_arithmetic_int(calc);
		}
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("/");
		console.log("[/] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_divide(y, x);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		calc = this.reg_real("y") / this.reg_real("x");
		if (H.badnumber(calc)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(calc, 0, 0);
		}
	}
};

Hp12c_machine.prototype.poweryx = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("^");
		console.log("[^] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		var x = this.reg_tuple("x");
		var y = this.reg_tuple("y");
		var calc = H.complex_power(y, x);
		if (calc.err) {
			console.log("complex power err");
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic_complex(calc, x, y);
		}
	} else {
		var res = Math.pow(this.reg_real("y"), this.reg_real("x"));
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	}
};

Hp12c_machine.prototype.power10 = function ()
{ 
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_power10(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can be big but not NaN
	var res = H.clamp(Math.pow(10.0, this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.reciprocal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_reciprocal();
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_reciprocal(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	var res = 1 / this.reg_real("x");
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.square = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_square(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	// can overflow but is never NaN
	var res = H.clamp(Math.pow(this.reg_real("x"), 2));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.sqroot = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_sqrt(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var calc = H.integer_sqrt([xt.h, xt.r],
						this.negative_repr,
						this.wordsize);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.save_lastx();
			this.reg_Set_tuple("x", calc.result);
			this.set_carry(calc.carry);
			this.display_result();
		}
		return;
	}

	var res = Math.sqrt(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.exp = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		// can't fail
		var cres = H.complex_exp(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can't be NaN
	var res = H.clamp(Math.exp(this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.ln = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_ln(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.log10 = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_log10(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x")) / Math.log(10);
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.trig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			// only tan can yield error, due to our implementation
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f](H.radians(this.reg_real("x"), this.trigo));
	// sin, cos, tan can't yield NaN
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.triginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math[f](this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", H.to_angle_mode(res, this.trigo));
		this.display_result();
	}
};

Hp12c_machine.prototype.htrig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// hyperbolic sin/cos/tan can't yield NaN
	var res = H[f].call(null, this.reg_real("x"));
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.htriginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f].call(null, this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.intg = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.floor(Math.abs(this.reg_real("x"))) *
				H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.abs_integer = function ()
{
	// CHS always goes to result mode
	var xt = this.reg_tuple("x");
	var calc = H.integer_abs([xt.h, xt.r], this.negative_repr, this.wordsize);

	this.save_lastx();
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.abs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_abs(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.abs_integer();
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.abs(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_radians = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.degrees_to_radians(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_degrees = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.radians_to_degrees(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hms = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hour_to_hms(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hour = function () 
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hms_to_hour(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.pi = function ()
{
	this.push();
	this.reg_Set_real("x", Math.PI);
	this.display_result();
};

Hp12c_machine.prototype.random = function ()
{
	this.push();
	this.reg_Set_real("x", this.prng.random());
	this.display_result();
};

Hp12c_machine.prototype.random_sto = function ()
{
	var seed = this.reg_real("x");
	this.prng = new H.Prng(seed);
	this.display_result();
};

Hp12c_machine.prototype.random_rcl = function ()
{
	this.reg_Set_real("x", this.prng.getSeed());
	this.display_result();
};

Hp12c_machine.prototype.rnd = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.cl5_round(this.reg_real("x"), this.decimals));
	this.display_result();
};

Hp12c_machine.prototype.polar = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_to_polar(this.reg_tuple("x"));
		cres.i = H.to_angle_mode(cres.i, this.trigo);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var res = H.polar(this.reg_real("x"), this.reg_real("y"));
	// H.polar can't throw NaN
	var r = H.clamp(res[0]);
	var angle = res[1];

	this.save_lastx();
	this.reg_Set_real("x", r);
	this.reg_Set_real("y", H.to_angle_mode(angle, this.trigo));
	this.display_result();
};

Hp12c_machine.prototype.orthogonal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var arg = this.reg_tuple("x");
		arg.i = H.radians(arg.i, this.trigo);
		var cres = H.complex_to_cartesian(arg);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var r = this.reg_real("x");
	var angle = H.radians(this.reg_real("y"), this.trigo);
	var res = H.orthogonal(r, angle);
	// H.orthogonal can't throw NaN
	var x = H.clamp(res[0]);
	var y = H.clamp(res[1]);

	this.save_lastx();
	this.reg_Set_real("x", x);
	this.reg_Set_real("y", y);
	this.display_result();
};

Hp12c_machine.prototype.fatorial = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if ((H.type !== "11c" && H.type !== "15c" && H.type !== "16c") &&
			(this.reg_real("x") < 0 ||
				this.reg_real("x") !=
					Math.floor(this.reg_real("x")))) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	if (this.reg_real("x") > 69.95) {
		this.save_lastx();
		this.reg_Set_real("x", H.value_max);
		this.display_result();
		return;
	}

	var res;

	if (H.type === "11c" || H.type === "15c") {
		res = H.fatorial_gamma(this.reg_real("x"));
	} else {
		res = H.fatorial(this.reg_real("x"));
	}

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.frac = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", (Math.abs(this.reg_real("x")) -
				Math.floor(Math.abs(this.reg_real("x")))) *
					H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.percent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	var res = this.reg_real("y") * this.reg_real("x") / 100;
	res = H.clamp(res);
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.deltapercent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.sto = function (pos)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;
	// "pos" comes correctly adjusted from dispatcher even in the
	// case of HP-16C (0..15, 16..31).
	this.reg_To_sto("x", pos);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.sto_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.sto_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.reg_To_sto("x", index);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.get_index = function ()
{
	this.push();
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.display_result();
};

Hp12c_machine.prototype.set_index = function ()
{
	var x = this.reg_tuple("x");
	this.index = x.r;
	this.indexh = x.h;
	this.display_result();
};

Hp12c_machine.prototype.tarithmetic = function (at, bt, op)
{
	// not implemented in 16c
	var res = {};
	res.r = res.i = res.h = 0;
	if (op === "+") {
		res.r = at.r + bt.r;
	} else if (op === "-") {
		res.r = at.r - bt.r;
	} else if (op === "x") {
		res.r = at.r * bt.r;
	} else if (op === "/") {
		res.r = at.r / bt.r;
	}
	return res;
};

Hp12c_machine.prototype.stoinfix_core = function (a, operation)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	var b = this.reg_tuple("x");

	if (operation ==  H.STO_PLUS) {
		a = this.tarithmetic(a, b, "+");
	} else if (operation == H.STO_MINUS) {
		a = this.tarithmetic(a, b, "-");
	} else if (operation == H.STO_TIMES) {
		a = this.tarithmetic(a, b, "x");
	} else if (operation == H.STO_DIVIDE) {
		a = this.tarithmetic(a, b, "/");
		if (H.badnumber(a.r)) {
			this.display_error(H.ERROR_DIVZERO);
			return null;
		}
	}

	a.r = H.clamp(a.r);

	return a;
};

Hp12c_machine.prototype.rcl = function (pos)
{
	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(pos, "x");
	this.display_result();
};

Hp12c_machine.prototype.rcl_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.rcl_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(index, "x");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_rcl = function ()
{
	this.push();
	this.push();
	this.sto_To_reg(H.STAT_X, "x");
	this.sto_To_reg(H.STAT_Y, "y");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(+1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_sigma_minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(-1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_avgw = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// 16C does not have statistics, so this is ok
	var res = H.stat_avgw(this.sto_mem_ref());
	
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res[1]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_avg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_avg(this.sto_mem_ref());

	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_stddev = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stddev(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
		return;
	}

	this.save_lastx();
	this.push();
	this.reg_Set_real("x", res[1]);
	this.reg_Set_real("y", res[2]);
	this.display_result();
};

Hp12c_machine.prototype.stat_lr = function (is_x)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_kr(this.sto_mem_ref(), is_x, this.reg_real("x"));
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_linearregression = function ()
{
	// this method is called only for 11C and 15C
	/*
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}
	*/

	var res = H.linear_regression(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.push();
		this.reg_Set_real("x", res[1]); // B
		this.reg_Set_real("y", res[2]); // A
		this.display_result();
	}
};

Hp12c_machine.prototype.permutations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zc_zp();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.permutations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.combinations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zp_zc();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.combinations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.display_program_opcode = function ()
{
	var instr = this.ram[this.ip];

	if (H.type === "16c") {
		instr = H.pgrm.hex_opcode(instr);
	} else if (H.type === "15c") {
		instr = H.pgrm.shrunk_opcode(instr);
	}

	var txt = H.zeropad(this.ip.toFixed(0), H.ram_ADDR_SIZE) +
				"-" + instr;
	H.display.show(txt);
};

Hp12c_machine.prototype.prog_pr = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (this.program_mode == H.INTERACTIVE) {
		this.program_mode = H.PROGRAMMING;
		// NOTE: entering programming mode does not reset instruction pointer
		// this.ip = 0;
		this.display_pgrm();
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.prog_bst_after = function ()
{
	this.sti("bst_after");
	this.display_result_s(false, false);
};

Hp12c_machine.prototype.gto_digit_add = function (n)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.gtoxx = "" + this.gtoxx + n.toFixed(0);
	if (this.gtoxx.length >= H.ram_ADDR_SIZE) {
		var new_ip = parseInt(this.gtoxx, 10);
		this.gtoxx = "";
		this.rst_modifier(); // OK

		if (new_ip > this.program_limit()) {
			this.display_error(H.ERROR_IP);
			return;
		}

		this.ip = new_ip;
	}
};

Hp12c_machine.prototype.ntest = function (var1, criteria, var2, cplx)
{
	var1 = this.reg_tuple(var1);

	if (var2 !== "0") {
		var2 = this.reg_tuple(var2);
	} else {
		var2 = {r: 0, h: 0, i: 0};
	}

	var res;

	if (this.notation >= H.NOTATION_INT) {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.integer_eq(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<=") {
			res = H.integer_le(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<") {
			res = H.integer_lt(var1, var2, this.negative_repr, this.wordsize);
		}
	} else {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.feq10(var1.r, var2.r);
			if (cplx && this.is_complex_mode()) {
				res = res && H.feq10(var1.i, var2.i);
			}
		} else if (criteria == "<=") {
			res = var1.r <= var2.r;
		} else if (criteria == "<") {
			res = var1.r < var2.r;
		}
	}

	return res;
};

Hp12c_machine.prototype.test = function (condition)
{
	this.display_result_s(false, true);
	this.incr_ip(condition ? 0 : 1);
};

Hp12c_machine.prototype.test_x_le_y = function ()
{
	this.test(this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_gt_y = function ()
{
	this.test(! this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_eq_y = function ()
{
	this.test(this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ne_y = function ()
{
	this.test(! this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ge_y = function ()
{
	this.test(! this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_lt_y = function ()
{
	this.test(this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_less_0 = function ()
{
	this.test(this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_ge_0 = function ()
{
	this.test(! this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_gt_0 = function ()
{
	this.test(! this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_le_0 = function ()
{
	this.test(this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_eq0 = function ()
{
	// works for matrix since x would be a non-zero descriptor
	this.test(this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.test_x_ne0 = function ()
{
	this.test(! this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.gto_buf_clear = function ()
{
	this.gtoxx = "";
};

Hp12c_machine.prototype.nop = function ()
{
};

Hp12c_machine.prototype.program_stopped = function (reason)
{
	if (H.type !== "15c") {
		return;
	}

	// handles result of subroutine execution for SOLVE,
	// integration, etc.

	this.pop_running_context(reason);
};

Hp12c_machine.prototype.get_complex = function ()
{
	return this.flags[H.FLAG_COMPLEX];
};

Hp12c_machine.prototype.is_complex_mode = function ()
{
	if (H.type === "15c") {
		return this.get_complex();
	}

	return false;
};

Hp12c_machine.prototype.set_complex = function (v)
{
	if (H.type === "15c") {
		this.do_sf(H.FLAG_COMPLEX);
	}
};

Hp12c_machine.prototype.set_overflow = function (v)
{
	if (H.type === "16c" || H.type === "15c") {
		if (v) {
			this.do_sf(H.FLAG_OVERFLOW);
		} else {
			this.do_cf(H.FLAG_OVERFLOW);
		}
	}
};

Hp12c_machine.prototype.get_overflow = function ()
{
	return this.flags[H.FLAG_OVERFLOW];
};

Hp12c_machine.prototype.matrix_in_reg = function (reg)
{
	if (H.type !== "15c") {
		return 0;
	}

	var self = this;

	var x = self.reg_tuple(reg);

	if ((! x.h) || (! self.chk_matrix_number(x.r))) {
		return 0;
	}

	return x.r;
};

Hp12c_machine.prototype.matrix_in_index = function ()
{
	var self = this;

	if (H.type !== "15c") {
		return 0;
	}

	if ((! self.indexh) || (! self.chk_matrix_number(self.index))) {
		return 0;
	}

	return self.index;
};

Hp12c_machine.prototype.alg_resolve = function (close_all)
{
	if (H.type !== "12c-platinum") {
		return 1;
	}
	return this.alg_resolve_in(close_all);
};

Hp12c_machine.prototype.stoinfix = function (pos, operation)
{
	var a;
	if (pos === 99999) {
		a = {r: this.index, i: 0, h: 0};
	} else {
		a = this.sto_tuple(pos);
	}
	a = this.stoinfix_core(a, operation);

	if (a === null) {
		return;
	}

	if (pos === 99999) {
		this.index = a.r;
	} else {
		this.sto_Set_tuple(pos, a);
	}
	this.display_result();
};

Hp12c_machine.prototype.stoinfix_index = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.sto_infix_matrix_el_i(operation);
		return;
	}

	var index = this.fix_index();
 
	if (index === null) {
		return;
	}

	this.stoinfix(index, operation);
};
/* HP-12C emulator 
 * Copyright (c) 2013 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*global H, Hp12c_machine */

"use strict";

Hp12c_machine.prototype.window_count = function ()
{
	var bits_per_digit = H.digit_bits[this.notation];
	var digits_on_display = H.win_digits[this.notation];
	var tot_digits = Math.ceil(this.wordsize / bits_per_digit);

	return Math.ceil(tot_digits / digits_on_display);
};

Hp12c_machine.prototype.set_window = function (nw)
{
	this.intwindow = nw;
	this.display_wordstatus();
	this.display_result_s(false, false);
};

Hp12c_machine.prototype.show_window = function (nw)
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	console.log("Setting window to " + nw);

	if (nw < 0 || nw >= this.window_count()) {
		this.display_error(H.ERROR_IMPROPER_N);
		return;
	}

	this.set_window(nw);
};

Hp12c_machine.prototype.prepare_for_integer_mode = function ()
{
	// still in integer mode at this point
	var x = this.reg_real("x");
	var mantissa = {r: 0, h: 0, i: 0};
	var exp2 = {r: 0, h: 0, i: 0};

	if (x !== 0 && ! H.badnumber(x)) {
		x = Math.abs(x);
		// rank of 1 is 1, so mantissa becomes >= 2**31 and < 2**32
		var rank = Math.floor(Math.log(Math.abs(x)) / Math.log(2)) + 1;
		mantissa = x * Math.pow(2, 32 - rank);
		exp2 = rank - 32;
		if (this.negative_repr <= 0) {
			mantissa = Math.abs(mantissa);
			exp2 = Math.abs(exp2);
		}
		mantissa = Math.round(mantissa).toString();
		mantissa = H.string_to_integer(mantissa, this.negative_repr, 56, 10);
		exp2 = Math.round(exp2).toString();
		exp2 = H.string_to_integer(exp2, this.negative_repr, 56, 10);
	}

	this.wordsize = 56;
	// provisional setting so next commands accept integers
	this.notation = H.NOTATION_INT_HEX;

	this.reg_Set_tuple("x", exp2);
	this.reg_Set_tuple("y", mantissa);
	this.reg_Set_tuple("z", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("w", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("last_x", {r: 0, h: 0, i: 0});
};

Hp12c_machine.prototype.prepare_for_float_mode = function ()
{
	// still in integer mode at this point
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	x = H.integer_to_string(x, this.negative_repr, this.wordsize,
					10, true);
	y = H.integer_to_string(y, this.negative_repr, this.wordsize,
					10, true);
	// ok if numbers exceed FP precision
	x = parseInt(x, 10);
	y = parseInt(y, 10);

	this.set_overflow(0);

	var y2x = y * Math.pow(2.0, x);

	if (y2x > H.value_max || H.badnumber(y2x)) {
		y2x = H.value_max;
		this.set_overflow(1);
	} else if (y2x < -H.value_max) {
		y2x = -H.value_max;
		this.set_overflow(1);
	}

	// provisional setting so next methods accept float values
	this.notation = H.NOTATION_FIX;

	this.reg_Set_tuple("x", {r: y2x, h: 0, i: 0});
	this.reg_Set_tuple("z", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("w", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("y", {r: 0, h: 0, i: 0});
	this.reg_Set_tuple("last_x", {r: 0, h: 0, i: 0});

	this.wordsize = 56;
};

Hp12c_machine.prototype.word_bit = function (t, n)
{
	return H.word_bit(t, n);
};

Hp12c_machine.prototype.word_Set_bit = function (t, n, v)
{
	H.word_Set_bit(t, n, v);
};

Hp12c_machine.prototype.word_Set_msb = function (t, v)
{
	this.word_Set_bit(t, this.wordsize - 1, v);
};

Hp12c_machine.prototype.word_Set_lsb = function (t, v)
{
	this.word_Set_bit(t, 0, v);
};

Hp12c_machine.prototype.word_msb = function (t)
{
	return this.word_bit(t, this.wordsize - 1);
};

Hp12c_machine.prototype.word_lsb = function (t)
{
	return this.word_bit(t, 0);
};

Hp12c_machine.prototype.set_carry = function (v)
{
	if (H.type === "16c") {
		if (v) {
			this.do_sf(H.FLAG_CARRY);
		} else {
			this.do_cf(H.FLAG_CARRY);
		}
	}
};

Hp12c_machine.prototype.get_carry = function ()
{
	return this.flags[H.FLAG_CARRY];
};

Hp12c_machine.prototype.get_zeros_flag = function ()
{
	return this.flags[H.FLAG_ZEROS];
};

Hp12c_machine.prototype.shift_left_tuple = function (t)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	t.h = t.h << 1;
	if (t.r & 0x80000000) {
		t.h = t.h | 0x01;
	}
	t.r = t.r << 1;
	/*jslint bitwise: true */

	this.cast_wordsize(t);
	return t;
};

Hp12c_machine.prototype.shift_right_tuple = function (t)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	t.r = t.r >>> 1;
	if (t.h & 0x01) {
		t.r = t.r | 0x80000000;
	}
	t.h = t.h >>> 1;
	/*jslint bitwise: true */

	this.cast_wordsize(t);
	return t;
};

Hp12c_machine.prototype.shiftleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	this.set_carry(this.word_msb(t));
	this.shift_left_tuple(t);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.shiftright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	this.set_carry(this.word_lsb(t));
	this.shift_right_tuple(t);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.leftjustify = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = 0;
	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	if (t.r === 0 && t.h === 0) {
		// do nothing
	} else {
		while (! this.word_msb(t)) {
			this.shift_left_tuple(t);
			++bits;
		}
	}

	this.save_lastx();
	this.push();
	this.reg_Set_tuple("y", t);
	this.reg_Set_real("x", bits);
	this.display_result();
};

Hp12c_machine.prototype.arithmeticshift = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	var signal = this.word_msb(t);
	this.set_carry(this.word_lsb(t));
	this.shift_right_tuple(t);
	if (this.wordsize > 1) {
		this.word_Set_msb(t, signal);
	}

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftc = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.rotate_left_tuple(t, 1);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightc = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");
	this.cast_wordsize(t);

	var lsb = this.word_lsb(t);
	var carry = this.get_carry();

	this.shift_right_tuple(t);

	this.set_carry(lsb);
	this.word_Set_msb(t, carry);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotate_left_tuple = function (t, rot_with_carry)
{
	this.cast_wordsize(t);

	/*jslint bitwise: false */
	var msb = this.word_msb(t);
	var carry = this.get_carry(t);

	this.shift_left_tuple(t);

	this.set_carry(msb);
	if (rot_with_carry) {
		this.word_Set_lsb(t, carry);
	} else {
		this.word_Set_lsb(t, msb);
	}
	/*jslint bitwise: true */

	this.cast_wordsize(t);

	return t;
};

Hp12c_machine.prototype.rotateleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");

	this.rotate_left_tuple(t, 0);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotate_right_tuple = function (t, rot_with_carry)
{

	this.cast_wordsize(t);

	/*jslint bitwise: false */

	var lsb = this.word_lsb(t);
	var carry = this.get_carry();

	this.shift_right_tuple(t);

	this.set_carry(lsb);
	if (rot_with_carry) {
		this.word_Set_msb(t, carry);
	} else {
		this.word_Set_msb(t, lsb);
	}

	this.cast_wordsize(t);

	/*jslint bitwise: true */
	return t;
};

Hp12c_machine.prototype.rotateright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("x");

	this.rotate_right_tuple(t, 0);

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_left_tuple(t, 0);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_right_tuple(t, 0);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotateleftcn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_left_tuple(t, 1);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.rotaterightcn = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var t = this.reg_tuple("y");
	var n = Math.abs(this.reg_real("x"));

	if (n < 0 || n > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	while (--n >= 0) {
		this.rotate_right_tuple(t, 1);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.maskleft = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = Math.abs(this.reg_real("x"));

	if (bits < 0 || bits > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	var t = {r: 0xffffffff, h: 0xffffffff, i: 0};

	// convert 'bits 1' to 'bits 0'
	bits = this.wordsize - bits;

	while (--bits >= 0) {
		this.shift_left_tuple(t, 0);
	}

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.bitcount = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var t = this.reg_tuple("x");
	this.cast_wordsize(t);
	var bits = 0;
	/*jslint bitwise: false */
	while (t.r || t.h) {
		if (t.r & 0x01) {
			++bits;
		}
		if (t.h & 0x01) {
			++bits;
		}
		t.r = t.r >>> 1;
		t.h = t.h >>> 1;
	}
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_real("x", bits);
	this.display_result();
};

Hp12c_machine.prototype.maskright = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bits = Math.abs(this.reg_real("x"));
	if (bits < 0 || bits > this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	/*jslint bitwise: false */
	var t = {r: 0xffffffff, h: 0xffffffff, i: 0};

	if (bits <= 0) {
		t.h = t.r = 0;
	} else if (bits <= 32) {
		t.h = 0;
		t.r = t.r >>> (32 - bits);
	} else {
		t.h = t.h >>> (64 - bits);
	}
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_tuple("x", t);
	this.display_result();
};

Hp12c_machine.prototype.bit_xor = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r ^ y.r), 
		  h: (x.h ^ y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.show_integer_diff = function (notation)
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	} else if (notation == this.notation) {
		// current notation already
		return;
	}
	
	this.cli("show_integer_diff");

	this.saved_notation = this.notation;
	this.notation = notation;
	this.display_result_s(true, false); // reset window, ! enable push

	var self = this;

	H.delay(function () {
		self.sti("show_integer_diff");
		self.notation = self.saved_notation;
		self.display_result();
	}, 2000);
};

Hp12c_machine.prototype.show_integer_hex = function ()
{
	this.show_integer_diff(H.NOTATION_INT_HEX);
};

Hp12c_machine.prototype.show_integer_dec = function ()
{
	this.show_integer_diff(H.NOTATION_INT_DEC);
};

Hp12c_machine.prototype.show_integer_oct = function ()
{
	this.show_integer_diff(H.NOTATION_INT_OCT);
};

Hp12c_machine.prototype.show_integer_bin = function ()
{
	this.show_integer_diff(H.NOTATION_INT_BIN);
};

Hp12c_machine.prototype.integer_hex = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_HEX;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_dec = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_DEC;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_oct = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_OCT;
	this.set_window(0);
};

Hp12c_machine.prototype.integer_bin = function ()
{
	if (this.notation < H.NOTATION_INT) {
		this.prepare_for_integer_mode();
	}
	this.notation = H.NOTATION_INT_BIN;
	this.set_window(0);
};

Hp12c_machine.prototype.set_bit = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	this.cast_wordsize(y);
	this.word_Set_bit(y, bit, 1);

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", y);
	this.display_result();
};

Hp12c_machine.prototype.clr_bit = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}

	this.cast_wordsize(y);
	this.word_Set_bit(y, bit, 0);

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", y);
	this.display_result();
};

Hp12c_machine.prototype.bit_question = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var bit = Math.abs(this.reg_real("x"));
	var y = this.reg_tuple("y");

	if (bit < 0 || bit >= this.wordsize) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	
	this.save_lastx();
	this.pop();
	this.incr_ip(this.word_bit(y, bit) ? 0 : 1);

	this.display_result();
};

Hp12c_machine.prototype.sc_cpl1 = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 1;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.sc_cpl2 = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 2;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.sc_unsigned = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	this.negative_repr = 0;
	this.display_wordstatus();
	this.display_result_s(true, false);
};

Hp12c_machine.prototype.bit_not = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	this.cast_wordsize(x);
	/*jslint bitwise: false */
	// reg_Set_tuple rips off excess bits
	var z = { r: ~x.r, 
		  h: ~x.h,
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.move_window_l = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var nw = this.intwindow + 1;
	if (nw >= 0 && nw < this.window_count()) {
		this.set_window(nw);
	}
};

Hp12c_machine.prototype.move_window_r = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var nw = this.intwindow - 1;
	if (nw >= 0 && nw < this.window_count()) {
		this.set_window(nw);
	}
};

Hp12c_machine.prototype.wsize = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var n = this.reg_real("x");
	if (n < 0 || n > 64) {
		this.display_error(H.ERROR_IMPROPER_BIT);
		return;
	}
	if (n === 0) {
		n = 64;
	}
	this.wordsize = n;
	this.save_lastx();
	this.cast_wordsize_in_accumulators();
	this.pop();
	this.display_wordstatus();
	this.display_result();
};

Hp12c_machine.prototype.status_16c = function ()
{
	var txt = "";

	if (this.negative_repr <= 0) {
		txt = "U";
	} else {
		txt = "" + this.negative_repr;
	}

	txt += "-";
	txt += H.zeropad("" + this.wordsize, 2);
	txt += "-";
	
	var i;
	for (i = 3; i >= 0; --i) {
		txt += (this.flags[i] ? "1" : "0");
	}

	this.cli("status_16c");

	H.display.show(txt);

	var self = this;
	H.delay(function () {
		self.sti("status_16c");
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.bit_and = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r & y.r), 
		  h: (x.h & y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.bit_or = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}
	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	/*jslint bitwise: false */
	var z = { r: (x.r | y.r), 
		  h: (x.h | y.h),
		  i: 0 };
	/*jslint bitwise: true */

	this.save_lastx();
	this.pop();
	this.reg_Set_tuple("x", z);
	this.display_result();
};

Hp12c_machine.prototype.dsz = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.index = Math.round(this.index);
	}
	this.index--;
	this.incr_ip(this.index === 0 ? 1 : 0);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.isz = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.index = Math.round(this.index);
	}
	this.index++;
	this.incr_ip(this.index === 0 ? 1 : 0);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.rmd = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r], [x.h, x.r], this.negative_repr,
				 this.wordsize, false);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	// does not affect carry and overflow
	this.reg_Set_tuple("x", t.result[1]);
	this.display_result();
};

Hp12c_machine.prototype.dblr = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	var z = this.reg_tuple("z");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	this.cast_wordsize(z);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r, z.h, z.r], [x.h, x.r],
				 this.negative_repr, this.wordsize, true);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	this.pop();
	// does not affect carry and overflow
	this.reg_Set_tuple("x", t.result[1]);

	this.display_result();
};

Hp12c_machine.prototype.dblmult = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	this.cast_wordsize(x);
	this.cast_wordsize(y);

	var t = H.integer_multiply([y.h, y.r], [x.h, x.r], this.negative_repr,
					this.wordsize, true);

	this.save_lastx();
	// does not affect carry
	this.set_overflow(t.overflow);        // always false
	this.reg_Set_tuple("x", t.result[1]); // hi
	this.reg_Set_tuple("y", t.result[0]); // lo
	this.display_result();
};

Hp12c_machine.prototype.dbldiv = function ()
{
	if (this.notation < H.NOTATION_INT) {
		// not in 16C integer mode
		return;
	}

	var x = this.reg_tuple("x");
	var y = this.reg_tuple("y");
	var z = this.reg_tuple("z");
	this.cast_wordsize(x);
	this.cast_wordsize(y);
	this.cast_wordsize(z);
	if (x.r === 0 && x.h === 0) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	var t = H.integer_divide([y.h, y.r, z.h, z.r], [x.h, x.r],
				 this.negative_repr, this.wordsize, true);
	if (t.overflow) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.pop();
	this.pop();
	this.set_carry(t.carry);
	this.set_overflow(t.overflow);
	this.reg_Set_tuple("x", t.result[0]);
	this.display_result();
};
/* HP-16C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_dispatcher()
{
}

// aliases to function and modifier arrays;
var K = [];
var M = [];
var I;

Hp12c_dispatcher.prototype.functions = K;
Hp12c_dispatcher.prototype.modifier_sm = M;

Hp12c_dispatcher.prototype.KEY_RS = 31;
Hp12c_dispatcher.prototype.KEY_SST = 32;
H.KEY_INDEX = Hp12c_dispatcher.prototype.KEY_INDEX = 32;
H.FF = Hp12c_dispatcher.prototype.KEY_FF = 42;
H.GG = Hp12c_dispatcher.prototype.KEY_GG  = 43;
H.STO = Hp12c_dispatcher.prototype.KEY_STO = 44;
H.RCL = Hp12c_dispatcher.prototype.KEY_RCL = 45;
H.GTO = Hp12c_dispatcher.prototype.KEY_GTO = 22;
H.GSB = Hp12c_dispatcher.prototype.KEY_GSB = 21;
Hp12c_dispatcher.prototype.KEY_DECIMAL = 48;
Hp12c_dispatcher.prototype.KEY_PLUS = 40;
Hp12c_dispatcher.prototype.KEY_MINUS = 30;
Hp12c_dispatcher.prototype.KEY_MULTIPLY = 20;
Hp12c_dispatcher.prototype.KEY_DIVIDE = 10;
Hp12c_dispatcher.prototype.KEY_BACKSPACE = 35;
Hp12c_dispatcher.prototype.KEY_RDOWN = 33;
H.ENTER = 36;

H.STO2 = H.STO * 100 + 48;
H.RCL2 = H.RCL * 100 + 48;
H.GTO_MOVE = H.GTO * 100 + 48;
H.LBL = H.GG * 100 + 22; // g-GTO
H.FLOAT = H.FF * 100 + H.RCL; 
H.GG_CF = H.GG * 100 + 5; // is NOT equivalent to GG for other keys
H.GG_SF = H.GG * 100 + 4;
H.GG_FQUESTION = H.GG * 100 + 6;
H.WINDOW = H.FF * 100 + H.ENTER;
H.STO_FF = H.STO * 100 + H.FF;
H.RCL_FF = H.RCL * 100 + H.FF;

Hp12c_dispatcher.init_vars = function () {
	var Keys = [11, 12, 13, 14, 15, 16, 7, 8, 9, 10,
	    21, 22, 23, 24, 25, 26, 4, 5, 6, 20,
	    31, 32, 33, 34, 35, 36, 1, 2,  3, 30,
	    41, 42, 43, 44, 45, 0, 48, 49, 40,
	    50];

	var Modifiers = [H.FF, H.GG, H.STO, H.RCL, 48, 10, 20, 30, 40,
	    4, 5, 6, H.GTO, H.GSB, H.ENTER]; 

	var i;

	for (i = 0; i < Keys.length; i++) {
		K[Keys[i]] = [];
	}

	for (i = 0; i < Modifiers.length; i++) {
		M[Modifiers[i]] = [];
	}
};

Hp12c_dispatcher.init_vars();

for (I = 0; I <= 16; ++I) {
	// adds all functions that are common to all digits
	if (I == 10) {
		continue;
	}

	var RI = I;

	if (RI >= 11) {
		// keys 11-16 correspond to values a-f (10-15)
		RI -= 1;
	}

	var SI = RI.toString(16);

	if (I < 10) {
		K[I][H.FLOAT] = H.make_closure("set_decimals", [I, H.NOTATION_FIX], "FIX " + SI);
		K[I][H.WINDOW] = H.make_closure("show_window", [I], "WINDOW " + SI);
		K[I][H.GTO_MOVE] = H.make_closure("gto_digit_add", [RI], "GTO DIGIT ADD " + SI);
		K[I][H.GTO_MOVE].dont_rst_modifier = 1;
	}

	K[I][H.RCL] = H.make_closure("rcl", [RI], "RCL " + SI);
	K[I][H.RCL2] = H.make_closure("rcl", [RI + 16], "RCL . " + SI);
	K[I][H.STO] = H.make_closure("sto", [RI], "STO " + SI);
	K[I][H.STO2] = H.make_closure("sto", [RI + 16], "STO . " + SI);
	K[I][H.GTO] = H.make_pgrm_closure("gto", I, "GTO " + SI);
	K[I][H.GSB] = H.make_pgrm_closure("gosub", I, "GSB " + SI);
	K[I][H.LBL] = H.make_pgrm_closure("label", I, "LBL " + SI);
	K[I][H.GG_SF] = H.make_closure("sf", [RI], "SF " + SI);
	K[I][H.GG_CF] = H.make_closure("cf", [RI], "CF " + SI);
	K[I][H.GG_FQUESTION] = H.make_closure("f_question", [RI], "F? " + SI);
	K[I][0] = H.make_closure("digit_add", [RI], SI);
}

I = 11;

K[I][H.FF] = H.make_closure("shiftleft", [], "SL");
K[I][H.GG] = H.make_closure("leftjustify", [], "LJ");

I = 12;

K[I][H.FF] = H.make_closure("shiftright", [], "SR");
K[I][H.GG] = H.make_closure("arithmeticshift", [], "ASR");

I = 13;

K[I][H.FF] = H.make_closure("rotateleft", [], "RL");
K[I][H.GG] = H.make_closure("rotateleftc", [], "RLc");

I = 14;

K[I][H.FF] = H.make_closure("rotateright", [], "RR");
K[I][H.GG] = H.make_closure("rotaterightc", [], "RRc");

I = 15;

K[I][H.FF] = H.make_closure("rotateleftn", [], "RLn");
K[I][H.GG] = H.make_closure("rotateleftcn", [], "RLcn");

I = 16;

K[I][H.FF] = H.make_closure("rotaterightn", [], "RRn");
K[I][H.GG] = H.make_closure("rotaterightcn", [], "RRcn");

I = 7;

K[I][H.FF] = H.make_closure("maskleft", [], "MASKL");
K[I][H.GG] = H.make_closure("bitcount", [], "#B");

I = 8;

K[I][H.FF] = H.make_closure("maskright", [], "MASKR");
K[I][H.GG] = H.make_closure("abs", [], "ABS");

I = 9;

K[I][H.GG] = H.make_closure("dblr", [], "DBLR");
K[I][H.FF] = H.make_closure("rmd", [], "RMD");

I = 10;

K[I][0] = H.make_closure("divide", [], "/");
K[I][H.FF] = H.make_closure("bit_xor", [], "XOR");
K[I][H.GG] = H.make_closure("dbldiv", [], "DBL/");

I = 21;

K[I][H.FF] = H.make_closure("x_exchange_index", [], "X<->(I)");
K[I][H.GG] = H.make_pgrm_closure("rtn", -1, "RTN");
M[I][0] = H.GSB;

I = 22;

K[I][H.FF] = H.make_closure("x_exchange_index_itself", [], "X<->I");
M[I][0] = H.GTO;
M[I][H.GG] = H.LBL;

I = 23;

K[I][H.GG] = H.make_closure("dsz", [], "DSZ");
K[I][H.FF] = H.make_closure("show_integer_hex", [], "SHOW HEX");
K[I][0] = H.make_closure("integer_hex", [], "INT HEX");

I = 24;

K[I][H.GG] = H.make_closure("isz", [], "ISZ");
K[I][H.FF] = H.make_closure("show_integer_dec", [], "SHOW DEC");
K[I][0] = H.make_closure("integer_dec", [], "INT DEC");

I = 25;

K[I][H.GG] = H.make_closure("sqroot", [], "SQRT");
K[I][H.FF] = H.make_closure("show_integer_oct", [], "SHOW OCT");
K[I][0] = H.make_closure("integer_oct", [], "INT OCT");


I = 26;

K[I][H.GG] = H.make_closure("reciprocal", [], "1/X");
K[I][H.FF] = H.make_closure("show_integer_bin", [], "SHOW BIN");
K[I][0] = H.make_closure("integer_bin", [], "INT BIN");

I = 4;

K[I][H.FF] = H.make_closure("set_bit", [], "SB");
M[I][H.GG] = H.GG_SF;

I = 5;

K[I][H.FF] = H.make_closure("clr_bit", [], "CB");
M[I][H.GG] = H.GG_CF;

I = 6;

K[I][H.FF] = H.make_closure("bit_question", [], "B?");
M[I][H.GG] = H.GG_FQUESTION;

I = 20;

K[I][H.FF] = H.make_closure("bit_and", [], "AND");
K[I][H.GG] = H.make_closure("dblmult", [], "DBLx");
K[I][0] = H.make_closure("multiply", [], "x");

I = 31;

K[I][0] = H.make_pgrm_closure("rs", -1, "R/S");
K[I][H.RCL] = H.make_closure("rcl_index", [], "RCL (I)");
K[I][H.FF] = H.make_closure("rcl_index", [], "f (I)");
K[I][H.FF].reducible = true;
K[I][H.FF].reduced_modifier = H.RCL;
K[I][H.GG] = H.make_closure("prog_pr", [], "P/R");
K[I][H.RCL_FF] = H.make_closure("rcl_index", [], "RCL f (I)");
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;
K[I][H.STO] = H.make_closure("sto_index", [], "STO (I)");
K[I][H.STO_FF] = H.make_closure("sto_index", [], "STO f (I)");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;

I = 32;

K[I][0] = H.make_pgrm_closure("sst", -1, "SST");
K[I][H.RCL] = H.make_closure("get_index", [], "RCL I");
K[I][H.FF] = H.make_closure("get_index", [], "I");
K[I][H.FF].reducible = true;
K[I][H.FF].reduced_modifier = H.RCL;
K[I][H.GG] = H.make_pgrm_closure("bst", -1, "BST");
K[I][H.RCL_FF] = H.make_closure("get_index", [], "RCL f I");
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;
K[I][H.STO] = H.make_closure("set_index", [], "STO I");
K[I][H.STO_FF] = H.make_closure("set_index", [], "STO f I");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;
K[I][H.GTO] = H.make_pgrm_closure("gto", I, "GTO I");
K[I][H.GSB] = H.make_pgrm_closure("gosub", I, "GSB I");

I = 33;

K[I][H.FF] = H.make_closure("clear_prog", [0], "CLEAR PROG");
K[I][H.GG] = H.make_closure("r_up", [], "R^");
K[I][0] = H.make_closure("r_down", [], "Rv");

I = 34;

K[I][H.FF] = H.make_closure("clear_reg", [], "CLEAR REG");
K[I][H.GG] = H.make_closure("pse", [], "PSE");
K[I][0] = H.make_closure("x_exchange_y", [], "X<->Y");

I = 35;

K[I][H.FF] = H.make_closure("clear_prefix", [], "CLEAR PREFIX");
K[I][H.FF].no_pgrm = 1;
K[I][H.GG] = H.make_closure("clx", [], "CLx");
K[I][0] = H.make_closure("digit_delete", [], "BSP");
K[I][0].no_pgrm = 1;

I = 36;

K[I][H.GG] = H.make_closure("lstx", [1], "LSTx");
K[I][0] = H.make_closure("enter", [0], "ENTER");
M[I][H.FF] = H.WINDOW;

I = 1;

K[I][H.FF] = H.make_closure("sc_cpl1", [1], "INT CPL 1");
K[I][H.GG] = H.make_closure("test_x_le_y", [1], "X<=Y");

I = 2;

K[I][H.FF] = H.make_closure("sc_cpl2", [0], "INT CPL 2");
K[I][H.GG] = H.make_closure("test_x_less_0", [0], "X<0");

I = 3;

K[I][H.FF] = H.make_closure("sc_unsigned", [], "INT UNSIGNED");
K[I][H.GG] = H.make_closure("test_x_gt_y", [], "X>Y");

I = 30;

K[I][0] = H.make_closure("minus", [], "-");
K[I][H.FF] = H.make_closure("bit_not", [], "NOT");
K[I][H.GG] = H.make_closure("test_x_gt_0", [], "X>0");

I = 41;

K[I][0] = H.make_closure("toggle_decimal_and_altdisplay", [], "ON");
K[I][0].no_pgrm = 1;
K[I][H.RCL] = H.make_closure("shv", [], "SHV");
K[I][H.RCL].no_pgrm = 1;
K[I][H.STO] = H.make_closure("apocryphal", [1], "APOCRYPHAL 1");
K[I][H.STO].no_pgrm = 1;

I = 42;

M[I][0] = H.FF;
M[I][H.STO] = H.STO_FF;
M[I][H.RCL] = H.RCL_FF;

I = 43;

M[I][0] = H.GG;

I = 44;

K[I][H.GG] = H.make_closure("move_window_l", [], "WINDOW <");
K[I][H.FF] = H.make_closure("wsize", [], "WSIZE");
M[I][0] = H.STO;

I = 45;

K[I][H.GG] = H.make_closure("move_window_r", [], "WINDOW >");
M[I][H.FF] = H.FLOAT;
M[I][0] = H.RCL;

I = 0;

K[I][H.FF] = H.make_closure("mem_info", [], "MEM");
K[I][H.FF].no_pgrm = 1;
K[I][H.GG] = H.make_closure("test_x_ne_y", [], "X!=Y");

I = 48;

K[I][H.GG] = H.make_closure("test_x_ne0", [], "X!=0");
K[I][H.FF] = H.make_closure("status_16c", [0], "MEM STATUS");
K[I][H.FF].no_pgrm = 1;
K[I][0] = H.make_closure("decimal_point_mode", [], ".");
K[I][H.FLOAT] = H.make_closure("set_decimals_exponential", [], "FIX .");

M[I][H.STO] = H.STO2;
M[I][H.RCL] = H.RCL2;
M[I][H.GTO] = H.GTO_MOVE;

I = 49;

K[I][H.GG] = H.make_closure("test_x_eq_y", [], "X=Y");
K[I][H.FF] = H.make_closure("input_exponential", [], "EEX");
K[I][0] = H.make_closure("chs", [], "CHS");

I = 40;

K[I][0] = H.make_closure("plus", [], "+");
K[I][H.FF] = H.make_closure("bit_or", [], "OR");
K[I][H.GG] = H.make_closure("test_x_eq0", [], "X=0");

I = 50;

// This is just to satisfy STOP_INSTRUCTION in 11C
K[I][0] = H.make_closure("nop", [], "NOP");


Hp12c_dispatcher.prototype.handle_modifier = function (key, pgrm_mode)
{
	var modifier_table = this.modifier_sm[key];
	var f = this.find_function(key, 0, 1);

	if (modifier_table) {
		var next_modifier = modifier_table[H.machine.modifier];
		if (next_modifier) {
			// a modifier potentialized by a previous one
			H.machine.set_modifier(next_modifier);
			return true;
		} else if (modifier_table[0] && !f) {
			// a modifier of its own right, like f, g
			H.machine.set_modifier(modifier_table[0]);
			return true;
		}
	}

	return false;
};

Hp12c_dispatcher.prototype.find_function = function (key, pgrm_mode, query)
{
	var function_table = this.functions[key];
	var f = null;

	if (!function_table) {
		return null;
	}

	f = function_table[H.machine.modifier];

	if (f) {
		if (f.reducible) {
			// Handle cases like STO PLUS f I, STO f I
			// make opcode like STO I and STO PLUS I
			H.machine.set_modifier(f.reduced_modifier);
			f = function_table[H.machine.modifier];
		}
	}

	if (!f) {
		// no function given current modifier
		if (query === 1) {
			return null;
		}
	}

	if (!f) {
		// try plain key without any modifier
		f = function_table[0];
		if (f && query === 0) {
			H.machine.rst_modifier(1);
		}
	}

	if (pgrm_mode && f && f.no_pgrm) {
		// this function can not be programmed; revoked
		f = null;
	}

	return f;
};

Hp12c_dispatcher.prototype.dispatch = function (key)
{
	// this is used when a real key is pressed

	if (key == 99) {
		H.debug.show_memory();
		return;
	}

	if (H.machine.error_in_display) {
		H.machine.reset_error();
		return;
	} else if (H.machine.program_mode >= H.RUNNING) {
		H.pgrm.stop(1);
		return;
	}

	// Determine key function early, because we need that in USER logic
	var f_mod = this.find_function(key, 0, 1);
	var f = f_mod;
	var tmp = H.machine.modifier;

	if (!f) {
		H.machine.modifier = 0;
		f = this.find_function(key, 0, 1);
		H.machine.modifier = tmp;
	}

	// Programming mode?

	if (H.machine.program_mode == H.PROGRAMMING) {
		H.pgrm.type(key);
		return;
	}

	this.dispatch_common(key);
};

Hp12c_dispatcher.prototype.dispatch_common = function (key)
{
	var ok = 1;

	if (this.handle_modifier(key, 0)) {
		return ok;
	}

	// key is not modifier in this context, try a function

	var f = this.find_function(key, 0, 0);

	if (!f) {
		f = function () {
			// no-op
		};
		ok = false;
	}

	var rst_modifier = 1;

	if (f.dont_rst_modifier) {
		rst_modifier = 0;
	}

	f();

	if (rst_modifier) {
		H.machine.rst_modifier(1);
	}

	return ok;
};

// remove from scope
M = undefined;
K = undefined;
H.asm_reverse_map = null;
H.asm_ucode_reverse_map = null;

H.asm_make_reverse_map = function ()
{
	var map = {};
	var umap = {};
	H.asm_reverse_map = map;
	H.asm_ucode_reverse_map = umap;

	var K = Hp12c_dispatcher.prototype.functions;

	// pure modifier keys, with no K[key][0]
	umap.FF = 42;
	umap.GG = 43;
	umap.STO = 44;
	umap.RCL = 45;
	if (H.type === "16c") {
		umap.GSB = 21;
		umap.LBL = 22;
		umap.GTO = 22;
	} else if (H.type === "11c" || H.type === "15c") {
		umap.GTO = 22;
		umap.GSB = 32;
		umap.LBL = 21;
		umap.A = 11;
		umap.B = 12;
		umap.C = 13;
		umap.D = 14;
		umap.E = 15;
	} else { // 12c
		umap.GTO = 33;
	}

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (! closure.asm) {
						continue;
					}
					var imodifier = modifier;
					var ikey = key;
					if (closure.reducible) {
						if (imodifier >= 10000) {
							// 11C, 15C: this key sequence cannot
							// be translated to an opcode, since it
							// is reduced before goes to RAM
							continue;
						}
					}
					
					var is_addr = false;
					var mnemonic = closure.asm.toUpperCase();
					var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(imodifier, 10),
											parseInt(ikey, 10),
											is_addr);
					if (map[mnemonic]) {
						throw "Mnemonic already exists: " + mnemonic +
							" existing code " + map[mnemonic] + " " +
							" other code " + opcode;
					}
					map[mnemonic] = opcode;
					// iterating over K yields string keys
					umap[mnemonic] = parseInt(key, 10);
				}
			}
		}
	}

	console.log("Making asm done");
};

H.asm_condition = function (s)
{
	s = H.trim(s).toUpperCase();
	return s.replace(/\s{2,}/g, ' ');
};

H.asm_gto12 = function (s) 
{
	var regex_gto12 = new RegExp('^GTO [0-9]+$');

	if (! regex_gto12.test(s)) {
		return null;
	}

	var ip = 0 + s.substr(4);
	if (ip >= H.ram_MAX) {
		console.log("IP too high: " + s);
		return null;
	}

	return Hp12c_pgrm.p_encode_instruction(parseInt(4333, 10),
						parseInt(ip, 10),
						true);
};

H.asm = function (instr, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	var map = H.asm_reverse_map;

	var c12 = H.is_12c();

	instr = H.asm_condition(instr);
	var opcode = null;

	if (map[instr]) {
		opcode = map[instr];
	} else if (c12 && H.asm_gto12(instr)) {
		opcode = H.asm_gto12(instr);
	} else {
		if (! query) {
			throw "asm: Invalid instruction: " + instr;
		}
	}

	return opcode;
};

H.asm_microcode = function (ucodename, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	ucodename = H.asm_condition(ucodename);

	if (H.asm_ucode_reverse_map[ucodename] === undefined ||
			H.asm_ucode_reverse_map[ucodename] === null) {
		if (! query) {
			throw ">>>> Invalid microcode " + ucodename;
		}
		return null;
	}

	return H.asm_ucode_reverse_map[ucodename];
};

H.asm_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (H.asm(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_microcode_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (instr === null) {
			// skip
		} else if (H.asm_microcode(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_compile = function (progr, base_addr)
{
	progr = H.asm_expand(progr);

	for (var i = 0; i < progr.length; ++i) {
		H.machine.ram[base_addr + i + 1] = H.asm(progr[i]);
	}

	return progr.length;
};

H.asm_microcode_exec = function (microcode, monitor)
{
	for (var i = 0; i < microcode.length; ++i) {
		H.dispatcher.dispatch(microcode[i]);
		printf("Typed " + microcode[i] + " " + H.machine.x);
		if (monitor) {
			monitor(i);
		}
	}
};

/*
Assembly = whole instructions
Microcode = actual keystrokes
Example:
	"STO 0" is an assembly instruction
	It compiles to opcode "44.00"
	Microcode/keystrokes would be [44, 00].
Microcode is useful to simulate program typing, among
other things.
*/
H.asm_microcode_compile = function (microprogram)
{
	microprogram = H.asm_microcode_expand(microprogram);
	var microcode = [];

	for (var i = 0; i < microprogram.length; ++i) {
		microcode[i] = H.asm_microcode(microprogram[i]);
	}

	return microcode;
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.INTERPOLATION_MAX = 100;

H.solve_infinity = function (val)
{
	if (val > Math.pow(10, 95)) {
		val = Math.pow(10, 95);
	} else if (val < -Math.pow(10, 95)) {
		val = -Math.pow(10, 95);
	}
	return val;
};

H.npv = function (n, i, cfj, nj)
{
	var res = cfj[0];
	var pmt = 0;
	for (var e = 1; e <= n; ++e) {
		var cf = cfj[e];
		for (var f = 1; f <= nj[e]; ++f) {
			++pmt;
			res += cf / Math.pow(1 + (i / 100), pmt);
		}
	}
	return res;
};

H.npv_quality = function (n, cfj, nj)
{
	var sgn = 0;

	if (cfj[0] > 0) {
		sgn = 1;
	} else if (cfj[0] < 0) {
		sgn = -1;
	}
	
	for (var e = 1; e <= n; ++e) {
		if (nj[e] !== 0) {
			var newsgn = 0;
			if (cfj[e] > 0) {
				newsgn = 1;
			} else if (cfj[e] < 0) {
				newsgn = -1;
			}
			if (newsgn !== 0) {
				if (sgn !== 0) {
					if (newsgn !== sgn) {
						// signal inversion, exit with sucess
						return +1;
					}
				}
				sgn = newsgn;
			}
		}
	}

	// no signal inversions, or all-zeros
	return (sgn === 0) ? 0 : -1;
};

H.comppmtlim = function (i, n)
{
	if (Math.abs(i) < 0.0000000001) {
		return n;
	} else {
		return (1 - Math.pow(1 + (i / 100), -n)) / (i / 100);
	}
};

H.calcNPV = function (is_n, n, i, pv, pmt, fv, begin, compoundf)
{
	if (n == Math.floor(n) || is_n) {
		return pv + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, n) + 
			fv * Math.pow(1 + (i / 100), -n);
	} else if (! compoundf) {
		return pv * (1 + ((i / 100) * (n - Math.floor(n)))) + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
	} else {
		return pv * Math.pow(1 + (i / 100), (n - Math.floor(n))) + 
			(1 + (i / 100) * (begin ? 1 : 0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
	}
};

H.bond_previous_coupon = function (buy, maturity)
{
	// calculates last coupon paid just before buy

	var coupons = 0;
	var last_coupon = new Date(maturity);
	var next_coupon;

	while (last_coupon > buy) {
		next_coupon = new Date(last_coupon);
		++coupons;
		last_coupon.setDate(1);
		last_coupon.setMonth(last_coupon.getMonth() - 6);
		var month = last_coupon.getMonth();
		last_coupon.setDate(maturity.getDate());
	
		if (last_coupon.getMonth() != month) {
			// day > 28, overflowed into next month
			// Javascript trick: set to day 0 goes to last day of previous month
			// last_coupon.setDate(0);
			
			// We *could* do this calculation, but HP-12C returns Error 8 in this case,
			// so do we
			return null;
		}
	}

	return [last_coupon, next_coupon, coupons];
};

H.bond_price = function (desired_rate, coupon_year, buy, maturity)
{
	var price;
	var tot_interest;

	// * HP-12C only calculates semi-annual bonds i.e. bonds which pay coupons every 6 mo
	// * Value paid at maturity is always = 100

	// desire rate is pre-checked to be > -100

	var coupon_date = maturity;
	var tottime = H.date_diff(buy, maturity); 

	if (tottime <= 0) {
		return [H.ERROR_DATE, 0, 0];
	}

	var res = H.bond_previous_coupon(buy, maturity);

	if (res === null) {
		return [H.ERROR_DATE, 0, 0];
	}

	var E = H.date_diff(res[0], res[1]);
	var dsc = H.date_diff(buy, res[1]);	// time between settlement (buying) and next coupon
	var coupons = res[2];			// coupons that will be paid until maturity
	var dcs = E - dsc;			// time since last coupon, paid before we bought it.

	if (tottime <= E) {
		price = (100 * (100 + coupon_year / 2)) / (100 + ((tottime / E) * desired_rate / 2)); // present-value price
	} else {
		price = 100 / Math.pow(1 + desired_rate / 200, coupons - 1 + dsc / E); // present-value price
		for (var e = 1; e <= coupons; ++e) {
			// accumulate present value of all future coupons
			price += (coupon_year / 2) / Math.pow(1 + desired_rate / 200, e - 1 + dsc / E); 
		}
	}
	tot_interest = (coupon_year / 2) * dcs / E;
	price -= tot_interest; // coupon fraction compound before we bought it

	// should never happen, since previous checkings avoid NaN cases
	price = H.solve_infinity(price) || 0;
	tot_interest = H.solve_infinity(tot_interest) || 0;

	return [-1, price, tot_interest];
};

H.irr_npvsum = function (n, cfj)
{
	var res = Math.abs(cfj[0]);
	for (var e = 1; e <= n; ++e) {
		res += Math.abs(cfj[e]);
	}
	return res;
};

H.irr_calc = function (n, i, cfj, nj)
{
	var quality = H.npv_quality(n, cfj, nj);

	if (quality === 0) {
		// all-zeros
		return [-1, 0];
	} else if (quality < 0) {
		// all data have the same signal
		return [H.ERROR_IRR, i];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.0000000000125;
	var threshold_order = H.irr_npvsum(n, cfj);

	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (i <= -98 || i > 10000000000) {
		i = 0;
	}
	guessL = i - 1;
	guessH = i + 1;

	var success = false;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		NPVH = H.npv(n, guessH, cfj, nj);
		NPVL = H.npv(n, guessL, cfj, nj);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		var diff = guessH - guessL;
		if (guessL < 0) {
			guessL = Math.max(-99.99999999, guessL * 1.5); // counting with 100 iterations
		} else {
			guessL = Math.max(-99.99999999, guessL - 5 * diff); // counting with 100 iterations
		}
		guessH = Math.min(guessH + 5 * diff, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.npv(n, avg, cfj, nj);
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	return [H.ERROR_IRR2, i];
};

H.financecalc = function (dependent, begin, compoundf, finarray)
{
	var err = 0;
	if (dependent === 0) {
		// n
		var tpmt = finarray[H.FIN_PMT];
		var tpvi = -finarray[H.FIN_PV] * finarray[H.FIN_I] / 100;
		var tfvi = finarray[H.FIN_FV] * finarray[H.FIN_I] / 100;
		var tfv = finarray[H.FIN_FV];
		if (tpmt < 0) {
			tpmt = -tpmt;
			tpvi = -tpvi;
			tfvi = -tfvi;
			tfv = -tfv;
		}
		
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		// "if" is kludge to work around a problem with PMT = 0 and FV != 0
		if (tfv === 0) {
			err = err || (tpmt <= tpvi); // PMT <= -VP x i
			err = err || H.feq10(tpmt, tpvi); // PMT <= -VP x i
		}
		// I am in doubt in relation to signal
		// err = err || H.feq10(tpmt, tfvi); // PMT == VF x i
	} else if (dependent == 1) {
		var pmtn = finarray[H.FIN_PMT] * finarray[H.FIN_N];
		err = err || (finarray[H.FIN_N] < 0);
		err = err || (pmtn >= 0 && finarray[H.FIN_PV] >= 0 && finarray[H.FIN_FV] >= 0);
		err = err || (pmtn <= 0 && finarray[H.FIN_PV] <= 0 && finarray[H.FIN_FV] <= 0);
	} else if (dependent == 2) {
		// PV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	} else if (dependent == 3) { 
		// PMT
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		err = err || finarray[H.FIN_N] === 0; // n = 0
	} else if (dependent == 4) {
		// FV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	}

	if (err) {
		return H.ERROR_INTEREST;
	}

	var threshold = 0.00000000000125;
	var threshold_order = 0;

	// correct threshold so it is more "lax" when involved numbers are too big
	if (dependent != H.FIN_PV) {
		threshold_order += Math.abs(finarray[H.FIN_PV]);
	}
	if (dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_N && dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_N] * finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_FV) {
		threshold_order += Math.abs(finarray[H.FIN_FV]);
	}
	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (dependent === 1) {
		return H.financecalc_i(dependent, begin, compoundf, finarray, threshold, threshold_order);
	}

	var guess0, guess1, NPV0, NPV1;
	var saved = finarray[dependent];
	var iteration = H.INTERPOLATION_MAX;

	guess0 = null;

	if (dependent == H.FIN_N || dependent == H.FIN_I || threshold_order <= 0) {
		guess1 = 1;
	} else {
		// initial guess for interpolation must be of same order as other parameters
		guess1 = threshold_order;
	}

	var ret = H.ERROR_INTEREST;

	while (--iteration >= 0) {
		finarray[dependent] = guess1;

		NPV1 = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		if (Math.abs(NPV1) < threshold) {
			if (dependent === 0) {
				if ((guess1 - Math.floor(guess1)) > 0.003) {
					finarray[dependent] = Math.floor(finarray[dependent]) + 1;
				} else {
					finarray[dependent] = Math.floor(finarray[dependent]);
				}
			}
			saved = finarray[dependent];
			ret = -1;
			break;
		}

		var new_guess = guess1 + 1;

		if (guess0 !== null) {
			var B = (NPV1 - NPV0) / (guess1 - guess0); // B
			new_guess = NPV0 - guess0 * B; // A
			new_guess /= -B; // -A/B is the interpolation root
			new_guess = H.solve_infinity(new_guess);
		}

		guess0 = guess1;
		NPV0 = NPV1;
		guess1 = new_guess;
		NPV1 = null;
	}

	// puts back the original value in case of error,
	// since the calculated one may be NaN
	finarray[dependent] = saved;
	return ret;
};

// separate routine since linear interpolation does not work well for i
H.financecalc_i = function (dependent, begin, compoundf, finarray, threshold, threshold_order)
{
	var NPVA, NPVL, NPVH, guessL, guessH;
	var saved = finarray[dependent];

	var ret = H.ERROR_INTEREST;

	var success = false;

	guessL = -1;
	guessH = +1;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		finarray[dependent] = guessH;
		NPVH = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		finarray[dependent] = guessL;
		NPVL = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		// console.log("Interval NPV is " + NPVL + " " + NPVH);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-99.99999999, guessL - 1.1); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			finarray[dependent] = avg;
			NPVA = H.calcNPV(dependent === 0,
					finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
					finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);
	
			if (Math.abs(NPVA) < threshold) {
				return -1;
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	finarray[dependent] = saved;
	return ret;
};

H.bond_yield = function (coupon_year, buy, maturity, price)
{
	if (buy === null) {
		return [H.ERROR_DATE, 0];
	}

	if (maturity === null) {
		return [H.ERROR_DATE, 0];
	}

	if (price <= 0) {
		return [H.ERROR_INTEREST, 0];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.000000000125 * Math.abs(price);

	guessL = -1;
	guessH = +1;

	var success = false;
	var err = H.ERROR_INTEREST;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		NPVL = H.bond_price(guessL, coupon_year, buy, maturity);
		if (NPVL[0] >= 0) {
			err = NPVL[0];
			break;
		}
		NPVL = NPVL[1] - price;
		NPVH = H.bond_price(guessH, coupon_year, buy, maturity);
		/*
		Impossible, because all possible errors are related to date and
		are caught in NPVL calculation.

		if (NPVH[0] >= 0) {
			err = NPVH[0];
			break;
		}
		*/
		NPVH = NPVH[1] - price;

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-199.99999999, guessL * 1.5); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.bond_price(avg, coupon_year, buy, maturity);
			/*
			Impossible, because all possible errors would have been
			caught in previous loop, in NPVL calculation.

			if (NPVA[0] >= 0) {
				err = NPVA[0];
				break;
			}
			*/
			NPVA = NPVA[1] - price;
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}

	return [err, 0];
};

H.depreciation_sl = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// linear depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	while (--year >= 0) {
		depr = (cost - sell) / life;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_soyd = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var year_up = 0;
	var soyd = life * (life + 1) / 2;

	while (--year >= 0) {
		depr = (cost - sell) * (life - (++year_up) + 1) / soyd;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_db = function (cost, sell, life, year, db)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life || rest < 0) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var birthday = 0;

	while (--year >= 0) {
		if (++birthday < life) {
			depr = (rest + sell) * db / life;
		} else {
			depr = rest;
		}
		rest -= depr;

		if (rest < 0) {
			// may happen if db is big
			depr += rest;
			rest = 0;
		}
	}

	return [-1, depr, rest];
};

H.amortization = function (requested_n, orig_n, i, pv, pmt, decimals, begin)
{
	if (requested_n <= 0 || requested_n != Math.floor(requested_n) || i <= -1) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	var tot_interest = 0;
	var tot_amort = 0;

	for (var e = 1; e <= requested_n; ++e) {
		var interest = H.cl5_round(-pv * i, decimals);
		if (e == 1 && begin && orig_n <= 0) {
			// front payment has no interest
			interest = 0;
		}
		var capital_amortization = pmt - interest;
		tot_interest += interest;
		tot_amort += capital_amortization;
		pv += capital_amortization;
	}

	return [-1, tot_interest, tot_amort];
};

H.degrees_to_radians = function (angle)
{
	return angle * Math.PI / 180;
};

H.radians = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.degrees_to_radians(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= Math.PI / 200;
	}
	return angle;
};

H.radians_to_degrees = function (angle)
{
	return angle * 180 / Math.PI;
};

H.to_angle_mode = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.radians_to_degrees(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= 200 / Math.PI;
	}
	return angle;
};

H.hour_to_hms = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 60;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.00000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 60;
	return sgn * (whole_hour + minutes / 100 + seconds / 10000);
};

H.hms_to_hour = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 100;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.0000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 100;
	return sgn * (whole_hour + minutes / 60 + seconds / 3600);
};

// hyperbolic functions from http://phpjs.org/functions/

H.asinh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg + 1));
};

H.acosh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg - 1));
};

H.atanh = function (arg) {
	return 0.5 * Math.log((1 + arg) / (1 - arg));
};

H.sinh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

H.cosh = function (arg) {
	return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

H.tanh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
};

H.feq = function (a, b, epsilon) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		// console.log("feq: bad number");
		return false;
	}

	if (epsilon === undefined || epsilon === null) {
		epsilon = Math.pow(10, -10);
	}

	/*
	// convert numbers into intervals
	var A = a - epsilon;
	var B = a + epsilon;
	var X = b - epsilon;
	var Y = b + epsilon;

	// interval equality
	// return B >= X && A <= Y;
	// if numbers are negative, (A,B) (X,Y) will not be in order!
	return (A >= X && A <= Y) || (B >= X && B <= Y);
	*/

	// printf(" " + a + " " + b + " " + epsilon + " " + Math.abs(a - b) +
	// (Math.abs(a - b) < epsilon));

	return Math.abs(a - b) <= epsilon;
};

H.arithmetic_round = function (r, a, b)
{
	if (r === 0) {
		// nothing to round
		return r;
	} else if (a === 0 && b === 0) {
		// both zeros or no rounding desired (mult, div, power)
		return r;
	}

	var r_order = Math.floor(Math.log(Math.abs(r)) / Math.log(10));
	var order = r_order;

	// pick the magnitude of biggest number in operation
	if (a !== 0) {
		order = Math.floor(Math.log(Math.abs(a)) / Math.log(10));
	}
	if (b !== 0) {
		order = Math.max(order, Math.floor(Math.log(Math.abs(b)) / Math.log(10)));
	}

	var scale = Math.pow(10, order - 15);

	if (Math.abs(r) < scale) {
		r = 0;
	}

	return r;
};

H.feq10 = function (a, b) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	var epsilon = 0; // exact comparison

	if (a === 0 || b === 0) {
		// comparison with pure zero is special case
		epsilon = Math.pow(10, -100);
	} else {
		var order = Math.floor(Math.max(Math.log(Math.abs(b)) / Math.log(10),
				       Math.log(Math.abs(a)) / Math.log(10))) + 1;

		// OR just in case order is NaN (probably never)
		epsilon = Math.pow(10, order - 10) || Math.pow(10, -100);
	}

	return H.feq(a, b, epsilon);
};

H.feq_digits = function (a, b, precision_digits, epsilon, log)
{
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	if (! epsilon) {
		epsilon = 5;
	}

	precision_digits = Math.min(precision_digits, 10);

	var magnitude;

	// effectively moving the magnitude to zero
	while (a === 0 || b === 0) {
		a += 1;
		b += 1;
	}

	var magnitude_b = Math.log(Math.abs(b)) / Math.log(10);
	var magnitude_a = Math.log(Math.abs(a)) / Math.log(10);
	magnitude = Math.max(magnitude_a, magnitude_b);

	// Just in case magnitude is NaN
	magnitude = (Math.floor(magnitude) + 1) || 0;

	epsilon *= Math.pow(10, magnitude - precision_digits - 1);

	if (log) {
		console.log(" feq_digits " + a + " " + b + " " + (a - b) + " mag=" +
				magnitude + " d=" + precision_digits +
				" e=" + epsilon + " res " +
				H.feq(a, b, epsilon));
	}

	return H.feq(a, b, epsilon);
};

// comparision with 10^-10 tolerance when one of the values tend to zero
H.feq10_0 = function (a, b)
{
	var offset = 0;
	if ((a <= 1 && a >= -1) || (b <= 1 && b >= -1)) {
		offset = 2;
	}
	return H.feq10(offset + a, offset + b);
};

H.polar = function (x, y) {
	var angle = Math.atan2(y, x); // does not throw NaN
	var r = Math.sqrt(x * x + y * y);
	return [r, angle];
};

H.orthogonal = function (r, angle)
{
	return [r * H.cos(angle), r * H.sin(angle)];
};

H.fatorial = function (n)
{
	var res = 1;
	while (n > 1 && ! H.badnumber(res)) {
		res *= n;
		--n;
	}
	return res;
};

// from Wikipedia
H.gamma = function (z) {
	if (z < 0.5) {
		return Math.PI / (Math.sin(Math.PI * z) * H.gamma(1 - z));
	}
	z = z - 1;
	var x = H.gamma.p[0];
	for (var i = 1; i < (H.gamma.g + 2); ++i) {
		x += H.gamma.p[i] / (z + i);
	}
	var t = z + H.gamma.g + 0.5;
	return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
};

H.gamma.g = 7;
H.gamma.p = [0.99999999999980993, 676.5203681218851,
	-1259.1392167224028, 771.32342877765313, -176.61502916214059,
	12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
	1.5056327351493116e-7];

H.fatorial_gamma = function (n)
{
	if (n >= 0 && Math.floor(n) == n) {
		return H.fatorial(n);
	}
	return H.gamma(n + 1);
};

H.permutations = function (a, b)
{
	return H.fatorial(a) / H.fatorial(a - b);
};

H.combinations = function (a, b)
{
	return H.permutations(a, b) / H.fatorial(b);
};

H.stddev = function (mem)
{
	if (mem[H.STAT_N] <= 1 || 
	    (mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) < 0 ||
	    (mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) < 0) {
		return [0];
	}
	var x = Math.pow((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	var y = Math.pow((mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	return [1, x, y];
};

H.linear_regression = function (mem)
{
	if (mem[H.STAT_N] <= 1) {
		// console.log("LR err type 1");
		return [0];
	}

	var div = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];
	if (H.feq10_0(div, 0)) {
		// console.log("LR err type 2");
		return [0];
	}

	// TODO implement test [ n Ex2 - (Ex)2] [ n Ey2 - (Ey)2] <= 0

	var avgx = mem[H.STAT_X] / mem[H.STAT_N];
	var avgy = mem[H.STAT_Y] / mem[H.STAT_N];

	var B = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	B /= div;
	B = H.solve_infinity(B) || 0;

	var A = avgy - B * avgx;

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	return [1, A, B];
};

H.stat_kr = function (mem, is_x, xx)
{
	var res = H.linear_regression(mem);

	if (! res[0]) {
		// console.log("statkr error 1");
		return [0];
	}

	var A = res[1];
	var B = res[2];

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	// an equivalent test is already made at linear_regression()
	/*
	if (H.feq((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]), 0)) {
		console.log("statkr error 2");
		return [0];
	}
	*/

	var rr3 = mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y] / mem[H.STAT_N];

	if (H.feq10_0(rr3, 0)) {
		// console.log("statkr error 3");
		return [0];
	}

	var rr1 = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	var rr2 = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];

	/*
	// already checked in "statkr error 2" and "statkr error 3"
	if (rr2 === 0 || rr3 === 0) {
		console.log("statkr error 5");
		return [0];
	}
	*/

	if ((rr2 * rr3) < 0) {
		// console.log("statkr error 6");
		return [0];
	}

	var rr = Math.sqrt(rr2 * rr3);

	var r = rr1 / rr;

	var c;

	if (is_x) {
		if (H.feq10_0(B, 0)) {
			// console.log("statkr error 7");
			return [0];
		}
		c = (xx - A) / B;
	} else {
		c = A + B * xx;
	}

	c = H.solve_infinity(c) || 0;
	r = H.solve_infinity(r) || 0;

	return [1, c, r];
};

H.stat_accumulate = function (sgn, mem, x, y)
{
	mem[H.STAT_N] += sgn;
	mem[H.STAT_X] += sgn * x;
	mem[H.STAT_X2] += sgn * x * x;
	mem[H.STAT_Y] += sgn * y;
	mem[H.STAT_Y2] += sgn * y * y;
	mem[H.STAT_XY] += sgn * x * y;
};

H.stat_avg = function (mem)
{
	if (mem[H.STAT_N] === 0) {
		return [0];
	}
	var x = mem[H.STAT_X] / mem[H.STAT_N];
	var y = mem[H.STAT_Y] / mem[H.STAT_N];
	return [1, x, y];
};

H.stat_avgw = function (mem)
{
	if (mem[H.STAT_X] === 0) {
		return [0];
	}
	return [1, mem[H.STAT_XY] / mem[H.STAT_X]];
};

// MODIFIED VERSION OF: https://github.com/cslarsen/mersenne-twister

/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.

  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:

  var m = new MersenneTwister(123);

  and that will always produce the same random sequence.

  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

/*jslint bitwise: false */

H.Prng = function (seed)
{
	var self = {};

	seed = seed || 0;

	// convert to 0 <= x < 1 range
	seed = Math.abs(seed);
	while (seed >= 1) {
		seed /= 10;
	}

	// save for further RCL
	self.seed = seed;

	// condition to needs of this particular prng: 32-bit integer, non-zero
	if (seed === 0) {
		seed = 1;
	}
	while (seed < 0x40000000) {
		seed *= 1.9123456789;
	}

	/* Period parameters */  
	self.N = 624;
	self.M = 397;
	self.MMA = 0x9908b0df;   /* constant vector a */
	self.UMA = 0x80000000; /* most significant w-r bits */
	self.LMA = 0x7fffffff; /* least significant r bits */
 
	self.mt = [];          /* the array for the state vector */
	self.mti = self.N + 1; /* mti==N+1 means mt[N] is not initialized */

	self.getSeed = function ()
	{
		return self.seed;
	};
 
	/* initializes mt[N] with a seed */
	self.private_init = function (seed)
	{
		self.mt[0] = seed >>> 0;
		for (self.mti = 1; self.mti < self.N; self.mti++) {
			var s = self.mt[self.mti - 1] ^ (self.mt[self.mti - 1] >>> 30);
			self.mt[self.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + 
				(s & 0x0000ffff) * 1812433253) + self.mti;
			/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
			/* In the previous versions, MSBs of the seed affect   */
			/* only MSBs of the array mt[].                        */
			/* 2002/01/09 modified by Makoto Matsumoto             */
			self.mt[self.mti] >>>= 0;
			/* for >32 bit machines */
		}
	};
 
	/* generates a random number on [0,0xffffffff]-interval */
	self.gen32 = function ()
	{
		var y;
		var mag01 = [0x0, self.MMA];
		/* mag01[x] = x * MMA  for x=0,1 */
	
		if (self.mti >= self.N) { /* generate N words at one time */
			var kk;
	
			for (kk = 0; kk < self.N - self.M; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + self.M] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			for (; kk < self.N - 1; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + (self.M - self.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			y = (self.mt[self.N - 1] & self.UMA) | (self.mt[0] & self.LMA);
			self.mt[self.N - 1] = self.mt[self.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
	
			self.mti = 0;
		}
	
		y = self.mt[self.mti++];
	
		/* Tempering */
		y ^= (y >>> 11);
		y ^= (y << 7) & 0x9d2c5680;
		y ^= (y << 15) & 0xefc60000;
		y ^= (y >>> 18);
	
		return y >>> 0;
	};
 	
	/* generates a random number on [0,1) with 53-bit resolution*/
	self.random = function ()
	{ 
		var a = self.gen32() >>> 5;
		var b = self.gen32() >>> 6; 
		return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0); 
	};

	self.private_init(seed);

	return self;
};

H.sin = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.sin(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.cos = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.cos(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.tan = function (r)
{
	r = r % Math.PI;
	var res = H.sin(r) / H.cos(r);
	if (res > H.value_max) {
		res = H.value_max;
	} else if (res < -H.value_max) {
		res = -H.value_max;
	}
	return res;
};
/* HP-12C emulator 
				ionsole.log("----------------------------");
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

/*jslint bitwise: false */

H.word_bit = function (t, n)
{
	var res = 0;
	if (n >= 32) {
		res = (t.h >>> (n - 32)) & 0x01; // 63..32 -> 31..0
	} else {
		res = (t.r >>> n) & 0x01; // 31..0
	}
	return res;
};

H.word_Set_bit = function (t, n, v) {
	if (n >= 32) {
		if (v) {
			t.h = t.h | (1 << (n - 32)); // 32..63 -> 0..31
		} else {
			t.h = t.h & (~(1 << (n - 32)));
		}
	} else {
		if (v) {
			t.r = t.r | (1 << n); // 0..31
		} else {
			t.r = t.r & (~(1 << n));
		}
	}
};

H.cast_wordsize = function (t, ws) {
	var maskl = 0;
	var maskh = 0;
	if (ws > 32) {
		maskl = 0xffffffff;
		maskh = 0xffffffff >>> (64 - ws); // 64..33 -> 0..31
	} else {
		maskl = 0xffffffff >>> (32 - ws); // 32..1 -> 0..31 (no 0-word size)
	}
	t.r = t.r & maskl;
	t.h = t.h & maskh;
};

H.spagint_to_digit = function (x, bit, radix, bits)
{
	var mult = 1;
	var n = 0;
	while (bits > 0 && bit < x.length) {
		if (x[bit]) {
			n += mult;
		}
		++bit;
		--bits;
		mult *= 2;
	}
	return n.toString(radix);
};

// multiplies a decimal number (as a string) by 2
// integer may be of any size
H.sdecimal_mult2 = function (sd)
{
	var carry = 0;
	var res = "";

	for (var i = sd.length - 1; i >= 0; --i) {
		var n = parseInt(sd.charAt(i), 10);
		n = n * 2 + carry;
		carry = Math.floor(n / 10);
		res = (n % 10).toString(10) + res;
	}

	if (carry) {
		res = carry.toString(10) + res;
	}

	return res;
};

H.binary_to_decimal = function (b)
{
	var dec = "0";

	for (var i = 0; i < b.length; ++i) {
		// make room to odd/even bit
		dec = H.sdecimal_mult2(dec);
		if (b.charAt(i) !== "0") {
			var dd = parseInt(dec.charAt(dec.length - 1), 10);
			dd += 1;
			dec = dec.substring(0, dec.length - 1) + dd.toString(10);
		}
	}

	return dec;
};

H.integer_to_string = function (x, cpl, ws, radix, omit_prefix)
{
	var number = "";
	var nsign = "";
	var nprefix = "";
	var bits = 4;

	radix = radix || 10;

	H.cast_wordsize(x, ws);
	var s = H.make_spaghetti([x.h, x.r], ws, false);
	if (H.spagint_sgn(s, cpl) < 0) {
		nsign = "-";
		// does not matter if overflows for cpl = 2 and MIN_INT
		// because we interpret "s" as unsigned from this point
		// on, and ((unsigned) MIN_INT) == MAX_INT + 1
		H.spagint_inv(s, cpl);
	}

	if (radix === 2) {
		nprefix += "0b";
		bits = 1;
	} else if (radix === 8) {
		nprefix += "0";
		bits = 3;
	} else if (radix === 16) {
		nprefix += "0x";
		bits = 4;
	}

	var pradix = radix;

	if (radix === 10) {
		// convert to binary first
		pradix = 2;
		bits = 1;
	}
		
	var znumber = "";

	// fast, easy algorithm for 2^n radix
	for (var bit = 0; bit < ws; bit += bits) {
		var digit = H.spagint_to_digit(s, bit, pradix, bits);
		znumber = digit + znumber;
		if (digit !== '0') {
			// significant digit; move buffered digits
			number = znumber + number;
			znumber = "";
		}
	}

	if (radix === 10) {
		number = H.binary_to_decimal(number);
	}

	if (number.length <= 0) {
		number = "0";
	}

	if (omit_prefix) {
		nprefix = "";
	}

	return nsign + nprefix + number;
};

H.parse_digit = function (s, radix)
{
	var n = parseInt(s, radix);
	if (! n) {
		n = 0;
	}
	return n;
};

H.string_to_integer = function (s, cpl, ws, radix)
{
	// convert string s to spagint bits
	var sgn = 1;
	var spagint = H.spagint_make_zero(ws);
	var position = H.spagint_make_one(ws);

	s = "" + s;
	s = H.trim(s);
	s.toLowerCase();
	if (s.charAt(0) === '-') {
		if (cpl > 0) {
			sgn = -1;
		}
		s = s.substring(1);
	}

	if (! radix) {
		radix = 10;
		if (s.charAt(0) === '0') {
			// not decimal
			s = s.substring(1);
			if (s.charAt(0) === 'x') {
				radix = 16;
				s = s.substring(1);
			} else if (s.charAt(0) === 'b') {
				radix = 2;
				s = s.substring(1);
			} else {
				radix = 8;
			}
		}
	}
	var sradix = H.make_spaghetti([radix], ws, false);

	while (s.length > 0) {
		var digit = H.parse_digit(s.charAt(s.length - 1), radix);
		// digit *= position
		// i += digit (positioned)
		var sdigit = H.spagint_make_zero(ws);
		H.spagint_multiply(H.make_spaghetti([digit], ws, false), position, sdigit);
		H.spagint_u_s_sum(spagint, sdigit);
		// position *= radix
		var oldpos = H.spagint_copy(position);
		position = H.spagint_make_zero(ws);
		H.spagint_multiply(sradix, oldpos, position);
		s = s.substring(0, s.length - 1);
	}

	if (sgn < 1) {
		H.spagint_inv(spagint, cpl);
	}

	// convert from 'spagint' format to 2x32 register format
	var t = H.undo_spaghetti(spagint, ws, false);
	H.cast_wordsize(t, ws);

	return t;
};

H.make_spaghetti = function (a, ws, dbl)
{
	var s = [];
	var word, bit;

	for (word = 0; word < (dbl ? 2 : 1); ++word) {
		var idx = a.length - word * 2 - 1;
		var wh = 0;
		var wl = 0;
		if (idx >= 0) {
			wl = a[idx];
			if (idx >= 1) {
				wh = a[idx - 1];
			}
		}
		for (bit = 0; bit < ws; ++bit) {
			var bitval = 0;
			var mask = 0x01;
			mask = mask << (bit % 32); // 0..31
			if (bit >= 32) {
				bitval = (wh & mask) ? 1 : 0;
			} else {
				bitval = (wl & mask) ? 1 : 0;
			}
			s.push(bitval);
		}
	}
	return s;
};

H.undo_spaghetti = function (s, ws, dbl)
{
	var bitlimit = dbl ? (ws * 2) : ws;
	var ta = [{r: 0, h: 0, i: 0}, {r: 0, h: 0, i: 0}];

	for (var bit = 0; bit < bitlimit; ++bit) {
		var word = Math.floor(bit / ws);
		var wbit = bit % ws;
		if (s[bit]) {
			var mask = 1 << (wbit % 32); // 0..31
			if (wbit >= 32) {
				ta[word].h |= mask;
			} else {
				ta[word].r |= mask;
			}
		}
	}

	if (!dbl) {
		ta = ta[0];
	}

	return ta;
};

/*jslint bitwise: true */

H.spagint_shr = function (s)
{
	for (var i = 0; i < (s.length - 1); ++i) {
		s[i] = s[i + 1];
	}
	s[s.length - 1] = 0;
};

H.spagint_shl = function (s)
{
	for (var i = s.length - 1; i > 0; --i) {
		s[i] = s[i - 1];
	}
	s[0] = 0;
};

H.spagint_highbit = function (s)
{
	for (var i = s.length - 1; i >= 0; --i) {
		if (s[i]) {
			return i;
		}
	}

	return -1;
};

H.spagint_is_zero = function (s, cpl)
{
	if (H.spagint_highbit(s) < 0) {
		// 0x0000...0000 is always zero
		return true;
	} else if (cpl == 1) {
		// 0xffff...ffff is minus zero
		for (var i = 0; i < s.length; ++i) {
			if (! s[i]) {
				return false;
			}
		}
		return true;
	}

	return false;
};

H.spagint_sgn = function (s, cpl)
{
	if (cpl == 2 || cpl == 1) {
		if (s[s.length - 1]) {
			return -1;
		}
	}

	return 1;
};

H.spagint_copy = function (s, ws)
{
	if (!ws) {
		ws = s.length;
	}

	var t = [];
	for (var i = 0; i < ws; ++i) {
		var b = 0;
		if (i < s.length) {
			b = s[i];
		}
		t[i] = b;
	}
	return t;
};

// Add 1 bit size and extend signal if signed
H.spagint_extend = function (s, cpl)
{
	var t = H.spagint_copy(s, s.length + 1);
	if (cpl > 0) {
		t[t.length - 1] = s[s.length - 1];
	}
	return t;
};

H.spagint_u_s_sum = function (tgt, v)
{
	var i, carry, unsigned_overflow, last_carry, signed_overflow;

	carry = 0;
	last_carry = 0;

	for (i = 0; i < tgt.length && (carry || i < v.length); ++i) {
		var new_bit = (tgt[i] ? 1 : 0) + (carry ? 1 : 0) + (v[i] ? 1 : 0);
		last_carry = carry;
		carry = (new_bit > 1) ? 1 : 0;
		tgt[i] = new_bit % 2;
	}

	unsigned_overflow = !!carry;
	// signed oveflow hint from http://planetcalc.com/747/
	signed_overflow = (carry !== last_carry);

	return {result: tgt,
		carry: unsigned_overflow,
		unsigned_overflow: unsigned_overflow,
		signed_overflow: signed_overflow};
};

H.spagint_cpl1_to_cpl2 = function (s)
{
	if (s[s.length - 1]) {
		// no problem if overflow since 0xffff is zero in cpl1
		H.spagint_u_s_sum(s, H.spagint_make_one(s.length));
	}
	return s;
};

H.spagint_cpl2_to_cpl1 = function (s)
{
	var overflow = false;
	if (s[s.length - 1]) {
		H.spagint_u_s_sum(s, H.spagint_make_minus_one(2, s.length));
		overflow = ! s[s.length - 1];
	}
	return {result: s, overflow: overflow};
};

H.spagint_eq = function (s, t)
{
	for (var i = (Math.max(s.length, t.length) - 1); i >= 0; --i) {
		var sb = (i < s.length) ? s[i] : 0;
		var tb = (i < t.length) ? t[i] : 0;
		if (sb < tb) {
			// s < t
			return false;
		} else if (sb > tb) {
			// s > t
			return false;
		}
	}
	// equal
	return true;
};

H.spagint_ge = function (s, t)
{
	for (var i = (Math.max(s.length, t.length) - 1); i >= 0; --i) {
		var sb = (i < s.length) ? s[i] : 0;
		var tb = (i < t.length) ? t[i] : 0;
		if (sb < tb) {
			// s < t
			return false;
		} else if (sb > tb) {
			// s > t
			return true;
		}
	}
	// equal
	return true;
};

H.spagint_abs = function (t, cpl)
{
	var overflow = false;

	if (cpl <= 0 || H.spagint_sgn(t, cpl) > 0) {
		// positive
		return {result: t, overflow: overflow};
	}

	// if control gets here, value is signed AND negative

	if (cpl !== 1) {
		// downgrade to one's complement
		H.spagint_u_s_sum(t, H.spagint_make_minus_one(2, t.length));
		// if turned to positive, MIN_INT overflowed
		overflow = ! t[t.length - 1];
	}

	// one's complement: get positive just inverting all bits
	for (var i = 0; i < t.length; ++i) {
		t[i] = t[i] ? 0 : 1;
	}

	return {result: t, overflow: overflow};
};

H.spagint_inv = function (t, cpl)
{
	if (H.spagint_is_zero(t)) {
		// short circuit to avoid problems w/ overflow detection
		return {result: t, overflow: false};
	}

	var overflow = false;

	if (cpl <= 0) {
		// console.log("cannot invert int unsigned");
		return {result: t, overflow: overflow};
	}

	// control reaches here if number is signed

	// conversion into one's complement
	for (var i = 0; i < t.length; ++i) {
		t[i] = t[i] ? 0 : 1;
	}

	if (cpl !== 1) {
		// promote to two's complement
		var sign = t[t.length - 1];
		H.spagint_u_s_sum(t, H.spagint_make_one(t.length));
		// if number is MIN_INT, conversion overflows and 
		// result becomes MIN_INT again (which is equal to
		// MAX_INT + 1 if bit string is taken as unsigned.
		// NOTE: this is a convention that this function MUST
		// keep!
		overflow = (sign !== t[t.length - 1]);
	}

	return {result: t, overflow: overflow};
};

H.spagint_neg = function (s, cpl)
{
	if (H.spagint_sgn(s, cpl) < 0) {
		// already negative, return "as is"
		return s;
	}

	// cannot overflow since s is positive
	H.spagint_inv(s, cpl);
	return s;
};

// make sure that word-size MSB contains the same
// sign as the empirical MSB in "s"
H.spagint_cast_sign = function (s, cpl, ws, dbl)
{
	if (cpl > 0) {
		var msb = s.length - 1;
		var ws_msb = ws * (dbl ? 2 : 1) - 1;
		s[ws_msb] = s[msb];
	}
};

// division core. only positive numbers and all having the same length
H.spagint_divide = function (a, b, c)
{
	// Caller must provide c.length >= a and >= b
	// add one bit for signed substraction in algorithm
	// c can stay the same length because c <= a and
	// a is always unsigned.
	a = H.spagint_copy(a, c.length + 1);
	b = H.spagint_copy(b, c.length + 1);

	var bn = H.spagint_copy(b);
	// cannot overflow because we made room just before
	H.spagint_inv(bn, 2);
	var one = H.spagint_make_one(a.length);

	while (H.spagint_ge(a, b) && ! H.spagint_is_zero(a) && ! H.spagint_is_zero(b)) {
		/*
		if (dbl) {
			Sleep(1000);
		}
		*/
		var order = H.spagint_highbit(a) - H.spagint_highbit(b) - 1;
		// Examples:
		// a = 100, b = 11, 2*b = 110 > a (cannot use shortcut)
		// a = 1000, b = 11, 2*b = 110 < a (may use shortcut)
		// a = 10000, b = 11, 4*b = 1100 < a (may use shortcut)
		// a = 1000000, b = 11, 16*b = 110000 < a (may use shortcut)

		// console.log("a " + a);
		// console.log("b " + b);
		// console.log("c " + c);
		if (order <= 0) {
			// naive algorithm; c++ and a -= b while a >= b
			H.spagint_u_s_sum(c, one);
			H.spagint_u_s_sum(a, bn);
		} else {
			// a > 2b
			// c += 2^order; a -= b * 2^order
			var power_2 = H.spagint_make_power2(a.length, order);
			var bto = H.spagint_make_zero(a.length);
			H.spagint_multiply(b, power_2, bto);
			// cannot overflow because bto > 0
			H.spagint_inv(bto, 2);
			H.spagint_u_s_sum(c, power_2);
			H.spagint_u_s_sum(a, bto);
		}
		// console.log("a' " + a);
		// console.log("b' " + b);
		// console.log("c' " + c);
	}

	return H.spagint_copy(a, c.length);
};

H.integer_divide = function (a, b, cpl, ws, dbl)
{
	a = H.make_spaghetti(a, ws, dbl);
	b = H.make_spaghetti(b, ws, false);

	if (H.spagint_is_zero(b, cpl)) {
		// avoid the case of a=0, positive or negative
		return {result: [H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			         H.undo_spaghetti(H.spagint_make_zero(ws), ws, false)],
			carry: false, overflow: true};
	}

	var overflow = false;

	// console.log("divide ----------------------------");
	// console.log(" aj " + a);
	// console.log(" bj " + b);

	var sgn = H.spagint_sgn(a, cpl) * H.spagint_sgn(b, cpl);
	var sgna = H.spagint_sgn(a, cpl);

	// add 1 bit space to handle case a|b == MIN_INT
	a = H.spagint_extend(a, cpl);
	b = H.spagint_extend(b, cpl);
	// so these can't overflow
	H.spagint_abs(a, cpl);
	H.spagint_abs(b, cpl);
	b = H.spagint_copy(b, a.length);

	var c = H.spagint_make_zero(a.length);

	a = H.spagint_divide(a, b, c);

	// this test handles both possible overflow cases:
	// a) double mode, quotient does not fit in 1 word
	// b) normal mode, 2's complement, MIN_INT / -1 = MAX_INT + 1
	var magnitude = H.spagint_highbit(c);
	if (cpl <= 0) {
		overflow = magnitude >= ws;
	} else if (cpl == 1) {
		overflow = magnitude >= (ws - 1);
	} else {
		overflow = (magnitude >= (ws - 1) &&
				(sgn >= 0 ||
				 ! H.spagint_is_MININT_2(c, ws)));
	}

	// console.log("divide ----------------------------");
	// console.log("ai " + a);
	// console.log("bi " + b);
	// console.log("ci " + c);

	if (sgn < 0) {
		H.spagint_neg(c, cpl);
	}
	if (sgna < 0) {
		// dividend became the remainder
		// remainder inherits the signal from dividend
		// remainder cannot overflow because it is always smaller than divisor
		H.spagint_neg(a, cpl);
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	var t = H.undo_spaghetti(c, ws, false);
	var has_remainder = ! H.spagint_is_zero(a, 0);
	var trmd = H.undo_spaghetti(a, ws, false);
	var res = [t, trmd];

	return {result: res, overflow: overflow, carry: has_remainder};
};

H.spagint_make_zero = function (ws)
{
	var t = [];
	for (var i = 0; i < ws; ++i) {
		t[i] = 0;
	}
	return t;
};

H.spagint_make_one = function (ws)
{
	var t = H.spagint_make_zero(ws);
	t[0] = 1;
	return t;
};

H.spagint_make_power2 = function (ws, exponent)
{
	var t = H.spagint_make_zero(ws);
	t[exponent] = 1;
	return t;
};

H.spagint_make_minus_one = function (cpl, ws)
{
	var t = H.spagint_make_one(ws);
	// cannot overflow because ws > 1
	H.spagint_inv(t, cpl);
	return t;
};

H.spagint_make_MIN_INT_2 = function (ws)
{	
	var t = H.spagint_make_zero(ws);
	t[t.length - 1] = 1;
	return t;
};

/*
H.spagint_make_MAX_INT_2 = function (ws)
{	
	var t = H.spagint_make_minus_one(2, ws);
	t[t.length - 1] = 0;
	return t;
};
*/

H.spagint_is_MININT_2 = function (n, ws)
{
	// test if (unsigned) n == (unsigned) (MIN_INT for given ws)
	var min_int = H.spagint_make_MIN_INT_2(ws); // 128 in 8 bits unsigned
	return H.spagint_eq(n, min_int);
};

// core of multiplication (handles positive numbers only)
H.spagint_multiply = function (a, b, c)
{
	a = H.spagint_copy(a, c.length);
	b = H.spagint_copy(b, c.length);

	while (! H.spagint_is_zero(a, 0)) {
		// console.log("a  " + a);
		// console.log("b  " + b);
		// console.log("c  " + c);
		if (! a[0]) {
			// even a; try make it odd (a/2)*(b*2)
			H.spagint_shr(a);
			H.spagint_shl(b);
		} else {
			// odd a; c += b, a -= 1
			var res = H.spagint_u_s_sum(c, b);
			a[0] = 0;
		}
		// console.log("c' " + c);
	}

	// console.log("cf " + c);
	return c;
};

H.integer_multiply = function (a, b, cpl, ws, dbl)
{
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	// console.log("a' " + a);
	// console.log("b' " + b);
	var c = H.spagint_make_zero(ws * 2);
	var sgn = H.spagint_sgn(a, cpl) * H.spagint_sgn(b, cpl);
	var overflow = false;

	// add 1 bit space
	a = H.spagint_extend(a, cpl);
	b = H.spagint_extend(b, cpl);
	// so these can't overflow if a, b == MIN_INT
	H.spagint_abs(a, cpl);
	H.spagint_abs(b, cpl);

	// console.log("ultiply ----------------------------");
	var res = H.spagint_multiply(a, b, c);
	// console.log("multiply ----- " + c);

	if (!dbl) {
		var magnitude = H.spagint_highbit(c);
		if (cpl <= 0) {
			overflow = magnitude >= ws;
		} else if (cpl == 1) {
			overflow = magnitude >= (ws - 1);
		} else {
			// e.g. for 8 bits signed, if magnitude is 8 > 7,
			// it is overflow only if result is positive, or
			// result is exactly MIN_INT (-MIN_INT at this point)
			overflow = (magnitude >= (ws - 1) &&
					(sgn >= 0 ||
					 ! H.spagint_is_MININT_2(c, ws)));
		}
	}

	if (sgn < 0) {
		H.spagint_neg(c, cpl);
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, dbl);
	}

	var t = H.undo_spaghetti(c, ws, dbl);

	// multiplication resets carry
	return {result: t, overflow: overflow, carry: false};
};

H.integer_plus = function (a, b, cpl, ws)
{
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	var c = H.spagint_make_zero(ws);
	var overflow = false;

	// console.log("plus a " + a);
	// console.log("plus b " + b);

	if (cpl === 1) {
		a = H.spagint_cpl1_to_cpl2(a, ws);
		b = H.spagint_cpl1_to_cpl2(b, ws);
	}

	H.spagint_u_s_sum(c, a);
	var res = H.spagint_u_s_sum(c, b);

	if (cpl <= 0) {
		overflow = res.unsigned_overflow;
	} else {
		overflow = res.signed_overflow;
	}

	// console.log("plus a' " + a);
	// console.log("plus b' " + b);
	// console.log("plus c " + c);

	if (cpl === 1) {
		if (H.spagint_cpl2_to_cpl1(c).overflow) {
			overflow = true;
		}
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	// console.log("plus c' " + c);

	var t = H.undo_spaghetti(c, ws, false);

	// console.log("plus r " + t.r + " " + t.h);

	return {result: t, overflow: overflow, carry: res.carry};
};

H.integer_minus = function (a, b, cpl, ws)
{
	var iws = ws;
	if (cpl <= 0) {
		// make room for signal bit since we implement
		// subraction using signed summation of a+(-b)
		iws += 1;
	}
	a = H.make_spaghetti(a, iws, false);
	b = H.make_spaghetti(b, iws, false);
	var c = H.spagint_make_zero(iws);
	var overflow = false;
	var borrow = false;

	// console.log("minus a " + a);
	// console.log("minus b " + b);

	if (cpl === 1) {
		a = H.spagint_cpl1_to_cpl2(a, iws);
		b = H.spagint_cpl1_to_cpl2(b, iws);
	}

	// If (unsigned) b > (unsigned) a, there is borrow.
	// Or, there *would be* borrow in HP-16C, which does not
	// use a+(-b) technique.
	borrow = ! H.spagint_ge(a, b);

	// console.log("minus a " + a);
	// console.log("minus b " + b);

	if (H.spagint_inv(b, 2).overflow) {
		// b == MIN_INT and cpl == 2
		// x - MIN_INT always overflows because the result
		// becomes x + MAX_INT + 1
		overflow = true;
		// proceed with operation since HP-16C shows the
		// corpse of the calculation (lowest bits).
	}

	// console.log("minus B " + b);

	// c = a + (-b)
	H.spagint_u_s_sum(c, a);
	var res = H.spagint_u_s_sum(c, b);

	overflow = overflow || res.signed_overflow;
	if (cpl <= 0) {
		if (H.spagint_sgn(c, 2) < 0) {
			// result < 0 in unsigned mode, underflow
			overflow = true;
		}
	}

	// console.log("minus c " + c);

	if (cpl === 1) {
		if (H.spagint_cpl2_to_cpl1(c).overflow) {
			overflow = true;
		}
	}

	if (overflow) {
		H.spagint_cast_sign(c, cpl, ws, false);
	}

	// console.log("minus C " + c);

	// cast from iws to ws does not cause problems because
	// a) ws = iws in signed mode
	// b) value is meaningless if negative (high bit 1)
	//    in unsigned mode, and high bit = 0 if positive.
	var t = H.undo_spaghetti(c, ws, false);

	// console.log("tuple " + t.r + " " + t.h);

	return {result: t, overflow: overflow, carry: borrow};
};

// assumes "a" is positive
// algorithm from "Hacker's Delight", p.205
H.integer_sqrt = function (a, cpl, ws)
{
	a = H.make_spaghetti(a, ws, false);

	var iws = ws;

	if (H.spagint_sgn(a, cpl) < 0) {
		// avoid the case of a<0
		return {result: H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			carry: false, overflow: true};
	}

	if (H.spagint_is_zero(a, cpl)) {
		// avoid the case of a=0
		return {result: H.undo_spaghetti(H.spagint_make_zero(ws), ws, false),
			carry: false, overflow: false};
	}

	if (iws < 4) {
		iws = 4;
		a = H.spagint_copy(a, 4);
	}

	// get the number of significant bits in a
	var order = H.spagint_highbit(a);
	// first estimate is a bit above [a >> (bits / 2)]
	var two = H.spagint_make_power2(a.length, 1);
	var g0 = H.spagint_make_power2(a.length, 1 + Math.floor(order / 2));
	var g1 = H.spagint_make_zero(a.length);
	H.spagint_divide(a, g0, g1); // g1 = a / g0
	H.spagint_u_s_sum(g1, g0);   // g1 = g0 + a / g0
	H.spagint_shr(g1);           // g1 = (g0 + a / g0) / 2

	// console.log("sqrt ---------");
	// console.log("g0'  " + g0);
	// console.log("g1'  " + g1);

	while (! H.spagint_ge(g1, g0)) { // while g1 < g0
		// console.log("base " + a);
		g0 = g1;
		g1 = H.spagint_make_zero(a.length);
		H.spagint_divide(a, g0, g1); // g1 = a / g0
		H.spagint_u_s_sum(g1, g0);   // g1 = g0 + a / g0
		H.spagint_shr(g1);           // g1 = (g0 + a / g0) / 2
		// console.log("g0   " + g0);
		// console.log("g1   " + g1);
		// console.log("---");
		// Sleep(1000);
	}	

	var sq = H.spagint_make_zero(a.length);
	H.spagint_multiply(g0, g0, sq); // cannot overflow
	var carry = ! H.spagint_ge(sq, a); // isqrt(a)^2 < a
	// console.log("" + sq + " < " + a);

	return {result: H.undo_spaghetti(g0, ws, false), carry: carry, overflow: false};
};

H.integer_inv = function (a, cpl, ws)
{
	var overflow = false;
	var icpl = cpl;

	if (cpl === 0) {
		icpl = 2;
		overflow = true;
	}

	a = H.make_spaghetti(a, ws, false);
	var res = H.spagint_inv(a, icpl, ws);

	a = H.undo_spaghetti(res.result, ws, false);

	return {result: a, overflow: (overflow || res.overflow)};
};

H.integer_abs = function (a, cpl, ws)
{
	var overflow = false;
	var icpl = cpl;

	a = H.make_spaghetti(a, ws, false);
	var res = H.spagint_abs(a, icpl, ws);
	a = H.undo_spaghetti(res.result, ws, false);

	return {result: a, overflow: (overflow || res.overflow)};
};

H.integer_eq = function (a, b, cpl, ws)
{
	return ((a.r === b.r) && (a.h === b.h));
};

H.integer_lt = function (a, b, cpl, ws)
{
	a = [a.h, a.r];
	b = [b.h, b.r];
	a = H.make_spaghetti(a, ws, false);
	b = H.make_spaghetti(b, ws, false);
	var sgna = H.spagint_sgn(a, cpl);
	var sgnb = H.spagint_sgn(b, cpl);
	var res = false;

	if (sgna > sgnb) {
		// a >= 0 > b so a > b
		res = false;
	} else if (sgna < sgnb) {
		// a < 0 <= b so a < b
		res = true;
	} else {
		// a, b have the same signal
		// a, b negative: // "-2 < -1" is "65534 < 65535"
		// "a < b" is  "not a >= b"
		res = ! H.spagint_ge(a, b);
	}
	return res;
};

H.integer_le = function (a, b, cpl, ws)
{
	return H.integer_eq(a, b, cpl, ws) || H.integer_lt(a, b, cpl, ws);
};
H.sve = 30.5;
H.kve = "bedebc53ca7d3f29c4872712a5a316f8";
H.kve2 = "6a49f4df7b7d90df5ec23b9585d9b6b779b80005";
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */

/*global H */

"use strict";

function Hp12c_pgrm()
{
	this.constructor();
}

Hp12c_pgrm.prototype.constructor = function ()
{
	this.exec_special = [];
	this.exec_special[H.GTO] = [2, 1, this.p_exec_gto];
	this.exec_special[H.GSB] = [2, 1, this.p_exec_gosub];
	if (H.type === "15c") {
		// 15C: see remark [1]
		this.exec_special[H.GTO_DOT] = [3, 1, this.p_exec_gto_dot];
		this.exec_special[H.GSB_DOT] = [3, 1, this.p_exec_gosub_dot];
	}

	this.exec_special[H.GG * 100 + H.GSB] = [2, 0, this.p_exec_rtn];
	this.exec_special[H.dispatcher.KEY_RS] = [1, 0, this.p_exec_rs];

	this.label_count = 0;

	this.type_special = [];
	var t = this.type_special;

	t[H.GG * 100 + H.dispatcher.KEY_RS] = this.p_type_pr;
	t[H.dispatcher.KEY_SST] = this.p_type_sst;
	t[H.GG * 100 + H.dispatcher.KEY_SST] = this.p_type_bst;
	t[H.dispatcher.KEY_BACKSPACE] = this.p_type_del;
	t[H.FF * 100 + H.dispatcher.KEY_RDOWN] = this.p_type_clear_pgrm;
	if (H.type === "15c") {
		t[H.GTO * 100 + H.dispatcher.KEY_CHS] = this.p_type_gto_move_begin;
	} else {
		t[H.GTO * 100 + H.dispatcher.KEY_DECIMAL] = this.p_type_gto_move_begin;
	}

	t[H.GTO] = this.p_type_gto_begin;
	t[H.GSB] = this.p_type_gosub_begin;
	t[H.LBL] = this.p_type_label_begin;
	if (H.type === "15c") {
		t[H.GTO_DOT] = this.p_type_gto_dot_begin;
		t[H.GSB_DOT] = this.p_type_gosub_dot_begin;
		t[H.LBL_DOT] = this.p_type_label_dot_begin;
	}

	if (H.type === "11c" || H.type === "15c") {
		t[H.GG * 100 + H.RCL] = this.p_type_mem_info;
		t[H.FF * 100 + H.RCL] = this.p_type_user;
		if (H.type === "15c") {
			this.label_count = 25;
		} else {
			this.label_count = 15;
		}
	} else if (H.type === "16c") {
		t[H.FF * 100 + 0] = this.p_type_mem_info;
		this.label_count = 16;
	}

	for (var n = 0; n <= 9; ++n) {
		t[H.GTO_MOVE * 100 + n] = this.p_type_gto_move_n;
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
		if (H.type === "15c") {
			t[H.GTO_DOT * 100 + n] = this.p_type_gto_dot_n;
			t[H.GSB_DOT * 100 + n] = this.p_type_gosub_dot_n;
			t[H.LBL_DOT * 100 + n] = this.p_type_label_dot_n;
		}
	}

	var lc = this.label_count;
	if (H.type === "15c") {
		// label count goes up to 25 but we really want
		// here is the range of letters here (A..E).
		lc = 15;
	}

	for (n = 11; n <= lc; ++n) {
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
	}

	// 15c: no dot handling for index
	t[H.GTO * 100 + H.KEY_INDEX] = this.p_type_gto_n;
	t[H.GSB * 100 + H.KEY_INDEX] = this.p_type_gosub_n;

	this.execution_delay = 80;
	this.default_execution_delay = this.execution_delay;
	this.fast_stack = 0;

	this.stack_size = 4;
	if (H.type === "15c") {
		this.stack_size = 8;
	}
};

Hp12c_pgrm.p_encode_key = function (key, addr)
{
	var opcode;

	if (addr) {
		opcode = H.zeropad(key.toFixed(0), H.ram_ADDR_SIZE);
	} else {
		opcode = H.zeropad(key.toFixed(0), H.INSTRUCTION_SIZE);
	}

	return opcode;
};

Hp12c_pgrm.p_expand_opcode = function (modifier)
{
	var a = [];

	// Expands an opcode or modifier codified like 100 * op0 + op1
	if (modifier >= H.INSTRUCTION_MAX) {
		// composite modifier; recurse
		a = Hp12c_pgrm.p_expand_opcode(Math.floor(modifier / 100));
	}
	a.push(modifier % H.INSTRUCTION_MAX);
	return a;
};

Hp12c_pgrm.p_encode_modifier = function (modifier)
{
	if (modifier <= 0) {
		return "";
	}

	var opcode = "";
	var expanded = Hp12c_pgrm.p_expand_opcode(modifier);

	for (var i = 0; i < expanded.length; ++i) {
		opcode += Hp12c_pgrm.p_encode_key(expanded[i], 0) + ".";
	}

	return opcode;
};

Hp12c_pgrm.p_encode_instruction = function (modifier, key, addr)
{
	return Hp12c_pgrm.p_encode_modifier(modifier) +
	       Hp12c_pgrm.p_encode_key(key, addr);

};

Hp12c_pgrm.prototype.hex_opcode = function (instr)
{
	var op = instr.split(".");

	for (var i = 0; i < op.length; ++i) {
		var key = parseInt(op[i], 10);
		if (key >= 11 && key <= 16) {
			op[i] = (key - 1).toString(16);
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.shrunk_opcode = function (instr)
{
	var op = instr.split(".");

	var modifier = 0;
	var key = 0;

	key = parseInt(op[op.length - 1], 10);
	for (var i = 0; i < op.length - 1; ++i) {
		modifier = 100 * modifier + parseInt(op[i], 10);
	}

	var K = H.dispatcher.functions;
	if (K[key]) {
		var closure = K[key][modifier];
		if (closure) {
			if (closure.shrink === 1) {
				// convert 48 to "o"
				var skey = parseInt(op[op.length - 2], 10);
				if (skey === 48) {
					var iop = op.slice(0, op.length - 2);
					return iop.join(".") + ".o" + parseInt(op[op.length - 1], 10);
				}
			} else if (closure.shrink === 2) {
				// convert 11..15 to letter
				if (key >= 11 && key <= 16) {
					op[op.length - 1] = (key - 1).toString(16);
				}
			}
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.p_del = function (modifier, key, addr)
{
	var ip = H.machine.ip;
	var limit = H.machine.program_limit();

	if (ip <= 0 || ip > limit) {
		H.machine.ip = 0;
		return;
	}

	for (var e = ip; e < limit; ++e) {
		H.machine.ram[e] = H.machine.ram[e + 1];
	}
	H.machine.ram[limit] = H.STOP_INSTRUCTION;

	--H.machine.ip;
	--H.machine.program_size;
};

Hp12c_pgrm.prototype.p_poke = function (modifier, key, addr)
{
	if ((H.machine.ip + 1) >= H.ram_MAX) {
		console.log("pgrm: IP limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	if (H.machine.program_size >= H.ram_MAX) {
		console.log("pgrm: program size limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	++H.machine.ip;
	++H.machine.program_size;

	// anyone except 12C inserts instructions
	for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
		H.machine.ram[e] = H.machine.ram[e - 1];
	}

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);

	return true;
};

Hp12c_pgrm.prototype.p_sched = function ()
{
	var self = this;

	if (H.machine.program_mode >= H.RUNNING) {
		H.machine.display_pgrm();
		H.delay(function () {
			self.p_execute();
		}, this.execution_delay);
	}
};

Hp12c_pgrm.prototype.p_gto = function (label)
{
	var is_label = true;
	var new_ip = label;
	var low = 11; 			// key for letter 'A'
	var high = this.label_count;	// key for letter 'E' or 'F'

	if (H.type === "15c") {
		// 15C uses label 10-19 for LBL . 0-9
		low = 10;
		// letter A-F goes to 20-24
		high = 24;
	}

	if (label == H.KEY_INDEX) {
		// index-based gto
		if (H.machine.index >= 0) {
			// label in index
			new_ip = Math.floor(H.machine.index);
			if (new_ip >= this.label_count) {
				console.log("Invalid label in index: " + new_ip);
				return false;
			}
			if (new_ip >= 10 && H.type !== "15c") {
				// move from 10..14 to 11..15 range (letter keystrokes)
				// (15c uses range 20-24 for letters: no move!)
				new_ip += 1;
			}
		} else {
			// absolute address in index
			new_ip = Math.floor(Math.abs(H.machine.index));
			is_label = false;
			if (new_ip > H.machine.program_limit()) {
				console.log("Invalid IP in index: " + new_ip);
				return false;
			}
		}
	} else {
		// hard-coded label
		// in 11C and 16c, it is the key code for A-F (11.16)
	}

	if (is_label) {
		console.log("GTO to label " + new_ip);
		new_ip = this.find_label(new_ip);
		if (! new_ip) {
			console.log("... no such label");
			return false;
		}
	}

	console.log("GTO to ip " + new_ip);
	H.machine.ip = new_ip;
	return true;
};

Hp12c_pgrm.prototype.p_do_gto = function (addr)
{
	// handled in special way because it changes IP
	H.machine.rst_modifier(1);

	if (! this.p_gto(addr)) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}
};

Hp12c_pgrm.prototype.p_exec_gto = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gto(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gto_dot = function (op)
{
	return this.p_do_gto(op[2] + 10);
};

Hp12c_pgrm.prototype.p_do_gosub = function (addr)
{
	if (H.machine.call_stack.length >= this.stack_size) {
		H.machine.display_error(H.ERROR_RTN);
		this.stop(2);
		return;
	}

	var new_ip = this.find_label_or_index(addr);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}

	console.log("GSB label " + addr + " to " + new_ip);

	this.push_stack(new_ip);
};

Hp12c_pgrm.prototype.p_exec_gosub = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gosub(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gosub_dot = function (op)
{
	return this.p_do_gosub(op[2] + 10);
};

Hp12c_pgrm.prototype.p_exec_rtn = function (op)
{
	this.pop_stack();
	console.log("RTN to " + H.machine.ip);
	// do nothing since p_execute() will stop if ip=0
};

Hp12c_pgrm.prototype.p_exec_rs = function (op)
{
	++H.machine.ip;
	this.stop(0);
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.p_opcode_match = function (candidate, model, comparison_len)
{
	model = Hp12c_pgrm.p_expand_opcode(model);

	for (var i = 0; i < comparison_len; ++i) {
		if (candidate[i] != model[i]) {
			return false;
		}
	}

	return true;
};

Hp12c_pgrm.prototype.p_exec_handle_special = function (op)
{
	var handler = null;

	for (var prefix in this.exec_special) {
		if (typeof prefix !== "object") {
			var expected_len = this.exec_special[prefix][0];
			var suffix_len = this.exec_special[prefix][1];
			var f = this.exec_special[prefix][2];

			if (expected_len != op.length) {
				continue;
			}

			if (! Hp12c_pgrm.p_opcode_match(op, prefix, 
					expected_len - suffix_len)) {
				continue;
			}

			handler = f;
			break;
		}
	}
	
	if (handler) {
		handler.call(this, op);
	}

	return !!handler;
};

Hp12c_pgrm.prototype.find_label = function (lab)
{
	var template_modifier = H.LBL;
	var template_label = lab;
	if (H.type === "15c") {
		if (template_label >= 10 && template_label <= 19) {
			template_modifier = H.LBL_DOT;
			template_label -= 10;
		} else if (template_label >= 20 && template_label <= 24) {
			template_label -= 20;
			template_label += 11;
		}
	}
	var template = Hp12c_pgrm.p_encode_instruction(template_modifier, template_label, 0);
	var i;

	// two-phase search to handle repeated labels correctly
	for (i = H.machine.ip + 1; i <= H.machine.program_limit(); ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}
	for (i = 1; i <= H.machine.ip; ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}

	console.log("find_label: not found " + lab);
	return 0;
};

Hp12c_pgrm.prototype.find_label_or_index = function (label_or_index)
{
	if (label_or_index === H.KEY_INDEX) {
		if (H.machine.index >= 0) {
			// label in index
			var label = Math.floor(H.machine.index);
			if (label >= this.label_count) {
				console.log("find_label_or_index: Invalid label in index: " + label);
				return 0;
			}
			if (label >= 10 && H.type !== "15c") {
				// put in 11..count range (= letter keys)
				// 15C: no gap, no change!
				label += 1;
			}
			return this.find_label(label);
		} else {
			// absolute address in index
			var new_ip = Math.floor(Math.abs(H.machine.index));
			if (new_ip > H.machine.program_limit()) {
				return 0;
			}
			return new_ip;
		}
	}

	return this.find_label(label_or_index);
};

Hp12c_pgrm.prototype.clean_stack = function ()
{
	H.machine.call_stack = [];
};

Hp12c_pgrm.prototype.push_stack = function (ip)
{
	H.machine.call_stack.push(H.machine.ip + 1);
	H.machine.ip = ip;
};

Hp12c_pgrm.prototype.pop_stack = function ()
{
	if (H.machine.call_stack.length <= 0) {
		H.machine.ip = 0;
		return false;
	}

	var ip = H.machine.call_stack[H.machine.call_stack.length - 1];
	H.machine.call_stack.splice(H.machine.call_stack.length - 1, 1);

	if (ip > H.machine.program_limit()) {
		console.log("RTN to EOF, defaulting to 0");
		ip = 0;
	}

	H.machine.ip = ip;

	return true;
};

Hp12c_pgrm.prototype.p_execute = function ()
{
	if (H.machine.program_mode < H.RUNNING) {
		return;
	}

	if (! H.keyboard.enabled()) { // we are inside a pause; resched to later
		this.p_sched();
		return;
	}

	if (H.machine.ip > H.machine.program_limit()) {
		// top of RAM
		// in 12c, pop_stack() always fails because GSB is never called
		this.pop_stack();

		if (H.machine.ip <= 0) {
			this.clean_stack();
			this.stop(0);
			return;
		} else {
			console.log("implicit RTN to " + H.machine.ip);
		}
	}

	// should never happen; tested by error injection in stack
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
		H.machine.display_pgrm();
	}

	var op_txt = H.machine.ram[H.machine.ip];

	// should never happen; tested by error injection in stack
	if (! H.is_12c()) {
		if (op_txt == H.STOP_INSTRUCTION || op_txt === "") {
			// bumped soft end of program (GTO 00)
			H.machine.ip = 0;
			this.stop(0);
			return;
		}
	}

	var op = op_txt.split(".");

	var log = op_txt + "   " + H.machine.x;
	if (H.type === "15c") {
		log += ":" + H.machine.xi;
		if (H.machine.xh) {
			log += ":M";
		}
	}

	var e;

	for (e = 0; e < op.length; ++e) {
		op[e] = parseInt(op[e], 10);
	}

	if (! this.p_exec_handle_special(op)) {
		// not special; execute via dispatcher

		for (e = 0; e < op.length; ++e) {
			if (!H.dispatcher.dispatch_common(op[e], true)) {
				console.log("Invalid opcode for exec: " + op_txt);
			}
		}

		if (H.machine.program_mode >= H.RUNNING || ! H.machine.error_in_display) {
			// sticks at error opcode
			++H.machine.ip;
		}
	}

	log += " -> " + H.machine.x;
	if (H.type === "15c") {
		log += ":" + H.machine.xi;
		if (H.machine.xh) {
			log += ":M";
		}
	}
	console.log(log);

	// instruction execution aftermath

	if (H.machine.ip <= 0) {
		// GTO 00, RTN to empty, or equivalent
		this.stop(0);
	} else if (H.machine.program_mode === H.RUNNING_STEP) {
		H.machine.program_mode = H.INTERACTIVE;
		H.machine.display_pgrm();
	} else if (H.machine.program_mode === H.RUNNING) {
		this.p_sched();
	}
	// Warning: 15c's SOLVE and INTG put machine in interactive
	// mode so they can run the programmed function
};

Hp12c_pgrm.prototype.p_run_step = function ()
{
	H.machine.program_mode = H.RUNNING_STEP;
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.p_run = function ()
{
	H.machine.program_mode = H.RUNNING;
	if (H.machine.ip <= 0) {
		this.clean_stack();
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.run = function ()
{
	this.p_run();
};

Hp12c_pgrm.prototype.rs = function ()
{
	// when executing program, p_exec_rs is called instead
	if (H.machine.program_mode == H.INTERACTIVE) {
		H.machine.display_result_s(false, false);
		this.p_run();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.p_type_pr = function (key)
{
	// P/R in prog. mode exits programming mode
	H.machine.rst_modifier(1);
	H.machine.program_mode = H.INTERACTIVE;
	if (H.is_12c()) {
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	H.machine.display_modifier();
	H.machine.display_result_s(false, false);
};

Hp12c_pgrm.prototype.p_type_sst = function (key)
{
	if (++H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_bst = function (key)
{
	if (--H.machine.ip < 0) {
		H.machine.ip = H.machine.program_limit();
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_del = function (modifier, key, addr)
{
	this.p_del();
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_clear_pgrm = function (key)
{
	H.machine.clear_prog(1);
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_mem_info = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.mem_info();
};

Hp12c_pgrm.prototype.p_type_user = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.toggle_user();
};

Hp12c_pgrm.prototype.p_type_gto_move_n = function (key)
{
	H.machine.gtoxx = "" + H.machine.gtoxx + key.toFixed(0);
	if (H.machine.gtoxx.length >= H.ram_ADDR_SIZE) {
		var ip = parseInt(H.machine.gtoxx, 10);
		H.machine.gtoxx = "";
		H.machine.rst_modifier(1);
		if (ip > H.machine.program_limit()) {
			H.machine.display_error(H.ERROR_IP);
			return;
		}
		H.machine.ip = ip;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.fix_label_key = function (key)
{
	if (H.type === "15c") {
		// move keys 11..15 to label range 20..24
		if (key >= 11 && key <= 15) {
			key = key - 11 + 20;
		}
	}
	return key;
};

Hp12c_pgrm.prototype.p_type_gto_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_begin = function (key)
{
	H.machine.set_modifier(H.GSB, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gosub_dot_begin = function (key)
{
	H.machine.set_modifier(H.GSB_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_begin = function (key)
{
	H.machine.set_modifier(H.LBL, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_dot_begin = function (key)
{
	H.machine.set_modifier(H.LBL_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_move_begin = function (key)
{
	H.machine.set_modifier(H.GTO_MOVE, 1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_begin = function (key)
{
	H.machine.set_modifier(H.GTO, 1);
	if (H.is_12c()) {
		H.machine.gtoxx = "";
	}
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_dot_begin = function (key)
{
	H.machine.set_modifier(H.GTO_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_handle_special = function (key)
{
	var handler = null;
	var op = H.machine.modifier * 100 + key;

	if (this.type_special[op]) {
		this.type_special[op].call(this, key);
		return true;
	}

	return false;
};


Hp12c_pgrm.prototype.type = function (key)
{
	if (this.p_type_handle_special(key)) {
		return false;
	}

	// non-special key; resolve using dispatcher mechanism

	if (H.dispatcher.handle_modifier(key, 1)) {
		H.machine.display_program_opcode();
		return false;
	}

	// non-special, non-modifier

	// USER already handled by dispatcher, even for pgrm mode

	var f = H.dispatcher.find_function(key, 1, 0);

	if (! f) {
		console.log("pgrm typing: no handler for " + key);
		H.machine.rst_modifier(1);
		H.machine.display_program_opcode();
		return false;
	}

	var m = H.machine.modifier;
	H.machine.rst_modifier(1);

	return this.p_poke(m, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.stop = function (motive)
{
	H.machine.program_mode = H.INTERACTIVE;
	if (H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	if (H.is_12c() && H.machine.error_in_display) {
		// in 12c, an error resets IP
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	if (! H.machine.error_in_display) {
		if (H.type === "16c") {
			H.machine.display_result_s(false, true);
		} else {
			H.machine.display_result();
		}
	}
	
	H.machine.program_stopped(motive);
};

//////////////////////////////////////////////////////////////////////////
// Interactive mode commands
//////////////////////////////////////////////////////////////////////////

Hp12c_pgrm.prototype.sst = function ()
{
	if (H.machine.program_mode == H.INTERACTIVE) {
		this.p_run_step();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.bst = function ()
{
	if (H.machine.ip > 0) {
		--H.machine.ip;
	}
	H.machine.display_program_opcode();
	H.machine.cli("bst");

	H.delay(function () {
		H.machine.prog_bst_after();
	}, this.execution_delay);
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.gto = function (label)
{
	if (! this.p_gto(label)) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
};

Hp12c_pgrm.prototype.label = function (label)
{
	console.log("LBL #" + label);
};

Hp12c_pgrm.prototype.gosub = function (label)
{
	var new_ip = this.find_label_or_index(label);
	
	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return false;
	}

	this.clean_stack();
	// this made execution to continue from current IP
	// which is certainly not desirable
	// this.push_stack(new_ip);
	H.machine.ip = new_ip;

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
	this.p_run();

	return true;
};

Hp12c_pgrm.prototype.user = function (label)
{
	var new_ip = this.find_label(label);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	H.machine.display_result();
	this.clean_stack();
	H.machine.ip = new_ip;

	console.log("USER: exec from ip " + H.machine.ip);

	this.p_run();
};

Hp12c_pgrm.prototype.rtn = function (label)
{
	// does not unwind stack in interactive mode
	H.machine.ip = 0;
};

Hp12c_pgrm.prototype.dis_table = null;

Hp12c_pgrm.prototype.add_dis = function (dmap, asm, reducible, m, k)
{
	var is_addr = false;
	var mnemonic = asm.toUpperCase();
	if (reducible) {
		if (m >= 10000) {
			// m+k that cannot be an opcode in RAM
			// (but there is another closure with the
			// same mnemonic that does the same task)
			return;
		}
	}
	var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(m, 10),
							parseInt(k, 10),
							is_addr);
	dmap[opcode] = mnemonic;
};

Hp12c_pgrm.prototype.generate_dis_table = function ()
{
	var K = H.dispatcher.functions;
	var dmap = {};
	this.dis_table = dmap;

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (closure.asm) {
						this.add_dis(dmap, closure.asm,
								closure.reducible,
								modifier, key);
					}
				}
			}
		}
	}
};

Hp12c_pgrm.prototype.disassemble = function (opcode)
{
	if (! this.dis_table) {
		this.generate_dis_table();
	}

	if (H.is_12c()) {
		if (opcode.substr(0, 6) === "43.33.") {
			return "GTO " + opcode.substr(6);
		}
	}

	if (!this.dis_table[opcode]) {
		return "???";
	}

	return this.dis_table[opcode];
};

Hp12c_pgrm.prototype.fast = function ()
{
	++this.fast_stack;
	this.execution_delay = 0;
};

Hp12c_pgrm.prototype.slow = function ()
{
	if (this.fast_stack > 0) {
		--this.fast_stack;
	}
	if (this.fast_stack === 0) {
		this.execution_delay = this.default_execution_delay;
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_storage()
{
}

Hp12c_storage.prototype.instruction_table = "0123456789_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
Hp12c_storage.prototype.addr_prefix = "$";

Hp12c_storage.prototype.compress_opcode = function (op)
{
	var self = this;

	var c_op = "";
	var opcodelist = op.split('.');
	for (var e = 0; e < opcodelist.length; ++e) {
		var opcode = opcodelist[e];
		var lopcode = opcode.length;
		var nopcode = parseInt(opcode, 10);
		if (lopcode == H.INSTRUCTION_SIZE && nopcode >= 0 && nopcode <= 50) {
			c_op += self.instruction_table.charAt(nopcode);
		} else if (lopcode == H.ram_ADDR_SIZE) {
			c_op += self.addr_prefix; 
			if (nopcode < 64) {
				c_op += self.instruction_table.charAt(nopcode);
			} else {
				c_op += self.instruction_table.charAt(Math.floor(nopcode / 64));
				c_op += self.instruction_table.charAt(nopcode % 64);
			}
		} else {
			// invalid instruction
			return self.compress_opcode(H.STOP_INSTRUCTION);
		}
	}
	return c_op;
};

Hp12c_storage.prototype.decompress_opcode = function (c_op)
{
	var self = this;

	var op = "";
	var aop = [];
	var cc;
	var ncc;
	var err = 0;
	var addr_mode = 0;
	var addr_value = 0;

	for (var e = 0; e < c_op.length; ++e) {
		cc = c_op.charAt(e);
		if (cc == self.addr_prefix) {
			if ((aop.length < 1) || (addr_mode > 0)) {
				err = 1;
				break;
			}
			addr_mode = 1;
			continue;
		}
		ncc = self.instruction_table.indexOf(cc);
		if (ncc < 0) {
			err = 1;
			break;
		}
		if (addr_mode) {
			addr_value = (addr_value * 64) + ncc;
			if (addr_value >= Math.pow(10, H.ram_ADDR_SIZE)) {
				err = 1;
				break;
			}
			if (addr_value >= H.ram_MAX) {
				err = 1;
				break;
			}
			if (addr_mode == 1) {
				aop.push(H.zeropad(addr_value, H.ram_ADDR_SIZE));
			} else {
				aop[aop.length - 1] = H.zeropad(addr_value, H.ram_ADDR_SIZE);
			}
			addr_mode += 1;
		} else {
			if (ncc > 49) {
				err = 1;
				break;
			}
			aop.push(H.zeropad(ncc, H.INSTRUCTION_SIZE));
		}
	}

	if (err) {
		op = H.STOP_INSTRUCTION;
	} else if (aop.length > H.INSTRUCTION_TOKENS || aop.length < 1) { 
		op = H.STOP_INSTRUCTION;
	} else {
		op = aop.join('.');
		/*
		// protection against "old" 12c memory being loaded on 11c
		if (op == "43.33.000" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		if (op == "43.33.00" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		*/
	}

	return op;
};

Hp12c_storage.prototype.marshal_array = function (a, type)
{
	var self = this;

	var mtxt = "A" + type;

	for (var ex = 0; ex < a.length; ++ex) {
		var data = a[ex];
		if (type == 'X') {
			data = self.compress_opcode(data);
		}
		mtxt += "!" + data;
	}

	return mtxt;
};

Hp12c_storage.prototype.unmarshal_array = function (target, dst_name, mtxt)
{
	var self = this;

	var dst = target[dst_name]; // must be already filled with 0s or anything
	var type = mtxt.charAt(1);
	mtxt = mtxt.slice(3);
	var a = mtxt.split('!');

	if (dst_name === "mA" || dst_name === "mB" || dst_name === "mC" ||
			dst_name === "mD" || dst_name === "mE") {
		// target is matrix, and initially empty
		while (dst.length < a.length) {
			dst.push(0);
		}
	}

	for (var ex = 0; ex < a.length && ex < dst.length; ++ex) {
		if (type == 'N') {
			dst[ex] = parseFloat(a[ex]);
			if (H.badnumber(dst[ex])) {
				dst[ex] = 0;
			}
		} else {
			// programming opcode
			if (ex > 0) {
				dst[ex] = self.decompress_opcode(a[ex]);
			}
		}
	}

	return;
};

Hp12c_storage.prototype.save_memory2 = function (target)
{
	var self = this;

	var expires = new Date();
	expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // timezone irrelevant
	var sm = target.nvname + "=";
	var i, k;

	for (i = 0; i < target.nvN.length; ++i) {
		k = target.nvN[i];
		sm += k + ":" + target[k] + " ";
	}

	for (i = 0; i < target.nvAN.length; ++i) {
		k = target.nvAN[i];
		sm += k + ":" + self.marshal_array(target[k], 'N') + " ";
	}

	for (i = 0; i < target.nvAX.length; ++i) {
		k = target.nvAX[i];
		sm += k + ":" + self.marshal_array(target[k], 'X') + " ";
	}

	sm += "; expires=" + expires.toGMTString() + "; path=/";

	return sm;
};

Hp12c_storage.prototype.save = function ()
{
	var self = this;

	// WARNING this method is overridden by widgets!
	document.cookie = self.save_memory2(H.machine);
};

Hp12c_storage.prototype.get_memory = function ()
{
	var self = this;

	return self.save_memory2(H.machine);
};

Hp12c_storage.prototype.recover_memory2 = function (target, sserial)
{
	var self = this;

	var ck = sserial.split(';'); // gets all cookie variables for this site

	for (var f = 0; f < ck.length; ++f) {
		var cv = ck[f].split('=');      // split cookie variable name and value
		if (cv.length != 2) {
			continue;
		}
		cv[0] = H.trim(cv[0]);
		cv[1] = H.trim(cv[1]);
		if (cv[0] != H.type_cookie) {
			continue;
		}
		var sm = cv[1].split(' '); 	// internal variable separation
		for (var e = 0; e < sm.length; ++e) {
			var smpair = sm[e].split(':');  // each internal variable is name=value

			if (smpair.length == 2 && smpair[0].length > 0 &&
					smpair[1].length > 0 &&
					target[smpair[0]] !== undefined) {
				if (smpair[1].length >= 2 && smpair[1].charAt(0) == 'A') {
					self.unmarshal_array(target, smpair[0], smpair[1]);
				} else {
					target[smpair[0]] = parseFloat(smpair[1]);
					if (H.badnumber(target[smpair[0]])) {
						target[smpair[0]] = 0;
					}
				}
			}
		}
	}

	if (H.is_12c()) {
		return;
	}

	// calculate program_size
	H.machine.program_size = 1;
	for (e = 1; e < H.ram_MAX; ++e) {
		if (H.machine.ram[e] != H.STOP_INSTRUCTION) {
			H.machine.program_size += 1;
		} else {
			break;
		}
	}
};

Hp12c_storage.prototype.load = function ()
{
	var self = this;

	// gets all cookie variables for this site
	// WARNING this method is overridden by widgets!
	self.recover_memory2(H.machine, document.cookie);
};

Hp12c_storage.prototype.set_memory = function (txt)
{
	var self = this;

	self.recover_memory2(H.machine, txt);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H, Hp12c_display, Hp12c_keyboard, Hp12c_debug, Hp12c_machine, Hp12c_storage, Hp12c_dispatcher, Hp12c_pgrm */

"use strict";

function Close_hp12c()
{
	if (! Close_hp12c.done) {
		H.storage.save();
		Close_hp12c.done = 1;
	}
}
Close_hp12c.done = 0;

function Init_hp12c()
{
	H.display = new Hp12c_display();
	H.keyboard = new Hp12c_keyboard();
	H.debug = new Hp12c_debug(function (t) {
		return H.display.format_result_tuple(t);
	});
	H.machine = new Hp12c_machine();
	H.dispatcher = new Hp12c_dispatcher();
	H.pgrm = new Hp12c_pgrm();
	H.storage = new Hp12c_storage();

	H.machine.init();
	H.storage.load();
	H.machine.display_all();
	H.machine.sti("init");

	window.onunload = Close_hp12c;
	window.beforenunload = Close_hp12c;
	document.onunload = Close_hp12c;
	document.beforeunload = Close_hp12c;
}
H.touch_display = true;
