package se.carlberg.hem;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class HemQuickAddActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        float density = getResources().getDisplayMetrics().density;
        int pad = (int) (18 * density);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#EEF7F2"));
        cardBg.setCornerRadius(28 * density);
        cardBg.setStroke((int) (2 * density), Color.parseColor("#C3DFCF"));
        root.setBackground(cardBg);

        TextView subtitle = new TextView(this);
        subtitle.setText("HEM · INKÖPSLISTA WIDGET");
        subtitle.setTextSize(10f);
        subtitle.setTypeface(Typeface.DEFAULT_BOLD);
        subtitle.setTextColor(Color.parseColor("#4A6355"));
        root.addView(subtitle);

        TextView title = new TextView(this);
        title.setText("Lägg till vara direkt");
        title.setTextSize(18f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#14291E"));
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = (int) (2 * density);
        titleLp.bottomMargin = (int) (12 * density);
        root.addView(title, titleLp);

        final EditText nameInput = new EditText(this);
        nameInput.setHint("T.ex. Mjölk, Bröd, Kaffe...");
        nameInput.setSingleLine(true);
        nameInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        nameInput.setImeOptions(EditorInfo.IME_ACTION_DONE);
        nameInput.setTextSize(14f);
        nameInput.setTextColor(Color.parseColor("#141E18"));
        nameInput.setHintTextColor(Color.parseColor("#6A8274"));
        int inputPadH = (int) (14 * density);
        int inputPadV = (int) (11 * density);
        nameInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.WHITE);
        inputBg.setCornerRadius(16 * density);
        inputBg.setStroke((int) (1.5f * density), Color.parseColor("#C3DFCF"));
        nameInput.setBackground(inputBg);
        root.addView(nameInput, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        final EditText amountInput = new EditText(this);
        amountInput.setHint("Antal (valfritt, t.ex. 2 st)");
        amountInput.setSingleLine(true);
        amountInput.setTextSize(13f);
        amountInput.setTextColor(Color.parseColor("#141E18"));
        amountInput.setHintTextColor(Color.parseColor("#6A8274"));
        amountInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable amountBg = new GradientDrawable();
        amountBg.setColor(Color.WHITE);
        amountBg.setCornerRadius(16 * density);
        amountBg.setStroke((int) (1.5f * density), Color.parseColor("#C3DFCF"));
        amountInput.setBackground(amountBg);
        LinearLayout.LayoutParams amountLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        amountLp.topMargin = (int) (8 * density);
        root.addView(amountInput, amountLp);

        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setGravity(Gravity.END);
        LinearLayout.LayoutParams btnRowLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        btnRowLp.topMargin = (int) (14 * density);

        Button cancelBtn = new Button(this);
        cancelBtn.setText("Stäng");
        cancelBtn.setAllCaps(false);
        cancelBtn.setTextColor(Color.parseColor("#183D2C"));
        GradientDrawable cancelBg = new GradientDrawable();
        cancelBg.setColor(Color.parseColor("#D8F3E3"));
        cancelBg.setCornerRadius(16 * density);
        cancelBtn.setBackground(cancelBg);
        cancelBtn.setOnClickListener(v -> finish());
        btnRow.addView(cancelBtn);

        Button addBtn = new Button(this);
        addBtn.setText("+ Lägg till");
        addBtn.setAllCaps(false);
        addBtn.setTypeface(Typeface.DEFAULT_BOLD);
        addBtn.setTextColor(Color.parseColor("#A6F2C6"));
        GradientDrawable addBg = new GradientDrawable();
        addBg.setColor(Color.parseColor("#183D2C"));
        addBg.setCornerRadius(16 * density);
        addBtn.setBackground(addBg);
        LinearLayout.LayoutParams addBtnLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        addBtnLp.leftMargin = (int) (8 * density);
        addBtn.setOnClickListener(v -> {
            String rawName = nameInput.getText().toString().trim();
            if (rawName.isEmpty()) {
                Toast.makeText(this, "Skriv in en vara först", Toast.LENGTH_SHORT).show();
                return;
            }
            String rawAmt = amountInput.getText().toString().trim();
            String amt = "1";
            String unit = "st";
            if (!rawAmt.isEmpty()) {
                String[] parts = rawAmt.split("\\s+", 2);
                amt = parts[0];
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    unit = parts[1];
                }
            }
            HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), rawName, amt, unit);
            Toast.makeText(this, "Lade till " + rawName + " i inköpslistan", Toast.LENGTH_SHORT).show();
            finish();
        });
        btnRow.addView(addBtn, addBtnLp);

        root.addView(btnRow, btnRowLp);
        setContentView(root);
        nameInput.requestFocus();
    }
}
