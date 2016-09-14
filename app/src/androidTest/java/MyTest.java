import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.support.test.espresso.action.CoordinatesProvider;
import android.support.test.espresso.action.GeneralClickAction;
import android.support.test.espresso.action.Press;
import android.support.test.espresso.action.Tap;
import android.support.test.espresso.matcher.ViewMatchers;
import android.test.ActivityInstrumentationTestCase2;
import android.util.Log;
import android.view.View;

import org.junit.FixMethodOrder;
import org.junit.runners.MethodSorters;

import java.io.File;
import java.io.FilenameFilter;
import java.util.HashMap;
import java.util.Random;

import br.com.epx.andro16c.AndroActivity;
import br.com.epx.andro16c.R;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.action.ViewActions.pressImeActionButton;
import static android.support.test.espresso.action.ViewActions.replaceText;
import static android.support.test.espresso.action.ViewActions.scrollTo;
import static android.support.test.espresso.action.ViewActions.swipeUp;
import static android.support.test.espresso.action.ViewActions.typeText;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.withEffectiveVisibility;
import static android.support.test.espresso.matcher.ViewMatchers.withId;
import static android.support.test.espresso.matcher.ViewMatchers.withText;

@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class MyTest extends ActivityInstrumentationTestCase2<AndroActivity> {
    ViewInteraction lcd[][];
    HashMap<String, String> lcd_table = new HashMap<String, String>();
    final static String lcdruler = "xabcdefgpt";
    final static String TAG = "androtest";
    final static int[] kth = {47, 37, 38, 39, 27, 28, 29, 17, 18, 19};
    final static String kcharsh =
            "0123456789" +
                    "/ABCDEF???" +
                    "xGHIJKL???" +
                    "-MNOPQR???" +
                    "+Xfgsr??.S" +
                    "()";
    final static String kcharsv =
            "?ABCDE" +
                    "?GHIJK" +
                    "XMNOPQ" +
                    "rF789/" +
                    "sL456x" +
                    "gR123-" +
                    "f?0.S+" +
                    "()";

    ViewInteraction mod, scr;
    Activity act;
    boolean vertical_or;

    public MyTest() {
        super(AndroActivity.class);

        lcd_table.put("-", "d");
        lcd_table.put(" ", "");
        lcd_table.put("0", "abcefg");
        lcd_table.put("1", "cf");
        lcd_table.put("2", "acdeg");
        lcd_table.put("3", "acdfg");
        lcd_table.put("4", "bcdf");
        lcd_table.put("5", "abdfg");
        lcd_table.put("6", "abdefg");
        lcd_table.put("7", "acf");
        lcd_table.put("8", "abcdefg");
        lcd_table.put("9", "abcdfg");
        lcd_table.put("0", "abcefg");
        // lcd_table['.'] = "p";
        // lcd_table[','] = "t";

        this.vertical_or = false;

    }

    // from http://stackoverflow.com/questions/22177590/click-by-bounds-coordinates
    public static ViewAction clickp(final float x, final float y) {
        return new GeneralClickAction(
                Tap.SINGLE,
                new CoordinatesProvider() {
                    @Override
                    public float[] calculateCoordinates(View view) {

                        final int[] screenPos = new int[2];
                        view.getLocationOnScreen(screenPos);

                        final float screenX = screenPos[0] + x * view.getWidth();
                        final float screenY = screenPos[1] + y * view.getHeight();
                        float[] coordinates = {screenX, screenY};

                        return coordinates;
                    }
                },
                Press.FINGER);
    }

    // return key position as proportion (percentage)
    public static float[] keycoords_h(final int key) {
        if (key == 50) {
            // left upper area
            return new float[]{0.01f, 0.01f};
        } else if (key == 51) {
            // right upper area
            return new float[]{0.99f, 0.01f};
        }

        int k = key;

        // convert key to monotonic sequence (11-20, 21-30...)

        if (k % 10 == 0 && k >= 10) {
            // arithmetic
            k += 10;
        } else if (k < 10) {
            k = kth[k];
        }

        final float x = (float) (25.0 + ((k - 1) % 10) * (1617.0 - 25.0) / 9) / 1757.0f;
        final float y = (float) (366.0 + ((k - 11) / 10) * (948.0 - 366.0) / 3) / 1080f;
        return new float[]{x, y};
    }

    public static float[] keycoords_h(final char key) {
        int ik = kcharsh.indexOf(key);
        assertTrue("key h not found: " + key, ik > -1);
        return keycoords_h(ik);
    }

    public static float[] keycoords_v(final int k) {
        if (k == 42) {
            // left upper area
            return new float[]{0.01f, 0.01f};
        } else if (k == 43) {
            // right upper area
            return new float[]{0.99f, 0.01f};
        }
        final float x = (float) (30.0 + 30.0 + (k % 6) * (945.0 - 30.0) / 5) / 1080.0f;
        final float y = (float) (30.0 + 393.0 + (k / 6) * (1602.0 - 393.0) / 6) / 1726.0f;
        return new float[]{x, y};
    }

    public static float[] keycoords_v(final char key) {
        int ik = kcharsv.indexOf(key);
        assertTrue("key v not found: " + key, ik > -1);
        return keycoords_v(ik);
    }

    public ViewAction clickp(final char key) {
        if (!this.vertical_or) {
            float[] coords = keycoords_h(key);
            assertTrue("X coordinate must be 0..1", coords[0] >= 0.0 && coords[0] <= 1.0);
            assertTrue("Y coordinate must be 0..1", coords[1] >= 0.0 && coords[1] <= 1.0);
            return clickp(coords[0], coords[1]);
        }
        float[] coords = keycoords_v(key);
        assertTrue("X coordinate must be 0..1", coords[0] >= 0.0 && coords[0] <= 1.0);
        assertTrue("Y coordinate must be 0..1", coords[1] >= 0.0 && coords[1] <= 1.0);
        return clickp(coords[0], coords[1]);
    }

    public void typ(final String keys) {
        for (int i = 0; i < keys.length(); ++i) {
            char k = keys.charAt(i);
            scr.perform(clickp(k));
            slep(250);
        }
    }

    private boolean visible(ViewInteraction v) {
        try {
            v.check(matches(withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE)));
        } catch (AssertionError e) {
            return false;
        }
        return true;
    }

    private String lcd_digit_read(int n) {
        String t = "";
        for (int i = 1; i <= 7; ++i) {
            if (visible(lcd[n][i])) {
                t += lcdruler.charAt(i);
            }
        }
        char u = '%';
        for (String key : lcd_table.keySet()) {
            if (lcd_table.get(key).equals(t)) {
                u = key.charAt(0);
                break;
            }
        }
        assertTrue("Unknown LCD digit (" + t + ")", u != '%');

        String uu = "" + u;

        if (visible(lcd[n][8]) && visible(lcd[n][9])) {
            uu += "$,";
        } else if (visible(lcd[n][8])) {
            uu += "$.";
        }

        return uu;
    }

    private String lcd_read() {
        String t = "";
        for (int i = 0; i < 11; ++i) {
            t += lcd_digit_read(i);
        }
        return t;
    }

    private String lcd_translate(String s) {
        String t = "";
        int digit_count = 0;
        for (int i = 0; i < s.length(); ++i) {
            char c = s.charAt(i);
            if (c == '.' || c == ',') {
                // signals compression
                t += "$";
            } else {
                digit_count += 1;
            }
            t += c;
        }
        while (digit_count < 11) {
            t += " ";
            digit_count += 1;
        }
        return t;
    }

    private void lcd_test(String sexpected) {
        String expected = lcd_translate(sexpected);
        String actual = lcd_read();
        assertEquals("LCD expected " + sexpected +
                        " encoded expected " + expected + "(len " + expected.length() + ")" +
                        " actual " + actual + "(len " + actual.length() + ")",
                expected, actual);
        Log.w(TAG, "LCD is " + sexpected);
    }

    private void mod_test(String expected) {
        mod.check(matches(withText(expected)));
    }

    public int get_id(String idname) {
        int id = act.getResources()
                .getIdentifier(act.getPackageName() + ":id/" + idname, null, null);
        assertTrue("View ID not zero", id != 0);
        return id;
    }

    public ViewInteraction get_view(String idname) {
        ViewInteraction v = onView(withId(get_id(idname)));
        assertTrue("View not null", v != null);
        return v;
    }

    public void find_elements() {
        mod = get_view("dmodifier");
        scr = get_view("face");
        lcd = new ViewInteraction[11][];
        for (int digit = 0; digit <= 10; ++digit) {
            lcd[digit] = new ViewInteraction[10];
            for (int segment = 1; segment < 10; ++segment) {
                String name = "lcd" + digit + "" + segment;
                lcd[digit][segment] = get_view(name);
            }
        }
    }

    private void slep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void setUp() throws Exception {
        super.setUp();
        act = getActivity();
        find_elements();
        slep(1500);
    }

    private String[] memfiles() {
        String spath = Environment.getExternalStorageDirectory() + "/" +
                act.getResources().getString(R.string.app_folder_name);
        Log.w(TAG, "Mem file path: " + spath);
        File path = new File(spath);
        path.mkdirs();
        FilenameFilter filter = new FilenameFilter() {
            public boolean accept(File dir, String filename) {
                File sel = new File(dir, filename);
                return filename.endsWith(".mem") && !sel.isDirectory();
            }
        };
        return path.list(filter);
    }

    private boolean memexists(String name) {
        String[] files = memfiles();
        int n = files.length;
        Log.w(TAG, "Files in folder to check: " + n);
        for (int i = 0; i < n; i++) {
            if (files[i].equals(name + ".mem") || files[i].equals(name)) {
                return true;
            }
            Log.w(TAG, "File found but not matched: " + files[i]);
        }
        return false;
    }

    private void delmemfiles() {
        File path = new File(Environment.getExternalStorageDirectory() + "/" +
                act.getResources().getString(R.string.app_folder_name));
        String[] files = memfiles();
        int n = files.length;
        Log.w(TAG, "Files in folder to delete: " + n);
        for (int i = 0; i < n; i++) {
            File file = new File(path, files[i]);
            file.delete();
            Log.w(TAG, "File deleted: " + files[i]);
        }
    }

    public void cleancalc() {
        // dummy test to clear prefs
        SharedPreferences preferences = act.getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor e = preferences.edit();
        e.clear();
        e.commit();
        e.putString("bla", "ble");
        e.apply();
        e.remove("bla");
        e.apply();

        SharedPreferences prefs =
                PreferenceManager.getDefaultSharedPreferences(act);
        e = prefs.edit();
        e.clear();
        e.commit();
        e.putString("bla", "ble");
        e.apply();
        e.remove("bla");
        e.apply();

        delmemfiles();
    }

    public void round1() {
        slep(500);
        typ("fr2");
        lcd_test(" 0.00");
        typ("3");
        lcd_test(" 3.");
        typ("R");
        lcd_test(" 3.00");

        int alea = (new Random()).nextInt(399) + 1;
        typ("" + alea);
        typ("+");
        lcd_test(" " + (alea + 3) + ".00");
        typ("s");
        mod_test("STO");
        typ("1");
        mod_test("");
        typ("0R");

        // Show back
        typ(")");
        onView(withId(R.id.back)).perform(click());

        // menu
        typ("(");
        // About
        onView(withText("More")).perform(click());
        onView(withText("About...")).perform(click());
        onView(withText("Back")).perform(click());

        typ("(");
        onView(withText("Feedback")).perform(click());
        onView(withText("Audio feedback")).perform(click());

        typ("R(");
        onView(withText("Feedback")).perform(click());
        onView(withText("Haptic key 1")).perform(click());

        typ("R(");
        onView(withText("Feedback")).perform(click());
        onView(withText("Haptic key 2")).perform(click());

        typ("R(");
        onView(withText("Feedback")).perform(click());
        onView(withText("No feedback")).perform(click());

        typ("R(");
        onView(withText("Visual feedback")).perform(click());
        onView(withText("No")).perform(click());

        typ("R(");
        onView(withText("Visual feedback")).perform(click());
        onView(withText("Yes")).perform(click());

        // menu
        typ("R(");
        // About
        onView(withText("More")).perform(click());
        onView(withText("Speed")).perform(click());
        onView(withText("Normal")).perform(click());

        // menu
        typ("(");
        // About
        onView(withText("More")).perform(click());
        onView(withText("Speed")).perform(click());
        onView(withText("Fast")).perform(click());

        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Enable fullscreen")).perform(click());

        // menu
        typ("(");
        // Decimal format
        onView(withText("Number format")).perform(click());
        onView(withText("1.111.111,9")).perform(click());
        slep(250);
        lcd_test(" 0,00");
        typ("123456R");
        lcd_test(" 123.456,00");

        typ("(");
        onView(withText("Number format")).perform(click());
        onView(withText("11,11,111.9")).perform(click());
        slep(250);
        lcd_test(" 1,23,456.00");

        typ("(");
        onView(withText("Number format")).perform(click());
        onView(withText("1,111,111.9")).perform(click());
        slep(250);
        lcd_test(" 123,456.00");
        typ("X"); // force save memory
    }

    public void round2() {
        // verify that memory is preserved
        slep(1000);
        lcd_test(" 123,456.00");
        typ("00R");
        lcd_test(" 0.00");

        int alea_save = (new Random()).nextInt(399) + 1;

        // types alea_save, STO 5 and clears stack from number
        typ("" + alea_save + "Rs5");


        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Save memory")).perform(click());
        onView(withText("Cancel")).perform(click());

        assertEquals("Mem file should not exist", memexists("abracadabra"), false);

        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Save memory")).perform(click());
        onView(withText("New")).perform(click());
        onView(withId(R.id.mem_file_name)).perform(typeText("abracadabra"),
                pressImeActionButton());
        onView(withText("OK")).perform(click());
        slep(1000);
        assertEquals("Mem file should exist", true, memexists("abracadabra"));

        // clobber STO 5
        typ("998Rs5");
        lcd_test(" 998.00");
        // clobber stack
        typ("0RRRR");
        // verify that clobbered values are in place, instead of save mem
        lcd_test(" 0.00");
        typ("r5");
        lcd_test(" 998.00");

        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Load memory")).perform(click());
        onView(withText("Cancel")).perform(click());

        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Load memory")).perform(click());
        // TODO how to select a particular item
        // onView(withText("abracadabra")).perform(click());
        onView(withText("OK")).perform(click());
        typ("r5");
        lcd_test(" " + alea_save + ".00");

        // clobber saved memory with new contents and load it again
        typ("R976Rs40RRRR");
        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Save memory")).perform(click());
        // onView(withText("abracadabra")).perform(click());
        onView(withText("OK")).perform(click());
        typ("R12RRRRs4r4");
        lcd_test(" 12.00");

        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Load memory")).perform(click());
        // onView(withText("abracadabra")).perform(click());
        onView(withText("OK")).perform(click());
        slep(1000);
        lcd_test(" 0.00");
        typ("r4");
        lcd_test(" 976.00");


        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Delete memory")).perform(click());
        onView(withText("Cancel")).perform(click());

        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Delete memory")).perform(click());
        onView(withText("OK")).perform(click());
        assertEquals("Mem file should have been removed", memexists("abracadabra"), false);

        // no items, so it should return immediately
        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Load memory")).perform(click());

        // no items, so it should return immediately
        typ("(");
        onView(withText("Memory")).perform(click());
        onView(withText("Delete memory")).perform(click());
    }

    public void wrapup() {
        typ("0RXX");
    }

    public void testO00() {
        cleancalc();
    }

    public void testO05() {
        slep(1000);
        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Lock landscape")).perform(click());
        typ("R");
        slep(2000);
    }

    public void testO10() {
        round1();
    }

    public void testO20() {
        round2();
    }

    public void testO30() {
        wrapup();
    }

    public void testO40() {
        cleancalc();
    }

    public void testO50() {
        slep(1000);
        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Lock portrait")).perform(click());
        this.vertical_or = true;
        slep(2000);
        typ("R");
    }

    public void testO60() {
        this.vertical_or = true;
        round1();
    }

    public void testO70() {
        this.vertical_or = true;
        round2();
    }

    public void testO75() {
        this.vertical_or = true;

        // accessible only in vertical (long menu)
        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Disable fullscreen")).perform(click());

        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Stretch")).perform(click());

        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Do not stretch")).perform(click());

        // FIXME still fails in small screen; how to scroll??
        /*
        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Never sleep")).perform(click());

        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Allow sleep")).perform(click());
        */
    }

    public void testO80() {
        this.vertical_or = true;
        wrapup();
    }

    public void testO90() {
        this.vertical_or = true;
        typ("(");
        onView(withText("Display")).perform(click());
        onView(withText("Allow rotation")).perform(click());
        slep(2000);
        cleancalc();
    }
}