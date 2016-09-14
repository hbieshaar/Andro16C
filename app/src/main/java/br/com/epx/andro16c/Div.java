package br.com.epx.andro16c;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;

public class Div extends View {
    float w, h, r;
    String t;
    Paint paint = new Paint();

    public Div(Context context, float r, String t) {
        super(context);
        this.r = r;
        this.t = t;
        paint.setStrokeWidth(0);
        if (t.equals("green")) {
            paint.setColor(Color.argb(30, 0, 255, 0));
        } else {
            paint.setColor(Color.argb(30, 255, 0, 0));
        }
    }

    protected void onMeasure(int wspec, int hspec) {
        w = MeasureSpec.getSize(wspec);
        h = MeasureSpec.getSize(hspec);
        setMeasuredDimension(wspec, hspec);
    }

    @Override
    public void onDraw(Canvas canvas) {
        RectF rect = new RectF(0, 0, w, h);
        canvas.drawRoundRect(rect, r, r, paint);
    }
}
