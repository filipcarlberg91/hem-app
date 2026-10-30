package se.carlberg.hem;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
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

        Intent launchIntent = getIntent();
        final String targetTab = (launchIntent != null && "todo".equals(launchIntent.getStringExtra(HemWidgetBridge.EXTRA_TARGET_TAB)))
            ? "todo"
            : "shopping";
        final boolean isTodo = "todo".equals(targetTab);

        float density = getResources().getDisplayMetrics().density;
        int pad = (int) (18 * density);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#F0F3F8"));
        cardBg.setCornerRadius(24 * density);
        cardBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        root.setBackground(cardBg);

        TextView subtitle = new TextView(this);
        subtitle.setText(isTodo ? "HEM · ATT GÖRA WIDGET" : "HEM · INKÖPSLISTA WIDGET");
        subtitle.setTextSize(10f);
        subtitle.setTypeface(Typeface.DEFAULT_BOLD);
        subtitle.setTextColor(Color.parseColor("#5F6368"));
        root.addView(subtitle);

        TextView title = new TextView(this);
        title.setText(isTodo ? "Ny uppgift" : "Lägg till vara");
        title.setTextSize(18f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#1C1F26"));
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = (int) (2 * density);
        titleLp.bottomMargin = (int) (12 * density);
        root.addView(title, titleLp);

        final EditText nameInput = new EditText(this);
        nameInput.setHint(isTodo ? "T.ex. Boka tandläkare, Dammsuga..." : "T.ex. Mjölk, Bröd, Kaffe...");
        nameInput.setSingleLine(true);
        nameInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        nameInput.setImeOptions(EditorInfo.IME_ACTION_DONE);
        nameInput.setTextSize(14f);
        nameInput.setTextColor(Color.parseColor("#1C1F26"));
        nameInput.setHintTextColor(Color.parseColor("#757A84"));
        int inputPadH = (int) (14 * density);
        int inputPadV = (int) (11 * density);
        nameInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.WHITE);
        inputBg.setCornerRadius(14 * density);
        inputBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        nameInput.setBackground(inputBg);
        root.addView(nameInput, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        final EditText amountInput = new EditText(this);
        amountInput.setHint("Antal (valfritt, t.ex. 2 st)");
        amountInput.setSingleLine(true);
        amountInput.setTextSize(13f);
        amountInput.setTextColor(Color.parseColor("#1C1F26"));
        amountInput.setHintTextColor(Color.parseColor("#757A84"));
        amountInput.setPadding(inputPadH, inputPadV, inputPadH, inputPadV);
        GradientDrawable amountBg = new GradientDrawable();
        amountBg.setColor(Color.WHITE);
        amountBg.setCornerRadius(14 * density);
        amountBg.setStroke((int) (1.5f * density), Color.parseColor("#D5DCE6"));
        amountInput.setBackground(amountBg);
        LinearLayout.LayoutParams amountLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        amountLp.topMargin = (int) (8 * density);
        if (isTodo) {
            amountInput.setVisibility(View.GONE);
        }
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
        cancelBtn.setTextColor(Color.parseColor("#1C1F26"));
        GradientDrawable cancelBg = new GradientDrawable();
        cancelBg.setColor(Color.parseColor("#DFE4EC"));
        cancelBg.setCornerRadius(999 * density);
        cancelBtn.setBackground(cancelBg);
        cancelBtn.setOnClickListener(v -> finish());
        btnRow.addView(cancelBtn);

        Button addBtn = new Button(this);
        addBtn.setText("+ Lägg till");
        addBtn.setAllCaps(false);
        addBtn.setTypeface(Typeface.DEFAULT_BOLD);
        addBtn.setTextColor(Color.WHITE);
        GradientDrawable addBg = new GradientDrawable();
        addBg.setColor(Color.parseColor("#242942"));
        addBg.setCornerRadius(999 * density);
        addBtn.setBackground(addBg);
        LinearLayout.LayoutParams addBtnLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        addBtnLp.leftMargin = (int) (8 * density);
        addBtn.setOnClickListener(v -> {
            String rawName = nameInput.getText().toString().trim();
            if (rawName.isEmpty()) {
                Toast.makeText(this, isTodo ? "Skriv in en uppgift först" : "Skriv in en vara först", Toast.LENGTH_SHORT).show();
                return;
            }
            if (isTodo) {
                HemWidgetBridge.handleWidgetQuickAddTodoItem(getApplicationContext(), rawName);
                Toast.makeText(this, "Lade till uppgiften " + rawName, Toast.LENGTH_SHORT).show();
            } else {
                String rawAmt = amountInput.getText().toString().trim();
                String amt = "1";
                String unit = "st";
                if (!rawAmt.isEmpty()) {
                    String[] parts = rawAmt.split("\\s+", 2);
                    amt = parts[0];
                    if (parts.length > 1 && !parts[1].isEmpty()) {
                        unit = parts.length > 1 ? parts[1] : "st";
                    }
                }
                HemWidgetBridge.handleWidgetQuickAddShoppingItem(getApplicationContext(), rawName, amt, unit);
                Toast.makeText(this, "Lade till " + rawName + " i inköpslistan", Toast.LENGTH_SHORT).show();
            }
            finish();
        });
        btnRow.addView(addBtn, addBtnLp);

        root.addView(btnRow, btnRowLp);
        setContentView(root);
        nameInput.requestFocus();
    }
}
